import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import FaceVerification from '../../components/FaceVerification';
import LocationPicker from '../../components/LocationPicker';
import MapView from '../../components/MapView';
import { ShoppingCart, Star, Search, X, User, Plus, MapPin, Map, Calculator } from 'lucide-react';
import { productService, orderService, userService } from '../../services/apiService';
import useCartStore from '../../store/cartStore';
import toast from 'react-hot-toast';

const Products = () => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(null);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Location states
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleOrder = async (product) => {
    showRiderSelection(product);
  };

  const showRiderSelection = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    
    // Automatically set seller location as pickup
    if (product.sellerLocation && product.sellerAddress) {
      setPickupAddress(product.sellerAddress);
      setPickupCoords(product.sellerLocation);
    } else {
      setPickupAddress('');
      setPickupCoords(null);
    }
    
    setDeliveryAddress('');
    setDeliveryCoords(null);
    setDeliveryFee(0);
    setDistance(0);
    setShowRiderModal(true);
    setLoadingRiders(true);
    
    try {
      const response = await userService.getRiders();
      setRiders(response.data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to load riders');
    } finally {
      setLoadingRiders(false);
    }
  };

  // Location selection functions
  const handlePickupLocationSelect = (location) => {
    setPickupAddress(location.address);
    setPickupCoords({ lat: location.lat, lng: location.lng });
    setShowPickupMap(false);
    
    // Calculate delivery fee if both locations are selected
    if (deliveryCoords) {
      calculateDeliveryFee({ lat: location.lat, lng: location.lng }, deliveryCoords);
    }
  };

  const handleDeliveryLocationSelect = (location) => {
    setDeliveryAddress(location.address);
    setDeliveryCoords({ lat: location.lat, lng: location.lng });
    setShowDeliveryMap(false);
    
    // Calculate delivery fee if both locations are selected
    if (pickupCoords) {
      calculateDeliveryFee(pickupCoords, { lat: location.lat, lng: location.lng });
    }
  };

  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const calculateDeliveryPrice = (distanceKm) => {
    const baseFee = 50;
    const perKmRate = 10;
    return baseFee + (distanceKm * perKmRate);
  };

  const calculateDeliveryFee = (pickup, delivery) => {
    const dist = calculateDistance(pickup, delivery);
    const fee = calculateDeliveryPrice(dist);
    setDistance(dist);
    setDeliveryFee(fee);
  };

  const confirmOrder = async () => {
    if (!selectedRider) {
      toast.error('Please select a rider');
      return;
    }

    if (!deliveryAddress) {
      toast.error('Please select your delivery location');
      return;
    }
    
    if (!pickupAddress) {
      toast.error('Seller location not available');
      return;
    }

    if (!pickupCoords || !deliveryCoords) {
      toast.error('Please select valid locations with coordinates');
      return;
    }

    // Show face verification before confirming order
    if (!isVerified) {
      setShowFaceVerification(true);
      return;
    }

    setOrdering(selectedProduct.id);
    try {
      const subtotal = selectedProduct.price * quantity;
      const total = subtotal + deliveryFee;
      
      // Normalize coordinates to { latitude, longitude } to match backend/frontend expectations
      const normalizeCoords = (c) => {
        if (!c) return null;
        return {
          latitude: c.latitude ?? c.lat ?? c.latitude ?? null,
          longitude: c.longitude ?? c.lng ?? c.long ?? c.longitude ?? null
        };
      };

      const orderData = {
        deliveryType: 'product',
        items: [{
          product: selectedProduct.id,
          quantity: quantity,
          price: selectedProduct.price
        }],
        totalAmount: total,
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddress,
        pickupCoordinates: normalizeCoords(pickupCoords),
        deliveryCoordinates: normalizeCoords(deliveryCoords),
        deliveryFee: deliveryFee,
        distance: distance,
        paymentMethod: 'Cash on Delivery',
        notes: `Order for ${selectedProduct.name} (Qty: ${quantity})`,
        preferredRider: selectedRider
      };
      
      await orderService.createOrder(orderData);
      toast.success('Order placed successfully!');
      setShowRiderModal(false);
      setSelectedProduct(null);
      setSelectedRider(null);
      setQuantity(1);
      setPickupAddress('');
      setDeliveryAddress('');
      setPickupCoords(null);
      setDeliveryCoords(null);
      setDeliveryFee(0);
      setDistance(0);
      navigate('/buyer/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrdering(null);
    }
  };

  const categories = ['all', 'Electronics', 'Fashion', 'Food', 'Groceries', 'Home', 'Sports', 'Other'];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products or sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No products found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-6xl">🍌</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  
                  {/* Rating */}
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= Math.round(product.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.averageRating.toFixed(1)} ({product.reviewCount || 0})
                      </span>
                    </div>
                  )}
                  
                  {/* Seller Info */}
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Seller:</span> {product.sellerBusinessName || product.sellerName}
                    </p>
                    {product.sellerAddress && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        📍 {product.sellerAddress}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">{product.category}</span>
                    <span className="text-xs text-gray-500 ml-auto">Stock: {product.stock}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-primary-600">₱{product.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 px-3 py-2 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                        Cart
                      </button>
                      <button 
                        onClick={() => handleOrder(product)}
                        disabled={ordering === product.id || product.stock === 0}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={18} />
                        {ordering === product.id ? 'Ordering...' : product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rider Selection Modal */}
        {showRiderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-900">Complete Your Order</h2>
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedProduct(null);
                    setSelectedRider(null);
                    setQuantity(1);
                    setPickupAddress('');
                    setDeliveryAddress('');
                    setPickupCoords(null);
                    setDeliveryCoords(null);
                    setDeliveryFee(0);
                    setDistance(0);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Info */}
                {selectedProduct && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Ordering:</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600">₱{selectedProduct.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">Quantity:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-semibold">{quantity}</span>
                          <button
                            onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-primary-600 mt-2">
                      Subtotal: ₱{(selectedProduct.price * quantity).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Location Selection with Map */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Map size={20} className="text-primary-600" />
                    Delivery Map
                  </h3>
                  
                  {/* Big Interactive Map */}
                  <MapView
                    sellerLocation={pickupCoords}
                    sellerName={selectedProduct.sellerBusinessName || selectedProduct.sellerName}
                    riderLocation={selectedRider ? riders.find(r => r.id === selectedRider)?.location : null}
                    riderName={selectedRider ? riders.find(r => r.id === selectedRider)?.name : null}
                    buyerLocation={deliveryCoords}
                  />
                  
                  {/* Pickup Location (Read-only - Seller Location) */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <label className="flex items-center gap-2 text-sm font-medium text-orange-800 mb-2">
                      <MapPin size={16} className="text-orange-600" />
                      Pickup Location (Seller)
                    </label>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{selectedProduct.sellerBusinessName || selectedProduct.sellerName}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{pickupAddress}</p>
                  </div>

                  {/* Delivery Location (Buyer selects) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Delivery Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deliveryAddress}
                        readOnly
                        placeholder="Click 'Pin My Location' to select your delivery address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => setShowDeliveryMap(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                      >
                        <MapPin size={18} />
                        Pin My Location
                      </button>
                    </div>
                  </div>

                  {/* Distance and Delivery Fee Display */}
                  {distance > 0 && deliveryFee > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-800 mb-2">
                        <Calculator size={18} />
                        <span className="font-semibold">Delivery Calculation</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Distance:</p>
                          <p className="font-semibold text-blue-700">{distance.toFixed(2)} km</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Delivery Fee:</p>
                          <p className="font-semibold text-blue-700">₱{deliveryFee.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Subtotal ({quantity}x):</span>
                          <span className="font-semibold">₱{(selectedProduct.price * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-lg font-bold text-blue-900">Total:</span>
                          <span className="text-xl font-bold text-blue-900">₱{(selectedProduct.price * quantity + deliveryFee).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Available Riders */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Select a Rider</h3>
                  
                  {loadingRiders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading riders...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {/* Nearby Rider Option */}
                      <div
                        onClick={() => setSelectedRider('nearby')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedRider === 'nearby'
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white">
                              <MapPin size={24} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Nearby Rider Available</p>
                              <p className="text-sm text-gray-600">Auto-assign nearest rider</p>
                              <p className="text-xs text-green-600 mt-1">⚡ Fastest option</p>
                            </div>
                          </div>
                          {selectedRider === 'nearby' && (
                            <div className="text-green-600 font-semibold">✓ Selected</div>
                          )}
                        </div>
                      </div>

                      {riders.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No specific riders to choose from. Use nearby option above.
                        </div>
                      ) : (
                        riders.map((rider) => (
                        <div
                          key={rider.id}
                          onClick={() => setSelectedRider(rider.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedRider === rider.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {rider.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{rider.name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <User size={14} />
                                  {rider.phone}
                                </p>
                                {rider.currentAddress && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin size={12} />
                                    {rider.currentAddress}
                                  </p>
                                )}
                                {rider.rating > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star size={14} className="text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600">
                                      {rider.rating.toFixed(1)} ({rider.totalRatings} ratings)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedRider === rider.id && (
                              <div className="text-primary-600 font-semibold">✓ Selected</div>
                            )}
                          </div>
                        </div>
                      )))
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedProduct(null);
                    setSelectedRider(null);
                    setQuantity(1);
                    setPickupAddress('');
                    setDeliveryAddress('');
                    setPickupCoords(null);
                    setDeliveryCoords(null);
                    setDeliveryFee(0);
                    setDistance(0);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={!selectedRider || !pickupAddress || !deliveryAddress || ordering}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {ordering ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showFaceVerification && (
          <FaceVerification
            onSuccess={() => {
              setShowFaceVerification(false);
              setIsVerified(true);
              toast.success('Face verified successfully!');
              // After verification, proceed with order confirmation
              confirmOrder();
            }}
            onCancel={() => {
              setShowFaceVerification(false);
            }}
          />
        )}

        {/* Location Picker Modal - Only for Delivery */}
        {showDeliveryMap && (
          <LocationPicker
            onLocationSelect={handleDeliveryLocationSelect}
            onClose={() => setShowDeliveryMap(false)}
            title="Select Your Delivery Location"
          />
        )}
      </div>
    </Layout>
  );
};

export default Products;
