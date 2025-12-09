import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { orderService } from '../../services/apiService';
import toast from 'react-hot-toast';
import axios from 'axios';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      if (dateValue._seconds) {
        return new Date(dateValue._seconds * 1000).toLocaleDateString();
      }
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

  useEffect(() => {
    fetchOrders();
    updateSellerLocation();
    
    const locationInterval = setInterval(() => {
      updateSellerLocation();
    }, 120000);
    
    return () => clearInterval(locationInterval);
  }, []);

  const updateSellerLocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
        );
        
        const address = response.data.display_name || 'Location not available';
        
        const token = localStorage.getItem('token');
        await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
          {
            location: coords,
            currentAddress: address
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (error) {
        console.error('Location update error:', error);
      }
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getSellerOrders();
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order:', orderId, 'to status:', newStatus);
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Update order error:', error);
      toast.error('Failed to update order status');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>

        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No orders yet</p>
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="border-t pt-4">
                  {order.deliveryType === 'document' && order.documentDetails ? (
                    <>
                      <p className="text-sm text-gray-600">Document: {order.documentDetails.description}</p>
                      <p className="text-sm text-gray-600">Quantity: {order.documentDetails.quantity}</p>
                      {order.receiverName && (
                        <p className="text-sm text-gray-600">Receiver: {order.receiverName}</p>
                      )}
                      {order.documentDetails.isFragile && (
                        <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">⚠️ Fragile</span>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">Items: {order.items?.length || 0}</p>
                  )}
                  <p className="text-lg font-semibold text-gray-900 mb-4">
                    Total: ₱{order.totalAmount || 0}
                  </p>
                  {order.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateStatus(order.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Confirm Order
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(order.id, 'processing')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Mark as Processing
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerOrders;
