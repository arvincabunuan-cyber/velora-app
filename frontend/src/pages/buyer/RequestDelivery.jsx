import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import FaceVerification from '../../components/FaceVerification';
import LocationPicker from '../../components/LocationPicker';
import { deliveryService, userService } from '../../services/apiService';
import { FileText, MapPin, Send, User, X, Calculator, Map, Star } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { calculateDeliveryEstimate } from '../../utils/distanceCalculator';

const RequestDelivery = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
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

  const handlePickupLocationSelect = (location) => {
    if (location) {
      setPickupCoords({ lat: location.lat, lng: location.lng });
      setFormData(prev => ({
        ...prev,
        pickupAddress: location.address
      }));
      if (formData.deliveryAddress && deliveryCoords) {
        calculatePriceFromCoords(location, deliveryCoords);
      }
    }
    setShowPickupMap(false);
  };

  const handleDeliveryLocationSelect = (location) => {
    if (location) {
      setDeliveryCoords({ lat: location.lat, lng: location.lng });
      setFormData(prev => ({
        ...prev,
        deliveryAddress: location.address
      }));
      if (formData.pickupAddress && pickupCoords) {
        calculatePriceFromCoords(pickupCoords, location);
      }
    }
    setShowDeliveryMap(false);
  };

  const calculatePriceFromCoords = (pickup, delivery) => {
    setCalculatingPrice(true);
    try {
      const distance = calculateDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
      const price = calculateDeliveryPrice(distance);
      setPriceEstimate({
        distance: Math.round(distance * 10) / 10,
        price,
        pickup,
        delivery
      });
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDeliveryPrice = (distanceKm) => {
    const baseDistance = 13;
    const basePrice = 50;
    const pricePerKm = basePrice / baseDistance;
    const calculatedPrice = Math.ceil(distanceKm * pricePerKm);
    return Math.max(calculatedPrice, 30);
  };

  const calculatePrice = async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      return;
    }

    setCalculatingPrice(true);
    setPriceEstimate(null);
    
    try {
      const estimate = await calculateDeliveryEstimate(
        formData.pickupAddress,
        formData.deliveryAddress
      );
      setPriceEstimate(estimate);
    } catch (error) {
      console.error('Error calculating price:', error);
      alert('Could not calculate delivery price. Please check the addresses.');
    } finally {
      setCalculatingPrice(false);
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

    // Show rider selection
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
      navigate('/buyer/dashboard');
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert(error.response?.data?.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {showFaceVerification && (
        <FaceVerification
          onVerified={() => {
            setIsVerified(true);
            setShowFaceVerification(false);
          }}
          onCancel={() => setShowFaceVerification(false)}
        />
      )}
      
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
                <MapPin size={18} className="text-primary-600" />
                Pickup Address
              </label>
              <div className="flex gap-2">
                <textarea
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  rows="3"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter the address where documents should be picked up"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPickupMap(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 h-fit"
                >
                  <Map size={18} />
                  <span className="hidden sm:inline">Pin on Map</span>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} className="text-green-600" />
                Delivery Address
              </label>
              <div className="flex gap-2">
                <textarea
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  rows="3"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter the delivery destination address"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDeliveryMap(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 h-fit"
                >
                  <Map size={18} />
                  <span className="hidden sm:inline">Pin on Map</span>
                </button>
              </div>
            </div>

            {/* Price Calculator */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Price Estimate</h3>
                <button
                  type="button"
                  onClick={calculatePrice}
                  disabled={!formData.pickupAddress || !formData.deliveryAddress || calculatingPrice}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  <Calculator size={16} />
                  {calculatingPrice ? 'Calculating...' : 'Calculate Price'}
                </button>
              </div>
              
              {priceEstimate && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="text-2xl font-bold text-gray-900">{priceEstimate.distance} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Price</p>
                      <p className="text-2xl font-bold text-green-600">₱{priceEstimate.price}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Based on ₱50 for 13km. Final price may vary.
                  </p>
                </div>
              )}
              
              {!priceEstimate && !calculatingPrice && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Enter both pickup and delivery addresses, then click "Calculate Price" to see the estimated delivery fee
                  </p>
                </div>
              )}
            </div>

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
                onClick={() => navigate('/buyer')}
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
                ) : !isVerified ? (
                  <>
                    <Send size={18} />
                    Verify & Request Delivery
                  </>
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
      
      {/* Location Picker Modals */}
      {showPickupMap && (
        <LocationPicker
          onLocationSelect={handlePickupLocationSelect}
          initialPosition={pickupCoords}
          title="Select Pickup Location"
        />
      )}
      
      {showDeliveryMap && (
        <LocationPicker
          onLocationSelect={handleDeliveryLocationSelect}
          initialPosition={deliveryCoords}
          title="Select Delivery Location"
        />
      )}

      {/* Rider Selection Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Rider</h2>
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Document Delivery:</p>
                <p className="text-lg font-semibold text-gray-900">{formData.documentDetails.description}</p>
                <p className="text-sm text-gray-600 mt-1">From: {formData.pickupAddress}</p>
                <p className="text-sm text-gray-600">To: {formData.deliveryAddress}</p>
                {priceEstimate && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Distance:</span>
                      <span className="font-semibold text-gray-900">{priceEstimate.distance} km</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Delivery Fee:</span>
                      <span className="text-xl font-bold text-green-600">₱{priceEstimate.price}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Riders</h3>
                
                {loadingRiders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading riders...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Nearby Rider Option */}
                    <div
                      onClick={() => setSelectedRider('nearby')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRider === 'nearby'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Nearby Rider Available</p>
                            <p className="text-sm text-gray-600">Auto-assign nearest rider</p>
                            <p className="text-xs text-green-600 mt-1">⚡ Fastest option</p>
                          </div>
                        </div>
                        {selectedRider === 'nearby' && (
                          <div className="text-green-600 font-semibold">✓ Selected</div>
                        )}
                      </div>
                    </div>

                    {riders.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No specific riders to choose from. Use nearby option above.
                      </div>
                    ) : (
                      riders.map((rider) => (
                        <div
                          key={rider.id}
                          onClick={() => setSelectedRider(rider.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedRider === rider.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                {rider.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{rider.name}</p>
                                <p className="text-sm text-gray-600">{rider.phone}</p>
                                {rider.currentAddress && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {rider.currentAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedRider === rider.id && (
                              <div className="text-primary-600 font-semibold">✓ Selected</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelivery}
                disabled={!selectedRider || loading}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RequestDelivery;
