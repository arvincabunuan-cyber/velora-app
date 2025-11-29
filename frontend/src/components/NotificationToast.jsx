import { useEffect, useState } from 'react';
import { Bell, X, Package, FileText, Truck } from 'lucide-react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const NotificationToast = () => {
  const user = useAuthStore(state => state.user);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to socket.io server
    const socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      // Join user's room for notifications
      socketInstance.emit('join', user.id);
    });

    // Listen for new order notifications (for sellers)
    socketInstance.on('newOrderReceived', (data) => {
      console.log('New order received:', data);
      
      // Show toast notification
      toast.success(data.message, {
        duration: 5000,
        icon: '🔔',
      });

      // Play notification sound (optional)
      playNotificationSound();

      // Add to notifications list
      addNotification({
        id: Date.now(),
        type: 'order',
        ...data
      });
    });

    // Listen for rider notifications (for riders)
    socketInstance.on('newOrderNotification', (data) => {
      console.log('New rider notification:', data);
      
      toast.success(data.message, {
        duration: 5000,
        icon: '🚴',
      });

      playNotificationSound();

      addNotification({
        id: Date.now(),
        type: 'rider',
        ...data
      });
    });

    // Listen for order updates (for buyers)
    socketInstance.on('orderUpdate', (data) => {
      console.log('Order update:', data);
      
      toast.info(data.message, {
        duration: 4000,
        icon: '📦',
      });

      addNotification({
        id: Date.now(),
        type: 'update',
        ...data
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep last 10
  };

  const playNotificationSound = () => {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio playback not supported');
    }
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <Package className="text-green-600" size={20} />;
      case 'rider':
        return <Truck className="text-blue-600" size={20} />;
      case 'update':
        return <FileText className="text-orange-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto mb-2 text-gray-400" size={32} />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.message}
                      </p>
                      {notification.orderNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Order: {notification.orderNumber}
                        </p>
                      )}
                      {notification.totalAmount && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          Amount: ₱{notification.totalAmount}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => clearNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
