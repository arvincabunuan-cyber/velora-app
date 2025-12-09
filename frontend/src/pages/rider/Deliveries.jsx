import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { deliveryService } from '../../services/apiService';
import toast from 'react-hot-toast';
import axios from 'axios';

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    fetchDeliveries();
    updateRiderLocation();
    
    // Update location every 2 minutes
    const locationInterval = setInterval(() => {
      updateRiderLocation();
    }, 120000);
    
    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, []);

  const updateRiderLocation = async () => {
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
        
        // Reverse geocode to get address
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
        );
        
        const address = response.data.display_name || 'Location not available';
        
        // Update user profile with location
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

        // Also update rider location for live tracking
        try {
          await deliveryService.updateRiderLocation({ latitude: coords.lat, longitude: coords.lng });
        } catch (err) {
          console.warn('Failed to update rider location for tracking:', err?.message || err);
        }
      } catch (error) {
        console.error('Location update error:', error);
      }
    }
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
      // Refresh delivery from server to avoid stale state (prevent 400 when another rider already claimed it)
      const current = await deliveryService.trackDelivery(id);
      if (current && current.success && current.data) {
        if (current.data.status !== 'pending') {
          console.warn('Delivery cannot be assigned, current status:', current.data.status);
          toast.error(`Cannot assign delivery — current status: ${current.data.status}`);
          // Refresh lists to keep UI in sync
          fetchDeliveries();
          return;
        }
      }

      await deliveryService.assignDelivery(id);
      toast.success('Delivery assigned to you');
      fetchDeliveries();
      setShowPending(false);
    } catch (error) {
      console.error('Assign delivery error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to assign delivery');
      // Refresh lists to ensure UI reflects server state
      fetchDeliveries();
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
                      onClick={async () => {
                        try {
                          // First try to assign it to ourselves if not already assigned
                          if (!delivery.rider || delivery.rider !== 'current-user-id') {
                            await deliveryService.assignDelivery(delivery.id);
                          }
                          // Then update status to picked_up
                          await updateStatus(delivery.id, 'picked_up');
                        } catch (error) {
                          // If assignment fails, just try to update status
                          updateStatus(delivery.id, 'picked_up');
                        }
                      }}
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
