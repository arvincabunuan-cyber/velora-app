import { useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';
import { deliveryService } from '../../services/apiService';

const DeliveryTracking = () => {
  useEffect(() => {
    updateRiderLocation();
    
    const locationInterval = setInterval(() => {
      updateRiderLocation();
    }, 120000);
    
    return () => clearInterval(locationInterval);
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

        // Also send to delivery tracking endpoint
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Tracking</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Real-time delivery tracking will be displayed here</p>
        </div>
      </div>
    </Layout>
  );
};

export default DeliveryTracking;
