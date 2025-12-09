import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { deliveryService } from '../../services/apiService';
import axios from 'axios';
import { Truck, CheckCircle, Clock, AlertTriangle, MessageCircle, MapPin } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RiderDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    fetchData();
    requestLocationPermission();
  }, []);

  // Update location every 2 minutes
  useEffect(() => {
    if (locationPermission === 'granted') {
      const interval = setInterval(() => {
        updateRiderLocation();
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [locationPermission]);

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        setLocationPermission('granted');
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(coords);
        await updateRiderLocation(coords);
        toast.success('Location access granted');
      } catch (error) {
        console.error('Location permission error:', error);
        setLocationPermission('denied');
        toast.error('Location access denied. Buyers won\'t see your location.');
      }
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const updateRiderLocation = async (coords = currentLocation) => {
    if (!coords) return;
    
    setUpdatingLocation(true);
    try {
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

      // Also update rider location for live tracking (used by deliveries.trackDelivery)
      try {
        await deliveryService.updateRiderLocation({ latitude: coords.lat, longitude: coords.lng });
      } catch (err) {
        console.warn('Failed to update rider location for tracking:', err?.message || err);
      }
      
      setCurrentLocation(coords);
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await deliveryService.getRiderDeliveries();
      const deliveries = response.data || [];
      
      setStats({
        totalDeliveries: deliveries.length,
        activeDeliveries: deliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length,
        completedDeliveries: deliveries.filter(d => d.status === 'delivered').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>

        {/* Location Status */}
        <div className={`p-4 rounded-lg border-2 ${
          locationPermission === 'granted' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={24} className={locationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'} />
              <div>
                <p className="font-semibold text-gray-900">
                  {locationPermission === 'granted' ? 'Location Tracking Active' : 'Location Access Required'}
                </p>
                <p className="text-sm text-gray-600">
                  {locationPermission === 'granted' 
                    ? 'Your location is being shared with buyers' 
                    : 'Enable location to let buyers see your current location'}
                </p>
              </div>
            </div>
            {locationPermission !== 'granted' && (
              <button
                onClick={requestLocationPermission}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Enable Location
              </button>
            )}
            {updatingLocation && (
              <div className="text-sm text-gray-600">Updating...</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Deliveries"
            value={stats.totalDeliveries}
            icon={<Truck className="text-white" size={24} />}
            color="bg-primary-500"
          />
          <StatCard
            title="Active Deliveries"
            value={stats.activeDeliveries}
            icon={<Clock className="text-white" size={24} />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Completed"
            value={stats.completedDeliveries}
            icon={<CheckCircle className="text-white" size={24} />}
            color="bg-green-500"
          />
        </div>

        {/* Rider Community Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rider Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/rider/notes"
              className="flex items-center gap-4 p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notes & Alerts</h3>
                <p className="text-sm text-gray-600">Flag fake bookings and suspicious locations</p>
              </div>
            </Link>

            <Link
              to="/rider/chat"
              className="flex items-center gap-4 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Rider Chat</h3>
                <p className="text-sm text-gray-600">Connect with fellow riders</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RiderDashboard;
