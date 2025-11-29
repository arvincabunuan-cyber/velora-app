import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminService } from '../../services/apiService';
import { Users, Package, Truck, DollarSign } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            icon={<Users className="text-white" size={24} />}
            color="bg-primary-500"
          />
          <StatCard
            title="Total Orders"
            value={stats?.orders?.total || 0}
            icon={<Package className="text-white" size={24} />}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Deliveries"
            value={stats?.deliveries?.active || 0}
            icon={<Truck className="text-white" size={24} />}
            color="bg-yellow-500"
          />
          <StatCard
            title="Total Revenue"
            value={`₱${stats?.revenue?.total?.toFixed(2) || 0}`}
            icon={<DollarSign className="text-white" size={24} />}
            color="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Buyers</span>
                <span className="font-semibold">{stats?.users?.buyers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sellers</span>
                <span className="font-semibold">{stats?.users?.sellers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Riders</span>
                <span className="font-semibold">{stats?.users?.riders || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-semibold">{stats?.orders?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered</span>
                <span className="font-semibold">{stats?.orders?.delivered || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled</span>
                <span className="font-semibold">{stats?.orders?.cancelled || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span className="font-semibold">{stats?.products?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold">{stats?.products?.active || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
