import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { orderService } from '../../services/apiService';
import toast from 'react-hot-toast';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { Star } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, order: null, product: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [mapModal, setMapModal] = useState({ isOpen: false, order: null });
  const [socket, setSocket] = useState(null);
  const [liveLocations, setLiveLocations] = useState({}); // keyed by deliveryId
  const [trackedDeliveryId, setTrackedDeliveryId] = useState(null);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    
    if (user?.role !== 'buyer') {
      toast.error('Please log in as a buyer to view orders');
      navigate('/login');
      return;
    }
    
    fetchOrders();
    // establish socket connection for live updates
    let s;
    if (user) {
      s = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      s.on('connect', () => {
        console.log('Orders socket connected');
        s.emit('join', user.id);
      });

      s.on('orderUpdate', (data) => {
        console.log('Orders page received orderUpdate', data);
        setOrders(prev => prev.map(o => {
          if (!o) return o;
          // Match by id/_id or by orderNumber (helps debug/testing)
          if (String(o.id) === String(data.orderId) || String(o._id) === String(data.orderId) || (data.orderNumber && o.orderNumber === data.orderNumber)) {
            return { ...o, status: data.status };
          }
          return o;
        }));
      });

      s.on('locationUpdated', (data) => {
        // update live location for currently tracked delivery
        console.log('locationUpdated event', data, 'trackedDeliveryId', trackedDeliveryId);
        if (trackedDeliveryId) {
          setLiveLocations(prev => ({ ...prev, [trackedDeliveryId]: data.location }));
        }
      });

      setSocket(s);
    }

    return () => {
      if (s) s.disconnect();
      if (socket) {
        try { socket.disconnect(); } catch (e) {}
      }
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getBuyerOrders();
      console.log('Orders API response:', response);
      console.log('Orders data:', response.data);
      console.log('First order createdAt:', response.data[0]?.createdAt);
      console.log('First order createdAt type:', typeof response.data[0]?.createdAt);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      
      // Handle Firestore Timestamp with seconds
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleDateString();
      }
      
      // Handle regular date string or timestamp
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Date formatting error:', error, dateValue);
      return 'N/A';
    }
  };

  // Fix for default marker icons in React-Leaflet
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      // Use embedded SVG data URL to avoid blocked CDN requests (tracking prevention)
      iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
      shadowUrl: ''
    });
  } catch (e) {
    // ignore in non-browser environments
  }

  const openMapModal = (order) => {
    setMapModal({ isOpen: true, order });
    // If order has an associated delivery, join delivery room to receive live location
    const deliveryId = order?.deliveryId || order?.delivery?._id || order?.delivery?._id || order?.deliveryId;
    if (deliveryId && socket) {
      try {
        socket.emit('trackDelivery', deliveryId);
        setTrackedDeliveryId(deliveryId);
      } catch (e) {
        console.error('Failed to join delivery room', e);
      }
    } else {
      setTrackedDeliveryId(null);
    }
  };

  const closeMapModal = () => {
    setMapModal({ isOpen: false, order: null });
  };

  const getMapCenter = (order) => {
    const pickup = order?.pickupCoordinates;
    const delivery = order?.deliveryCoordinates;
    if (pickup?.latitude && pickup?.longitude) return [pickup.latitude, pickup.longitude];
    if (delivery?.latitude && delivery?.longitude) return [delivery.latitude, delivery.longitude];
    return [13.4119, 121.1800];
  };

  const handleCancelOrder = async (orderId) => {
    console.log('Canceling order:', orderId);
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await orderService.cancelOrder(orderId, 'Cancelled by buyer');
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const openReviewModal = (order, productId) => {
    const product = order.items?.find(item => item.productId === productId);
    setReviewModal({ isOpen: true, order, product });
    setReviewData({ rating: 5, comment: '' });
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, order: null, product: null });
    setReviewData({ rating: 5, comment: '' });
  };

  const submitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reviews`,
        {
          productId: reviewModal.product?.productId,
          orderId: reviewModal.order?.id,
          rating: reviewData.rating,
          comment: reviewData.comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      toast.success('Review submitted successfully!');
      closeReviewModal();
      fetchOrders();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium
                        ${order.deliveryType === 'document' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {order.deliveryType === 'document' ? '📄 Document' : '📦 Product'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                    {(order.status === 'picked_up' || order.status === 'processing') && (
                      <button
                        onClick={() => navigate(`/buyer/track-order/${order.id}`)}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                      >
                        Track Order
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4">
                  {order.deliveryType === 'document' && order.documentDetails ? (
                    <>
                      <p className="text-sm text-gray-600">Document: {order.documentDetails.description}</p>
                      <p className="text-sm text-gray-600">Quantity: {order.documentDetails.quantity}</p>
                      {order.documentDetails.isFragile && (
                        <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">⚠️ Fragile</span>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">Items: {order.items?.length || 0}</p>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center text-2xl">
                                📦
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × ₱{item.price}</p>
                            </div>
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => openReviewModal(order, item.productId)}
                                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 flex items-center gap-1"
                              >
                                <Star size={14} />
                                Review
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Rider Information */}
                  {order.riderName && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">🚴 Rider Information</p>
                      <p className="text-sm text-blue-800">Name: {order.riderName}</p>
                      {order.riderPhone && (
                        <p className="text-sm text-blue-800">Phone: {order.riderPhone}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Products Total: ₱{order.totalAmount || 0}</p>
                    <p className="text-sm text-gray-600">Shipping Fee: ₱{order.deliveryFee || 0}</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">Grand Total: ₱{((order.totalAmount || 0) + (order.deliveryFee || 0)).toFixed(2)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openMapModal(order)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Map
                    </button>
                    {(order.status === 'picked_up' || order.status === 'processing') && (
                      <button
                        onClick={() => navigate(`/buyer/track-order/${order.id}`)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        Track Order
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map Modal */}
        {mapModal.isOpen && mapModal.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Order Map - {mapModal.order.orderNumber}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/buyer/track-order/${mapModal.order.id}`)} className="px-3 py-1 bg-primary-600 text-white rounded-md">Open Live Tracker</button>
                  <button onClick={closeMapModal} className="px-3 py-1 bg-gray-200 rounded-md">Close</button>
                </div>
              </div>

              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden border-2 border-gray-200">
                <MapContainer center={getMapCenter(mapModal.order)} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Pickup Marker */}
                  {mapModal.order.pickupCoordinates?.latitude && mapModal.order.pickupCoordinates?.longitude && (
                    <Marker position={[mapModal.order.pickupCoordinates.latitude, mapModal.order.pickupCoordinates.longitude]}>
                      <Popup><strong>Pickup</strong><div className="text-xs">{mapModal.order.pickupAddress}</div></Popup>
                    </Marker>
                  )}

                  {/* Delivery Marker */}
                  {mapModal.order.deliveryCoordinates?.latitude && mapModal.order.deliveryCoordinates?.longitude && (
                    <Marker position={[mapModal.order.deliveryCoordinates.latitude, mapModal.order.deliveryCoordinates.longitude]}>
                      <Popup><strong>Delivery</strong><div className="text-xs">{mapModal.order.deliveryAddress}</div></Popup>
                    </Marker>
                  )}

                  {/* Rider live location (if available) */}
                  {mapModal.order?.deliveryId && liveLocations[mapModal.order.deliveryId] && (
                    (() => {
                      const loc = liveLocations[mapModal.order.deliveryId];
                      const lat = loc.latitude ?? loc.lat ?? loc[0];
                      const lng = loc.longitude ?? loc.lng ?? loc[1];
                      if (lat && lng) {
                        return (
                          <Marker position={[lat, lng]}>
                            <Popup><strong>Rider (Live)</strong><div className="text-xs">Updated just now</div></Popup>
                          </Marker>
                        );
                      }
                      return null;
                    })()
                  )}

                  {/* Route Line */}
                  {mapModal.order.pickupCoordinates?.latitude && mapModal.order.pickupCoordinates?.longitude && mapModal.order.deliveryCoordinates?.latitude && mapModal.order.deliveryCoordinates?.longitude && (
                    <Polyline positions={[
                      [mapModal.order.pickupCoordinates.latitude, mapModal.order.pickupCoordinates.longitude],
                      [mapModal.order.deliveryCoordinates.latitude, mapModal.order.deliveryCoordinates.longitude]
                    ]} color="#3B82F6" weight={3} opacity={0.7} />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Product: {reviewModal.product?.name}</p>
                <p className="text-sm text-gray-600 mb-4">Order: {reviewModal.order?.orderNumber}</p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={star <= reviewData.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows="4"
                    placeholder="Share your experience with this product..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={submitReview}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Submit Review
                </button>
                <button
                  onClick={closeReviewModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
