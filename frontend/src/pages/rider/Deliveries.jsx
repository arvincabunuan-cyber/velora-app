import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { deliveryService } from '../../services/apiService';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    
    // Start location tracking when rider has active deliveries
    const locationInterval = startLocationTracking();
    
    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, []);

  const startLocationTracking = () => {
    // Request geolocation permission and start tracking
    if (navigator.geolocation) {
      // Initial location update
      updateLocation();
      
      // Update location every 30 seconds
      return setInterval(() => {
        updateLocation();
      }, 30000);
    } else {
      toast.error('Geolocation is not supported by your browser');
      return null;
    }
  };

  const updateLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await deliveryService.updateRiderLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          console.log('Location updated:', position.coords.latitude, position.coords.longitude);
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const fetchDeliveries = async () => {
    try {
      const [myDeliveries, pending] = await Promise.all([
        deliveryService.getRiderDeliveries(),
        deliveryService.getPendingDeliveries()
      ]);
      console.log('My Deliveries:', myDeliveries);
      console.log('Pending Deliveries:', pending);
      setDeliveries(myDeliveries.data || []);
      setPendingDeliveries(pending.data || []);
    } catch (error) {
      console.error('Fetch deliveries error:', error);
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  };

  const assignDelivery = async (id) => {
    try {
      await deliveryService.assignDelivery(id);
      toast.success('Delivery assigned to you');
      fetchDeliveries();
      setShowPending(false);
    } catch (error) {
      toast.error('Failed to assign delivery');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      // Get current location before updating status
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await deliveryService.updateDeliveryStatus(id, { 
              status: newStatus,
              location: { 
                latitude: position.coords.latitude, 
                longitude: position.coords.longitude 
              }
            });
            toast.success('Delivery status updated');
            fetchDeliveries();
          },
          async () => {
            // Fallback if location fails
            await deliveryService.updateDeliveryStatus(id, { 
              status: newStatus,
              location: { latitude: 0, longitude: 0 }
            });
            toast.success('Delivery status updated');
            fetchDeliveries();
          }
        );
      } else {
        await deliveryService.updateDeliveryStatus(id, { 
          status: newStatus,
          location: { latitude: 0, longitude: 0 }
        });
        toast.success('Delivery status updated');
        fetchDeliveries();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
          <button
            onClick={() => setShowPending(!showPending)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {showPending ? 'View My Deliveries' : 'View Available Deliveries'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading deliveries...</div>
        ) : showPending ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Deliveries</h2>
            {pendingDeliveries.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No pending deliveries available</p>
              </div>
            ) : (
              pendingDeliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{delivery.deliveryNumber}</h3>
                      <p className="text-sm text-gray-600">Fee: ₱{delivery.deliveryFee}</p>
                      <p className="text-xs text-gray-500 mt-1">From: {delivery.pickupAddress}</p>
                      <p className="text-xs text-gray-500">To: {delivery.deliveryAddress}</p>
                    </div>
                    <button
                      onClick={() => assignDelivery(delivery.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Accept Delivery
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">My Deliveries</h2>
            {deliveries.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No deliveries assigned yet</p>
              </div>
            ) : (
              deliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{delivery.deliveryNumber}</h3>
                      <p className="text-sm text-gray-600">Fee: ₱{delivery.deliveryFee}</p>
                      <p className="text-xs text-gray-500 mt-1">From: {delivery.pickupAddress}</p>
                      <p className="text-xs text-gray-500">To: {delivery.deliveryAddress}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                      ${delivery.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {delivery.status}
                    </span>
                  </div>
                  {delivery.status === 'assigned' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'picked_up')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Mark as Picked Up
                    </button>
                  )}
                  {delivery.status === 'picked_up' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'in_transit')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Mark as In Transit
                    </button>
                  )}
                  {delivery.status === 'in_transit' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'delivered')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Complete Delivery
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Deliveries;
