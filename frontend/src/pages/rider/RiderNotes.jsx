import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { AlertTriangle, MapPin, User, Plus, Search, Eye, EyeOff, Edit2, Trash2, Map } from 'lucide-react';
import api from '../../services/api';
import axios from 'axios';
import { deliveryService } from '../../services/apiService';

const RiderNotes = () => {
  const [activeTab, setActiveTab] = useState('my-notes'); // 'my-notes' or 'community'
  const [myNotes, setMyNotes] = useState([]);
  const [publicNotes, setPublicNotes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'location',
    subject: '',
    phoneNumber: '',
    category: 'fake_booking',
    note: '',
    severity: 'medium',
    isPublic: false
  });

  useEffect(() => {
    fetchMyNotes();
    fetchPublicNotes();
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

        // Also update rider location for delivery tracking
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

  const fetchMyNotes = async () => {
    try {
      const response = await api.get('/rider-notes/my-notes');
      setMyNotes(response.data);
    } catch (error) {
      console.error('Error fetching my notes:', error);
    }
  };

  const fetchPublicNotes = async () => {
    try {
      const response = await api.get('/rider-notes/public');
      setPublicNotes(response.data);
    } catch (error) {
      console.error('Error fetching public notes:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const isPhone = /^\d+$/.test(searchQuery.trim());
      const params = isPhone 
        ? { phoneNumber: searchQuery.trim() }
        : { subject: searchQuery.trim() };
      
      const response = await api.get('/rider-notes/search', { params });
      setPublicNotes(response.data);
      setActiveTab('community');
    } catch (error) {
      console.error('Error searching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rider-notes', formData);
      setShowAddModal(false);
      setFormData({
        type: 'location',
        subject: '',
        phoneNumber: '',
        category: 'fake_booking',
        note: '',
        severity: 'medium',
        isPublic: false
      });
      fetchMyNotes();
      fetchPublicNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.delete(`/rider-notes/${id}`);
      fetchMyNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      fake_booking: 'bg-red-100 text-red-800',
      suspicious: 'bg-yellow-100 text-yellow-800',
      dangerous: 'bg-orange-100 text-orange-800',
      good_customer: 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const NoteCard = ({ note, canDelete }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {note.type === 'location' ? (
            <MapPin className="text-blue-600" size={20} />
          ) : (
            <User className="text-purple-600" size={20} />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{note.subject}</h3>
            {note.phoneNumber && (
              <p className="text-sm text-gray-600">{note.phoneNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(note.category)}`}>
            {note.category.replace('_', ' ').toUpperCase()}
          </span>
          {canDelete && (
            <button
              onClick={() => handleDelete(note.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-700 mb-2">{note.note}</p>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className={`font-medium ${getSeverityColor(note.severity)}`}>
            Severity: {note.severity.toUpperCase()}
          </span>
          {note.isPublic ? (
            <span className="flex items-center gap-1 text-green-600">
              <Eye size={14} /> Public
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <EyeOff size={14} /> Private
            </span>
          )}
        </div>
        <span className="text-gray-500">
          {new Date(note.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Rider Notes & Alerts</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Note
          </button>
        </div>

        {/* Mindoro Map */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Mindoro, Philippines - Coverage Area</h2>
          </div>
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1009635.5267891!2d120.5!3d13.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd6ea59c82a73b%3A0x3825551a0d8ffbe3!2sMindoro%2C%20Philippines!5e0!3m2!1sen!2sph!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            📍 Use the map to identify locations when adding notes. Pin suspicious areas to help fellow riders.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by location or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('my-notes')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'my-notes'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Notes ({myNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'community'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Community Alerts ({publicNotes.length})
          </button>
        </div>

        {/* Notes List */}
        <div>
          {activeTab === 'my-notes' ? (
            myNotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600">No notes yet. Create one to flag suspicious locations or persons.</p>
              </div>
            ) : (
              myNotes.map(note => <NoteCard key={note.id} note={note} canDelete={true} />)
            )
          ) : (
            publicNotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No community alerts found.</p>
              </div>
            ) : (
              publicNotes.map(note => <NoteCard key={note.id} note={note} canDelete={false} />)
            )
          )}
        </div>

        {/* Add Note Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Note</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="location">Location</option>
                    <option value="person">Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'location' ? 'Location Address' : 'Person Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {formData.type === 'person' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="fake_booking">Fake Booking</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="dangerous">Dangerous</option>
                    <option value="good_customer">Good Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note/Details</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Share with other riders (make public)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RiderNotes;
