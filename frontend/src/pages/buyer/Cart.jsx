import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import FaceVerification from '../../components/FaceVerification';
import { Trash2, Plus, Minus, ShoppingCart, X, User, Star } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import { orderService, userService } from '../../services/apiService';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getTotal } = useCartStore();
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!isVerified) {
      setShowFaceVerification(true);
      return;
    }

    // Proceed to show rider modal after verification
    showRiderSelection();
  };

  const showRiderSelection = async () => {
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
        totalAmount: getTotal(),
        pickupAddress: 'Seller location - Mindoro, Philippines',
        deliveryAddress: 'Buyer delivery address - Mindoro, Philippines',
        paymentMethod: 'Cash on Delivery',
        notes: `Cart order with ${items.length} item(s)`,
        preferredRider: selectedRider
      };
      
      await orderService.createOrder(orderData);
      toast.success('Order placed successfully!');
      clearCart();
      setShowRiderModal(false);
      setSelectedRider(null);
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
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>₱{getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₱50.00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₱{(getTotal() + 50).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
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
                  <p className="text-2xl font-bold text-primary-600">₱{(getTotal() + 50).toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} item(s) + ₱50 delivery fee
                  </p>
                </div>

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
              showRiderSelection();
            }}
            onCancel={() => {
              setShowFaceVerification(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Cart;
