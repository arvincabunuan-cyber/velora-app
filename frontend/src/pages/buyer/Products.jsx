import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import FaceVerification from '../../components/FaceVerification';
import { ShoppingCart, Star, Search, X, User, Plus } from 'lucide-react';
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
    if (!isVerified) {
      setSelectedProduct(product);
      setShowFaceVerification(true);
      return;
    }

    // Proceed to show rider modal after verification
    showRiderSelection(product);
  };

  const showRiderSelection = async (product) => {
    setSelectedProduct(product);
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

    setOrdering(selectedProduct.id);
    try {
      const orderData = {
        deliveryType: 'product',
        items: [{
          product: selectedProduct.id,
          quantity: 1,
          price: selectedProduct.price
        }],
        totalAmount: selectedProduct.price,
        pickupAddress: 'Seller location - Mindoro, Philippines',
        deliveryAddress: 'Buyer delivery address - Mindoro, Philippines',
        paymentMethod: 'Cash on Delivery',
        notes: `Order for ${selectedProduct.name}`,
        preferredRider: selectedRider
      };
      
      await orderService.createOrder(orderData);
      toast.success('Order placed successfully!');
      setShowRiderModal(false);
      setSelectedProduct(null);
      setSelectedRider(null);
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Rider</h2>
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedProduct(null);
                    setSelectedRider(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {selectedProduct && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Ordering:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                    <p className="text-xl font-bold text-primary-600">₱{selectedProduct.price}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Riders</h3>
                  
                  {loadingRiders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading riders...</p>
                    </div>
                  ) : riders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No riders available at the moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {riders.map((rider) => (
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
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setShowRiderModal(false);
                    setSelectedProduct(null);
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

        {showFaceVerification && (
          <FaceVerification
            onSuccess={() => {
              setShowFaceVerification(false);
              setIsVerified(true);
              toast.success('Face verified successfully!');
              if (selectedProduct) {
                showRiderSelection(selectedProduct);
              }
            }}
            onCancel={() => {
              setShowFaceVerification(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Products;
