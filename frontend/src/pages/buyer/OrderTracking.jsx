import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { deliveryService, orderService } from '../../services/apiService';
import { MapPin, Package, Truck, CheckCircle, Clock, Phone, User } from 'lucide-react';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    // Auto-refresh every 10 seconds to get live rider location
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const orderRes = await orderService.getOrder(orderId);
      if (orderRes.success) {
        setOrder(orderRes.data);
        
        // If order has delivery, fetch delivery details with rider location
        if (orderRes.data.delivery) {
          const deliveryRes = await deliveryService.trackDelivery(orderRes.data.delivery);
          if (deliveryRes.success) {
            setDelivery(deliveryRes.data);
            
            // Update rider location if available
            if (deliveryRes.data.rider?.currentLocation) {
              setRiderLocation(deliveryRes.data.rider.currentLocation);
            }
          }
        }
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={24} />;
      case 'processing':
        return <Package className="text-blue-500" size={24} />;
      case 'picked_up':
        return <Truck className="text-orange-500" size={24} />;
      case 'delivered':
        return <CheckCircle className="text-green-500" size={24} />;
      default:
        return <Package className="text-gray-500" size={24} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Being Prepared';
      case 'picked_up':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const getMapUrl = () => {
    if (!riderLocation || !riderLocation.latitude || !riderLocation.longitude) {
      // Default to Mindoro, Philippines
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d988876.4505826346!2d120.60877047812502!3d12.999999999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a0272f8e2f3e3d%3A0x8b7c9c1f9e2f3e3d!2sMindoro%2C%20Philippines!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus";
    }
    
    // Create map with rider's live location
    const { latitude, longitude } = riderLocation;
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${latitude},${longitude}&zoom=15&maptype=roadmap`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Orders
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Track Order</h1>
          <button
            onClick={() => navigate('/buyer/orders')}
            className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-md"
          >
            Back to Orders
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order #{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">₱{order.totalAmount}</p>
              <p className="text-sm text-gray-500">{order.paymentMethod}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Items:</h3>
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <span className="text-gray-700">{item.name || item.productName} (x{item.quantity})</span>
                <span className="text-gray-900 font-medium">₱{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Rider Location Map */}
        {delivery && delivery.status !== 'delivered' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="text-red-500" size={24} />
                Live Rider Location
              </h2>
              {riderLocation?.lastUpdated && (
                <span className="text-sm text-gray-500">
                  Updated: {new Date(riderLocation.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <iframe
                src={getMapUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            {riderLocation?.latitude && riderLocation?.longitude && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Rider Position:</strong> {riderLocation.latitude.toFixed(6)}, {riderLocation.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  📍 Location updates every 10 seconds automatically
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rider Information */}
        {delivery?.rider && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={24} className="text-primary-600" />
              Your Rider
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Name:</strong> {delivery.rider.name}
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <Phone size={16} />
                <strong>Phone:</strong> {delivery.rider.phone}
              </p>
            </div>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Status</h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Status Steps */}
            <div className="space-y-6">
              {delivery?.tracking?.map((track, index) => (
                <div key={index} className="relative flex items-start gap-4">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-primary-600">
                    {getStatusIcon(track.status)}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold text-gray-900">{getStatusText(track.status)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(track.timestamp).toLocaleString()}
                    </p>
                    {track.note && (
                      <p className="text-sm text-gray-600 mt-1">{track.note}</p>
                    )}
                    {track.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        Location: {track.location.latitude?.toFixed(6)}, {track.location.longitude?.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              )) || (
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{getStatusText(order.status)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
          <p className="text-gray-700">{order.deliveryAddress}</p>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;
