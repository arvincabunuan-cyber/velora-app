import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { orderService, productService } from '../../services/apiService';
import { Package, ShoppingBag, DollarSign, FileText, Send, MapPin, Store, Edit2, Check, Star, TrendingUp } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const SellerDashboard = () => {
  const { user, setUser } = useAuthStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [editingStoreName, setEditingStoreName] = useState(false);
  const [storeName, setStoreName] = useState(user?.businessName || user?.name || '');
  const [salesData, setSalesData] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    fetchData();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission === 'granted') {
      const interval = setInterval(() => {
        updateSellerLocation();
      }, 120000);
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
        await updateSellerLocation(coords);
        toast.success('Store location updated');
      } catch (error) {
        console.error('Location permission error:', error);
        setLocationPermission('denied');
        toast.error('Location access denied. Buyers won\'t see your store location.');
      }
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const updateSellerLocation = async (coords = currentLocation) => {
    if (!coords) return;
    
    setUpdatingLocation(true);
    try {
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
      
      setCurrentLocation(coords);
    } catch (error) {
      console.error('Location update error:', error);
    } finally {
      setUpdatingLocation(false);
    }
  };

  const saveStoreName = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile`,
        {
          businessName: storeName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update the user in Zustand store with the response data
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      }
      setEditingStoreName(false);
      toast.success('Store name updated successfully!');
    } catch (error) {
      console.error('Error updating store name:', error);
      toast.error(error.response?.data?.message || 'Failed to update store name');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, ordersRes, reviewsRes] = await Promise.all([
        productService.getSellerProducts(),
        orderService.getSellerOrders(),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reviews/seller`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const reviewsData = reviewsRes.data.data || [];
      
      const revenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        revenue
      });

      setReviews(reviewsData);

      // Calculate rating statistics
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsData.forEach(review => {
        breakdown[review.rating] = (breakdown[review.rating] || 0) + 1;
      });
      
      const average = reviewsData.length > 0 
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length 
        : 0;

      setRatingStats({
        average: Math.round(average * 10) / 10,
        total: reviewsData.length,
        breakdown
      });

      // Calculate sales data for last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayOrders = orders.filter(o => {
          const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return orderDate >= date && orderDate < nextDate;
        });
        
        const daySales = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: daySales,
          orders: dayOrders.length
        });
      }
      
      setSalesData(last7Days);
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

        {/* Store Name Card */}
        <div className="bg-white rounded-lg shadow p-4 border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Store size={24} className="text-primary-600" />
              {editingStoreName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your store name"
                  />
                  <button
                    onClick={saveStoreName}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingStoreName(false);
                      setStoreName(user?.businessName || user?.name || '');
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Store Name</p>
                    <p className="font-semibold text-gray-900">{storeName || 'Not set'}</p>
                  </div>
                  <button
                    onClick={() => setEditingStoreName(true)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Status Card */}
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
                  {locationPermission === 'granted' ? 'Store Location Active' : 'Location Access Required'}
                </p>
                <p className="text-sm text-gray-600">
                  {locationPermission === 'granted' 
                    ? 'Your store location is visible to buyers' 
                    : 'Enable location so buyers can see your store'}
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

        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Sales Overview (Last 7 Days)</h2>
          </div>
          <div className="space-y-4">
            {salesData.length > 0 ? (
              <>
                {/* Bar Chart */}
                <div className="flex items-end justify-between h-64 gap-2">
                  {salesData.map((day, index) => {
                    const maxSales = Math.max(...salesData.map(d => d.sales), 1);
                    const height = (day.sales / maxSales) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                          <div className="text-xs font-semibold text-gray-700 mb-1">
                            ₱{day.sales.toFixed(0)}
                          </div>
                          <div
                            className="w-full bg-primary-500 rounded-t-lg hover:bg-primary-600 transition-all cursor-pointer relative group"
                            style={{ height: `${height}%`, minHeight: day.sales > 0 ? '20px' : '0px' }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {day.orders} order{day.orders !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">{day.date}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Summary */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Total Sales: <span className="font-bold text-gray-900">₱{salesData.reduce((sum, d) => sum + d.sales, 0).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Orders: <span className="font-bold text-gray-900">{salesData.reduce((sum, d) => sum + d.orders, 0)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Reviews & Ratings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Star className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Customer Reviews & Ratings</h2>
          </div>

          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">{ratingStats.average.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= Math.round(ratingStats.average) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-1">{ratingStats.total} reviews</div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingStats.breakdown[rating] || 0;
                const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium text-gray-700">{rating}</span>
                      <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{review.buyerName}</div>
                        <div className="text-sm text-gray-500">{review.productName}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt?.toDate ? review.createdAt.toDate() : review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No reviews yet</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerDashboard;
