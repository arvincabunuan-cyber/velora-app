import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { deliveryService } from '../../services/apiService';
import { Truck, CheckCircle, Clock, AlertTriangle, MessageCircle } from 'lucide-react';

const RiderDashboard = () => {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedDeliveries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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
