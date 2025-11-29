import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import Products from './pages/buyer/Products';
import Cart from './pages/buyer/Cart';
import Orders from './pages/buyer/Orders';
import OrderTracking from './pages/buyer/OrderTracking';
import RequestDelivery from './pages/buyer/RequestDelivery';
import BuyerSendDocument from './pages/buyer/SendDocument';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SendDocument from './pages/seller/SendDocument';
import SellerRequestDelivery from './pages/seller/RequestDelivery';

// Rider Pages
import RiderDashboard from './pages/rider/RiderDashboard';
import Deliveries from './pages/rider/Deliveries';
import DeliveryTracking from './pages/rider/DeliveryTracking';
import RiderNotes from './pages/rider/RiderNotes';
import RiderChat from './pages/rider/RiderChat';

// Superadmin Pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ManageUsers from './pages/superadmin/ManageUsers';
import ManageOrders from './pages/superadmin/ManageOrders';
import ManageDeliveries from './pages/superadmin/ManageDeliveries';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}`} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}`} />} />

        {/* Buyer Routes */}
        <Route path="/buyer" element={<ProtectedRoute allowedRoles={['buyer']} />}>
          <Route index element={<BuyerDashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="track-order/:orderId" element={<OrderTracking />} />
          <Route path="request-delivery" element={<RequestDelivery />} />
          <Route path="send-document" element={<BuyerSendDocument />} />
        </Route>

        {/* Seller Routes */}
        <Route path="/seller" element={<ProtectedRoute allowedRoles={['seller']} />}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="send-document" element={<SendDocument />} />
          <Route path="request-delivery" element={<SellerRequestDelivery />} />
        </Route>

        {/* Rider Routes */}
        <Route path="/rider" element={<ProtectedRoute allowedRoles={['rider']} />}>
          <Route index element={<RiderDashboard />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="deliveries/:id/track" element={<DeliveryTracking />} />
          <Route path="notes" element={<RiderNotes />} />
          <Route path="chat" element={<RiderChat />} />
        </Route>

        {/* Superadmin Routes */}
        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="deliveries" element={<ManageDeliveries />} />
        </Route>

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
