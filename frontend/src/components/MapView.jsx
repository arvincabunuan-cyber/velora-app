import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  // Use embedded SVG data URL to avoid blocked CDN requests (tracking prevention)
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRUY0NDQ0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOCIvPjxwYXRoIGQ9Ik0xMiA4djhoIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTggMTJoOCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
  shadowUrl: ''
});

// Custom marker icons
const createIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">${label}</div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const sellerIcon = createIcon('#f59e0b', '🏪');
const riderIcon = createIcon('#3b82f6', '🚴');
const buyerIcon = createIcon('#10b981', '📍');

// Component to fit map bounds
function MapBounds({ locations }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const validLocations = locations.filter(loc => loc && loc.lat && loc.lng);
      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations.map(loc => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [locations, map]);
  
  return null;
}

const MapView = ({ sellerLocation, sellerName, riderLocation, riderName, buyerLocation, onBuyerLocationSelect }) => {
  const [center, setCenter] = useState([13.4127, 121.1794]); // Default: Oriental Mindoro
  
  useEffect(() => {
    if (sellerLocation) {
      setCenter([sellerLocation.lat, sellerLocation.lng]);
    }
  }, [sellerLocation]);
  
  const locations = [
    sellerLocation,
    riderLocation,
    buyerLocation
  ].filter(Boolean);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-300">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Seller Marker */}
        {sellerLocation && (
          <Marker 
            position={[sellerLocation.lat, sellerLocation.lng]}
            icon={sellerIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-orange-600">🏪 Seller</strong>
                <p className="text-sm">{sellerName}</p>
                <p className="text-xs text-gray-500">Pickup Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Rider Marker */}
        {riderLocation && (
          <Marker 
            position={[riderLocation.lat, riderLocation.lng]}
            icon={riderIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">🚴 Rider</strong>
                <p className="text-sm">{riderName}</p>
                <p className="text-xs text-gray-500">Current Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Buyer Marker */}
        {buyerLocation && (
          <Marker 
            position={[buyerLocation.lat, buyerLocation.lng]}
            icon={buyerIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-green-600">📍 Your Location</strong>
                <p className="text-xs text-gray-500">Delivery Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapBounds locations={locations} />
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-orange-600">🏪</span>
            <span>Seller/Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🚴</span>
            <span>Rider</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">📍</span>
            <span>Your Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
