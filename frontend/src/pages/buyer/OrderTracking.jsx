import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { deliveryService, orderService } from '../../services/apiService';
import { MapPin, Package, Truck, CheckCircle, Clock, Phone, User, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  // Use embedded SVG data URL to avoid blocked CDN requests (tracking prevention)
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  shadowUrl: ''
});

// Custom rider icon
const riderIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [riderLocation, setRiderLocation] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    // Auto-refresh every 5 seconds to get live rider location
    const interval = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      // Firestore Timestamp
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      // Firestore-like object with seconds
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleDateString();
      }
      // Number (ms)
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toLocaleDateString();
      }
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleString();
      }
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleString();
      }
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toLocaleString();
      }
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const orderRes = await orderService.getOrder(orderId);
      if (orderRes.success) {
        setOrder(orderRes.data);
        
        // Set pickup and delivery coordinates from order
        // Normalize stored coordinates: support either { latitude, longitude } or { lat, lng }
        const normalizeFromOrder = (c) => {
          if (!c) return null;
          return {
            latitude: c.latitude ?? c.lat ?? c.latitude ?? null,
            longitude: c.longitude ?? c.lng ?? c.long ?? c.longitude ?? null
          };
        };

        if (orderRes.data.pickupCoordinates) {
            setPickupCoords(normalizeFromOrder(orderRes.data.pickupCoordinates));
          }
          if (orderRes.data.deliveryCoordinates) {
            setDeliveryCoords(normalizeFromOrder(orderRes.data.deliveryCoordinates));
          }
        
        // If order has delivery, fetch delivery details with rider location
        if (orderRes.data.delivery) {
          const deliveryRes = await deliveryService.trackDelivery(orderRes.data.delivery);
          if (deliveryRes.success) {
            setDelivery(deliveryRes.data);
            
            // Update rider location if available
            if (deliveryRes.data.rider?.currentLocation) {
              setRiderLocation(deliveryRes.data.rider.currentLocation);
            } else if (deliveryRes.data.riderLocation) {
              setRiderLocation(deliveryRes.data.riderLocation);
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

  // Calculate map center and zoom based on available coordinates
  const getMapCenter = () => {
    if (riderLocation?.latitude && riderLocation?.longitude) {
      return [riderLocation.latitude, riderLocation.longitude];
    }
    if (pickupCoords?.latitude && pickupCoords?.longitude) {
      return [pickupCoords.latitude, pickupCoords.longitude];
    }
    if (deliveryCoords?.latitude && deliveryCoords?.longitude) {
      return [deliveryCoords.latitude, deliveryCoords.longitude];
    }
    // Default to Calapan, Oriental Mindoro
    return [13.4119, 121.1800];
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  const getDistanceToDestination = () => {
    if (!riderLocation?.latitude || !deliveryCoords?.latitude) return null;
    return calculateDistance(
      riderLocation.latitude,
      riderLocation.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    ).toFixed(2);
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
              <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
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
        {(order.status === 'picked_up' || order.status === 'processing') && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Navigation className="text-red-500" size={24} />
                Live Tracking Map
              </h2>
              <div className="text-right">
                {riderLocation?.lastUpdated && (
                  <span className="text-sm text-gray-500 block">
                    Updated: {formatDateTime(riderLocation.lastUpdated)}
                  </span>
                )}
                {getDistanceToDestination() && (
                  <span className="text-sm font-medium text-primary-600">
                    {getDistanceToDestination()} km away
                  </span>
                )}
              </div>
            </div>
            
            <div className="rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '500px' }}>
              <MapContainer
                center={getMapCenter()}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Pickup Location Marker */}
                {pickupCoords?.latitude && pickupCoords?.longitude && (
                  <Marker position={[pickupCoords.latitude, pickupCoords.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <strong>📍 Pickup Location</strong>
                        <p className="text-xs text-gray-600 mt-1">{order.pickupAddress}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Rider Current Location Marker */}
                {riderLocation?.latitude && riderLocation?.longitude && (
                  <Marker 
                    position={[riderLocation.latitude, riderLocation.longitude]}
                    icon={riderIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong className="text-red-600">🚴 Rider Location</strong>
                        {order.riderName && <p className="text-xs mt-1">{order.riderName}</p>}
                        <p className="text-xs text-gray-600">
                          Last updated: {formatDateTime(riderLocation.lastUpdated || Date.now())}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Delivery Destination Marker */}
                {deliveryCoords?.latitude && deliveryCoords?.longitude && (
                  <Marker position={[deliveryCoords.latitude, deliveryCoords.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <strong className="text-green-600">🏠 Your Location</strong>
                        <p className="text-xs text-gray-600 mt-1">{order.deliveryAddress}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Route Line from Rider to Destination */}
                {riderLocation?.latitude && deliveryCoords?.latitude && (
                  <Polyline
                    positions={[
                      [riderLocation.latitude, riderLocation.longitude],
                      [deliveryCoords.latitude, deliveryCoords.longitude]
                    ]}
                    color="#3B82F6"
                    weight={3}
                    opacity={0.7}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">📍 Pickup</p>
                <p className="text-sm text-blue-900 truncate">{order.pickupAddress || 'N/A'}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700 font-medium">🚴 Rider</p>
                <p className="text-sm text-red-900">
                  {riderLocation?.latitude && riderLocation?.longitude
                    ? `${riderLocation.latitude.toFixed(4)}, ${riderLocation.longitude.toFixed(4)}`
                    : 'Updating...'}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">🏠 Destination</p>
                <p className="text-sm text-green-900 truncate">{order.deliveryAddress || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>ℹ️ Live Updates:</strong> Map refreshes every 5 seconds with rider's current position
              </p>
            </div>
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
                      {formatDateTime(track.timestamp)}
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
                      {formatDateTime(order.createdAt)}
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
