import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, Navigation } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  // Use embedded SVG data URL to avoid blocked CDN requests (tracking prevention)
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  shadowUrl: ''
});

// Component to handle map clicks
function LocationMarker({ position, setPosition, setAddress }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      // Reverse geocode to get address
      reverseGeocode(e.latlng.lat, e.latlng.lng, setAddress);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

// Reverse geocode coordinates to address
const reverseGeocode = async (lat, lng, setAddress) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    if (data && data.display_name) {
      setAddress(data.display_name);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
};

const LocationPicker = ({ onLocationSelect, initialPosition, title = "Select Location" }) => {
  const [position, setPosition] = useState(initialPosition || { lat: 14.5995, lng: 120.9842 }); // Manila default
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setPosition(newPos);
          reverseGeocode(newPos.lat, newPos.lng, setAddress);
          setIsGettingLocation(false);
          
          // Pan map to new position
          if (mapRef.current) {
            mapRef.current.setView(newPos, 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please select manually on the map.');
          setIsGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (position) {
      onLocationSelect({
        lat: position.lat,
        lng: position.lng,
        address: address
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={() => onLocationSelect(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex gap-2">
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              <Navigation size={16} />
              {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
            </button>
            {address && (
              <div className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                <MapPin size={16} className="inline mr-2 text-primary-600" />
                {address}
              </div>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker 
                position={position} 
                setPosition={setPosition}
                setAddress={setAddress}
              />
            </MapContainer>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Click anywhere on the map to select a location, or use "Use My Location" to automatically detect your current position.
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={() => onLocationSelect(null)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
