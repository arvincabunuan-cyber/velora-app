import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LocationPicker from '../../components/LocationPicker';
import { Trash2, Plus, Minus, ShoppingCart, X, User, Star, MapPin, Map, Calculator } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import { orderService, userService } from '../../services/apiService';
import { calculateDeliveryEstimate } from '../../utils/distanceCalculator';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCartStore();
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [ordering, setOrdering] = useState(false);
  
  // Location states
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [distance, setDistance] = useState(0);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Proceed directly to rider selection
    showRiderSelection();
  };

  const handlePickupSelect = (location, address) => {
    setPickupCoords(location);
    setPickupAddress(address);
    setShowPickupPicker(false);
    
    // Calculate delivery fee if both locations are set
    if (deliveryCoords) {
      const estimate = calculateDeliveryEstimate(location, deliveryCoords);
      setDistance(estimate.distance);
      setDeliveryFee(estimate.price);
    }
  };

  const handleDeliverySelect = (location, address) => {
    setDeliveryCoords(location);
    setDeliveryAddress(address);
    setShowDeliveryPicker(false);
    
    // Calculate delivery fee if both locations are set
    if (pickupCoords) {
      const estimate = calculateDeliveryEstimate(pickupCoords, location);
      setDistance(estimate.distance);
      setDeliveryFee(estimate.price);
    }
  };

  const showRiderSelection = async () => {
    if (!pickupAddress || !deliveryAddress) {
      toast.error('Please select both pickup and delivery locations');
      return;
    }

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

  const confirmOrder = async () => {
    if (!selectedRider) {
      toast.error('Please select a rider');
      return;
    }

    setOrdering(true);
    try {
      const orderData = {
        deliveryType: 'product',
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getTotal() + deliveryFee,
        deliveryFee: deliveryFee,
        distance: distance,
        pickupAddress: pickupAddress,
        deliveryAddress: deliveryAddress,
        pickupCoordinates: pickupCoords,
        deliveryCoordinates: deliveryCoords,
        paymentMethod: 'Cash on Delivery',
        notes: `Cart order with ${items.length} item(s)`,
        preferredRider: selectedRider
      };
      
      await orderService.createOrder(orderData);
      toast.success('Order placed successfully!');
      clearCart();
      setShowRiderModal(false);
      setSelectedRider(null);
      setPickupAddress('');
      setDeliveryAddress('');
      setPickupCoords(null);
      setDeliveryCoords(null);
      setDeliveryFee(50);
      setDistance(0);
      navigate('/buyer/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                  toast.success('Cart cleared');
                }
              }}
              className="text-red-600 hover:text-red-700 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <button
              onClick={() => navigate('/buyer/products')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex gap-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-3xl">
                        🍌
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <button
                          onClick={() => {
                            removeFromCart(item.id);
                            toast.success('Item removed from cart');
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              if (item.quantity >= item.stock) {
                                toast.error('Cannot add more than available stock');
                                return;
                              }
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg"
                          >
                            <Plus size={16} />
                          </button>
                          <span className="text-sm text-gray-600 ml-2">
                            (Stock: {item.stock})
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary-600">₱{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">₱{item.price} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Location Selection */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="text-orange-600" />
                      Pickup Location
                    </label>
                    <button
                      onClick={() => setShowPickupPicker(true)}
                      className="w-full p-3 text-left border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors"
                    >
                      {pickupAddress || 'Click to select pickup location'}
                    </button>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="text-green-600" />
                      Delivery Location
                    </label>
                    <button
                      onClick={() => setShowDeliveryPicker(true)}
                      className="w-full p-3 text-left border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors"
                    >
                      {deliveryAddress || 'Click to select delivery location'}
                    </button>
                  </div>

                  {/* Distance and Fee Calculation */}
                  {pickupCoords && deliveryCoords && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Delivery Estimate</span>
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
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>₱{getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₱{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₱{(getTotal() + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={!pickupAddress || !deliveryAddress}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/buyer/products')}
                  className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rider Selection Modal */}
        {showRiderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Rider</h2>
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedRider(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cart Total:</p>
                  <p className="text-2xl font-bold text-primary-600">₱{(getTotal() + deliveryFee).toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} item(s) + ₱{deliveryFee.toFixed(2)} delivery fee
                  </p>
                  {distance > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Distance: {distance.toFixed(2)} km
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Riders</h3>
                  
                  {loadingRiders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading riders...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
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
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                {rider.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{rider.name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <User size={14} />
                                  {rider.phone}
                                </p>
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

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedRider(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  disabled={!selectedRider || ordering}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {ordering ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Pickers */}
        {showPickupPicker && (
          <LocationPicker
            onLocationSelect={handlePickupSelect}
            onClose={() => setShowPickupPicker(false)}
            title="Select Pickup Location"
          />
        )}

        {showDeliveryPicker && (
          <LocationPicker
            onLocationSelect={handleDeliverySelect}
            onClose={() => setShowDeliveryPicker(false)}
            title="Select Delivery Location"
          />
        )}
      </div>
    </Layout>
  );
};

export default Cart;
