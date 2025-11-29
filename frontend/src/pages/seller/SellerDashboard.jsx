import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { orderService, productService } from '../../services/apiService';
import { Package, ShoppingBag, DollarSign, FileText, Send } from 'lucide-react';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        productService.getSellerProducts(),
        orderService.getSellerOrders()
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const revenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        revenue
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <div className="flex gap-3">
            <Link
              to="/seller/send-document"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Send size={18} />
              Send Document
            </Link>
            <Link
              to="/seller/request-delivery"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <FileText size={18} />
              Receive Document
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<ShoppingBag className="text-white" size={24} />}
            color="bg-primary-500"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<Package className="text-white" size={24} />}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Revenue"
            value={`₱${stats.revenue.toFixed(2)}`}
            icon={<DollarSign className="text-white" size={24} />}
            color="bg-green-500"
          />
        </div>
      </div>
    </Layout>
  );
};

export default SellerDashboard;
