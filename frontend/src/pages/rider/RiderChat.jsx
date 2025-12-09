import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { Send, MessageCircle, AlertTriangle, Info, HelpCircle, Trash2, Users } from 'lucide-react';
import api from '../../services/api';
import { userService } from '../../services/apiService';
import useAuthStore from '../../store/authStore';
import axios from 'axios';
import { deliveryService } from '../../services/apiService';

const RiderChat = () => {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('general');
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRiders();
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

        // Also update delivery tracking location
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

  useEffect(() => {
    if (selectedRider) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRider]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRiders = async () => {
    try {
      // Use the dedicated public riders endpoint which excludes verification photos
      const response = await userService.getRiders();
      const ridersList = (response.data && Array.isArray(response.data)) ? response.data : (response.data || response || []);
      // Remove current user from the list if present
      const otherRiders = ridersList.filter(r => r.id !== user?.id);
      setRiders(otherRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get('/rider-messages?limit=100');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api.post('/rider-messages', {
        message: newMessage,
        type: messageType,
        relatedLocation: null,
        relatedPhone: null
      });

      setNewMessage('');
      setMessageType('general');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/rider-messages/${id}`);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const getMessageIcon = (type) => {
    const icons = {
      general: <MessageCircle className="text-blue-600" size={16} />,
      warning: <AlertTriangle className="text-red-600" size={16} />,
      tip: <Info className="text-green-600" size={16} />,
      question: <HelpCircle className="text-purple-600" size={16} />
    };
    return icons[type] || icons.general;
  };

  return (
    <Layout>
      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Riders List - Sidebar */}
        <div className="col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-primary-600 text-white p-4">
            <div className="flex items-center gap-2">
              <Users size={24} />
              <h2 className="text-lg font-bold">Riders</h2>
            </div>
            <p className="text-sm text-primary-100 mt-1">{riders.length} online</p>
          </div>
          
          <div className="overflow-y-auto h-full">
            {riders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No other riders available</p>
              </div>
            ) : (
              riders.map((rider) => (
                <button
                  key={rider.id}
                  onClick={() => setSelectedRider(rider)}
                  className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                    selectedRider?.id === rider.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-bold">
                        {rider.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{rider.name}</p>
                      <p className="text-xs text-gray-500">{rider.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-span-3 bg-white rounded-lg shadow flex flex-col">
          {!selectedRider ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a rider to start chatting</p>
                <p className="text-sm mt-2">Connect with fellow riders, share tips and warnings</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-primary-600 text-white p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">
                    {selectedRider.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedRider.name}</h2>
                  <p className="text-sm text-primary-100">{selectedRider.email}</p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMyMessage
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getMessageIcon(msg.type)}
                            <span className={`text-xs font-medium ${isMyMessage ? 'text-primary-100' : 'text-gray-600'}`}>
                              {msg.senderName}
                            </span>
                          </div>
                          <p className={isMyMessage ? 'text-white' : 'text-gray-900'}>{msg.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${isMyMessage ? 'text-primary-100' : 'text-gray-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                            {isMyMessage && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="text-primary-100 hover:text-white"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-white">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="general">💬 Chat</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="tip">💡 Tip</option>
                      <option value="question">❓ Question</option>
                    </select>

                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />

                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                    >
                      <Send size={20} />
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RiderChat;
