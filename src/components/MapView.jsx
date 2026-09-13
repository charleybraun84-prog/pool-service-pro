import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddress } from '../api';
import { ExternalLink, MapPin, Navigation, Sparkles } from 'lucide-react';

// Create modern custom map pin icon using DivIcon
const createCustomPin = (name) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: rgba(2, 132, 199, 0.25); 
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 50% 50% 50% 0; 
          background: linear-gradient(135deg, #0284c7, #06b6d4); 
          transform: rotate(-45deg); 
          border: 2px solid #ffffff; 
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4); 
          display: flex; 
          align-items: center; 
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg); 
            color: #ffffff; 
            font-size: 11px; 
            font-weight: 800; 
            font-family: 'Outfit', sans-serif;
          ">
            ${(name || 'P').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Helper component to handle map boundary fitting when data changes
function MapBoundsController({ markers }) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (markers.length > 0 && !hasFitRef.current) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      hasFitRef.current = true;
    }
  }, [markers, map]);

  return null;
}

export default function MapView({ data }) {
  const [markers, setMarkers] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function processAddresses() {
      setIsGeocoding(true);
      
      const cachedMarkers = [];
      const uncachedRows = [];
      
      for (const row of data) {
        const address = row['Customer Address'] || row['Customer address'];
        const name = row['Customer name'] || row['Customer Name'] || 'Unknown';
        
        if (address) {
          const cacheKey = `geocode_v2_${address}`;
          let cached = null;
          try {
            cached = localStorage.getItem(cacheKey);
          } catch (e) {
            console.warn("localStorage is not accessible:", e);
          }
          
          if (cached) {
            try {
              const coords = JSON.parse(cached);
              cachedMarkers.push({
                id: row['Submission ID'] || row['Submission time'] || Math.random().toString(),
                lat: coords.lat,
                lng: coords.lng,
                name,
                address,
                row
              });
            } catch {
              uncachedRows.push(row);
            }
          } else {
            uncachedRows.push(row);
          }
        }
      }
      
      if (isMounted) {
        setMarkers(cachedMarkers);
      }
      
      if (uncachedRows.length === 0) {
        if (isMounted) setIsGeocoding(false);
        return;
      }
      
      let currentMarkers = [...cachedMarkers];
      
      for (const row of uncachedRows) {
        if (!isMounted) break;
        
        const address = row['Customer Address'] || row['Customer address'];
        const name = row['Customer name'] || row['Customer Name'] || 'Unknown';
        
        const coords = await geocodeAddress(address);
        if (coords && isMounted) {
          currentMarkers.push({
            id: row['Submission ID'] || row['Submission time'] || Math.random().toString(),
            lat: coords.lat,
            lng: coords.lng,
            name,
            address,
            row
          });
          setMarkers([...currentMarkers]);
        }
      }
      
      if (isMounted) setIsGeocoding(false);
    }
    
    processAddresses();
    
    return () => { isMounted = false; };
  }, [data]);

  // Default center: Lafayette, LA
  const defaultCenter = [30.2241, -92.0198];

  const bounds = markers.length > 0 
    ? L.latLngBounds(markers.map(m => [m.lat, m.lng])) 
    : null;

  return (
    <div className="relative h-[72vh] min-h-[500px] w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg z-10">
      {/* Top Left: Floating Map Status Badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md border border-slate-200 shadow-md px-4 py-2.5 rounded-2xl flex items-center space-x-2.5 text-xs font-bold text-slate-800 pointer-events-auto">
        <div className="p-1.5 bg-sky-500/15 text-sky-600 rounded-xl">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <span className="block font-outfit text-slate-900 leading-tight">Field Route Map</span>
          <span className="text-[10px] text-slate-400 font-semibold leading-tight">
            {markers.length} {markers.length === 1 ? 'Location Pinned' : 'Locations Pinned'}
          </span>
        </div>
      </div>

      {/* Full map initial loading state */}
      {isGeocoding && markers.length === 0 && (
        <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-slate-800 font-bold font-outfit text-base">Locating Customer Addresses...</p>
          <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
            Geocoding customer coordinates and preparing route navigation
          </p>
        </div>
      )}
      
      {/* Dynamic background geocoding loader badge */}
      {isGeocoding && markers.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md px-3.5 py-2 rounded-2xl z-[1000] flex items-center space-x-2.5 text-xs font-bold text-slate-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-600"></span>
          </span>
          <span className="font-outfit text-xs">Locating remaining stops...</span>
        </div>
      )}
      
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        className="h-full w-full"
        bounds={bounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => {
          const pump = marker.row?.['Filter Pump Model'] || marker.row?.['Pump Model'];
          const san = marker.row?.['Sanitizer'];

          return (
            <Marker 
              key={marker.id} 
              position={[marker.lat, marker.lng]}
              icon={createCustomPin(marker.name)}
            >
              <Popup>
                <div className="p-2 min-w-[210px] space-y-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-outfit font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      {marker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 font-outfit leading-tight truncate">
                        {marker.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug flex items-start">
                        <MapPin className="w-3 h-3 text-sky-600 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{marker.address}</span>
                      </p>
                    </div>
                  </div>

                  {(pump || san) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {pump && (
                        <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md font-semibold truncate max-w-[180px]">
                          {pump}
                        </span>
                      )}
                      {san && (
                        <span className="text-[10px] px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-md font-semibold truncate max-w-[180px]">
                          {san}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold font-outfit transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Directions (Maps)</span>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <MapBoundsController key={data} markers={markers} />
      </MapContainer>
    </div>
  );
}
