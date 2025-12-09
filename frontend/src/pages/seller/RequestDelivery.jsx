import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LocationPicker from '../../components/LocationPicker';
import { deliveryService, userService } from '../../services/apiService';
import { FileText, MapPin, Send, User, X, Calculator, Map, Star } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { calculateDeliveryEstimate } from '../../utils/distanceCalculator';
import axios from 'axios';

const RequestDelivery = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [formData, setFormData] = useState({
    deliveryType: 'document',
    pickupAddress: '',
    deliveryAddress: '',
    senderName: '',
    senderPhone: '',
    documentDetails: {
      description: '',
      quantity: 1,
      isFragile: false,
      specialInstructions: ''
    },
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    updateSellerLocation();
    
    const locationInterval = setInterval(() => {
      updateSellerLocation();
    }, 120000);
    
    return () => clearInterval(locationInterval);
  }, []);

  const updateSellerLocation = async () => {
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
      } catch (error) {
        console.error('Location update error:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('documentDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        documentDetails: {
          ...prev.documentDetails,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePickupLocationSelect = (location, address) => {
    setPickupCoords(location);
    setFormData(prev => ({ ...prev, pickupAddress: address }));
    setShowPickupMap(false);
    
    if (deliveryCoords) {
      const estimate = calculateDeliveryEstimate(location, deliveryCoords);
      setPriceEstimate(estimate);
    }
  };

  const handleDeliveryLocationSelect = (location, address) => {
    setDeliveryCoords(location);
    setFormData(prev => ({ ...prev, deliveryAddress: address }));
    setShowDeliveryMap(false);
    
    if (pickupCoords) {
      const estimate = calculateDeliveryEstimate(pickupCoords, location);
      setPriceEstimate(estimate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      alert('Please provide both pickup and delivery addresses');
      return;
    }

    if (!formData.documentDetails.description) {
      alert('Please provide document description');
      return;
    }

    if (!formData.senderName || !formData.senderPhone) {
      alert('Please provide sender information');
      return;
    }

    showRiderSelection();
  };

  const showRiderSelection = async () => {
    setShowRiderModal(true);
    setLoadingRiders(true);
    
    try {
      const response = await userService.getRiders();
      setRiders(response.data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      alert('Failed to load riders');
    } finally {
      setLoadingRiders(false);
    }
  };

  const confirmDelivery = async () => {
    if (!selectedRider) {
      alert('Please select a rider');
      return;
    }

    setLoading(true);
    try {
      const deliveryData = {
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
        documentDetails: formData.documentDetails,
        deliveryFee: priceEstimate?.price || 50,
        distance: priceEstimate?.distance || 0,
        preferredRider: selectedRider,
        notes: formData.notes
      };

      if (pickupCoords) {
        deliveryData.pickupCoordinates = pickupCoords;
      }
      if (deliveryCoords) {
        deliveryData.deliveryCoordinates = deliveryCoords;
      }

      await deliveryService.createDelivery(deliveryData);
      alert('Delivery request created successfully!');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert(error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-primary-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Request Document Delivery</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pickup Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} className="text-orange-600" />
                Pickup Address
              </label>
              <button
                type="button"
                onClick={() => setShowPickupMap(true)}
                className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors bg-white"
              >
                {formData.pickupAddress || 'Click to select pickup location on map'}
              </button>
              {priceEstimate && pickupCoords && (
                <p className="text-xs text-gray-500 mt-1">
                  <MapPin size={12} className="inline" /> {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} className="text-green-600" />
                Delivery Address
              </label>
              <button
                type="button"
                onClick={() => setShowDeliveryMap(true)}
                className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors bg-white"
              >
                {formData.deliveryAddress || 'Click to select delivery location on map'}
              </button>
              {priceEstimate && deliveryCoords && (
                <p className="text-xs text-gray-500 mt-1">
                  <MapPin size={12} className="inline" /> {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Price Estimate */}
            {priceEstimate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Delivery Estimate</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Distance:</p>
                    <p className="text-lg font-semibold text-blue-700">{priceEstimate.distance.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Fee:</p>
                    <p className="text-lg font-semibold text-blue-700">₱{priceEstimate.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} className="text-green-600" />
                Delivery Address
              </label>
              <button
                type="button"
                onClick={() => setShowDeliveryMap(true)}
                className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors bg-white"
              >
                {formData.deliveryAddress || 'Click to select delivery location on map'}
              </button>
              {priceEstimate && deliveryCoords && (
                <p className="text-xs text-gray-500 mt-1">
                  <MapPin size={12} className="inline" /> {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Price Estimate */}
            {priceEstimate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Delivery Estimate</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Distance:</p>
                    <p className="text-lg font-semibold text-blue-700">{priceEstimate.distance.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Fee:</p>
                    <p className="text-lg font-semibold text-blue-700">₱{priceEstimate.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="documentDetails.description"
                    value={formData.documentDetails.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Legal documents, Contracts, Certificates"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity (Number of documents/packages)
                  </label>
                  <input
                    type="number"
                    name="documentDetails.quantity"
                    value={formData.documentDetails.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="documentDetails.isFragile"
                    checked={formData.documentDetails.isFragile}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Handle with care (Fragile/Important documents)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="documentDetails.specialInstructions"
                    value={formData.documentDetails.specialInstructions}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Any special handling instructions or notes"
                  />
                </div>
              </div>
            </div>

            {/* Sender Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Full name of sender"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Phone
                  </label>
                  <input
                    type="tel"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Contact number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cash">Cash on Delivery</option>
                <option value="card">Credit/Debit Card</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Any additional information for the rider"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/seller')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    <Send size={18} />
                    Request Delivery
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rider Selection Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Select a Rider</h3>
                <button
                  onClick={() => setShowRiderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              {priceEstimate && (
                <div className="mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} />
                    <span>Estimated Distance: {priceEstimate.distance.toFixed(2)} km</span>
                  </div>
                  <div className="font-semibold text-primary-600">
                    Delivery Fee: ₱{priceEstimate.fee.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {loadingRiders ? (
                <div className="text-center py-8">Loading riders...</div>
              ) : (
                <div className="space-y-3">
                  {/* Nearby Rider Option */}
                  <button
                    onClick={() => {
                      setSelectedRider('nearby');
                      confirmDelivery();
                    }}
                    className="w-full p-4 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <MapPin className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          Nearby Rider Available
                          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                            ⚡ Fastest option
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          We'll assign the nearest available rider automatically
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Available Riders List */}
                  {riders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No specific riders available at the moment.</p>
                      <p className="text-sm mt-2">Use "Nearby Rider Available" for automatic assignment.</p>
                    </div>
                  ) : (
                    riders.map((rider) => (
                      <button
                        key={rider._id}
                        onClick={() => setSelectedRider(rider._id)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedRider === rider._id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={24} className="text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{rider.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center text-yellow-500">
                                <Star size={14} fill="currentColor" />
                                <span className="text-sm ml-1">
                                  {rider.rating ? rider.rating.toFixed(1) : 'New'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {rider.completedDeliveries || 0} deliveries
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowRiderModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelivery}
                disabled={!selectedRider || selectedRider === 'nearby'}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Location Picker */}
      {showPickupPicker && (
        <LocationPicker
          isOpen={showPickupPicker}
          onClose={() => setShowPickupPicker(false)}
          onSelectLocation={handlePickupLocationSelect}
          title="Select Pickup Location"
        />
      )}

      {/* Delivery Location Picker */}
      {showDeliveryPicker && (
        <LocationPicker
          isOpen={showDeliveryPicker}
          onClose={() => setShowDeliveryPicker(false)}
          onSelectLocation={handleDeliveryLocationSelect}
          title="Select Delivery Location"
        />
      )}
    </Layout>
  );
};

export default RequestDelivery;
