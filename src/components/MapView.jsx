import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddress } from '../api';

// Fix Leaflet's default icon path issues in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Helper component to handle map boundary fitting when data changes
function MapBoundsController({ markers }) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (markers.length > 0 && !hasFitRef.current) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
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
          const cacheKey = `geocode_${address}`;
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
    <div className="relative h-[65vh] w-full rounded-2xl overflow-hidden border border-brand-border shadow-premium z-10">
      {/* Full map loading state */}
      {isGeocoding && markers.length === 0 && (
        <div className="absolute inset-0 bg-slate-50/90 z-50 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-brand-blue mb-3"></div>
          <p className="text-slate-700 font-bold font-outfit text-sm">Locating Addresses on Map...</p>
          <p className="text-slate-400 text-xs mt-1">(Caching results to optimize rate limits)</p>
        </div>
      )}
      
      {/* Dynamic background geocoding loader badge */}
      {isGeocoding && markers.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-brand-border shadow-md px-3.5 py-2 rounded-full z-[1000] flex items-center space-x-2.5 text-xs font-bold text-slate-700 transition-opacity">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blueLight opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-blue"></span>
          </span>
          <span>Locating remaining addresses...</span>
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
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="p-1 max-w-[200px]">
                <h3 className="font-bold text-sm text-slate-800 leading-tight">{marker.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{marker.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapBoundsController key={data} markers={markers} />
      </MapContainer>
    </div>
  );
}
