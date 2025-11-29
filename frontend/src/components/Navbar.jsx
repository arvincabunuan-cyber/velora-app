import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { LogOut, User, ShoppingBag, Package, Truck, LayoutDashboard, AlertTriangle, MessageCircle, ShoppingCart } from 'lucide-react';
import Logo from './Logo';
import NotificationToast from './NotificationToast';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const navigate = useNavigate();
  const cartItemCount = getItemCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBasedLinks = () => {
    switch (user?.role) {
      case 'buyer':
        return [
          { to: '/buyer', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/buyer/products', icon: <ShoppingBag size={20} />, label: 'Products' },
          { to: '/buyer/cart', icon: <ShoppingCart size={20} />, label: 'Cart', badge: cartItemCount },
          { to: '/buyer/orders', icon: <Package size={20} />, label: 'My Orders' }
        ];
      case 'seller':
        return [
          { to: '/seller', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/seller/products', icon: <ShoppingBag size={20} />, label: 'My Products' },
          { to: '/seller/orders', icon: <Package size={20} />, label: 'Orders' }
        ];
      case 'rider':
        return [
          { to: '/rider', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/rider/deliveries', icon: <Truck size={20} />, label: 'Deliveries' },
          { to: '/rider/notes', icon: <AlertTriangle size={20} />, label: 'Notes' },
          { to: '/rider/chat', icon: <MessageCircle size={20} />, label: 'Chat' }
        ];
      case 'superadmin':
        return [
          { to: '/superadmin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/superadmin/users', icon: <User size={20} />, label: 'Users' },
          { to: '/superadmin/orders', icon: <Package size={20} />, label: 'Orders' },
          { to: '/superadmin/deliveries', icon: <Truck size={20} />, label: 'Deliveries' }
        ];
      default:
        return [];
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <Logo className="w-10 h-10" textClassName="text-2xl font-bold" />
              </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {getRoleBasedLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-primary-600 relative"
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                  {link.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <NotificationToast />
              <div className="flex items-center">
                <User size={20} className="text-gray-600" />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user?.name} ({user?.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <LogOut size={20} />
                <span className="ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
