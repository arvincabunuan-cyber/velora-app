import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { orderService } from '../../services/apiService';
import toast from 'react-hot-toast';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getBuyerOrders();
      console.log('Orders received:', response.data);
      setOrders(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
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
                      {new Date(order.createdAt).toLocaleDateString()}
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
                    <p className="text-sm text-gray-600">Items: {order.items?.length || 0}</p>
                  )}
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    Total: ₱{order.totalAmount || 0}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
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
      </div>
    </Layout>
  );
};

export default Orders;
