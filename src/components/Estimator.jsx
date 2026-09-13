import { useState, useMemo } from 'react';
import { 
  Calculator, 
  Check, 
  AlertTriangle, 
  MapPin, 
  Copy, 
  Search, 
  RefreshCw, 
  Waves, 
  FlaskConical, 
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { geocodeAddress } from '../api';

const PRICING_MATRIX = {
  Zone1: {
    Pool: { 10: 85, 15: 100, 20: 115, 25: 125, 30: 145, 35: 160, 40: 175 },
    PoolSpa: { 10: 90, 15: 105, 20: 120, 25: 135, 30: 150, 35: 165, 40: 180 }
  },
  Zone2: {
    Pool: { 10: 95, 15: 110, 20: 125, 25: 140, 30: 155, 35: 170, 40: 185 },
    PoolSpa: { 10: 100, 15: 120, 20: 130, 25: 145, 30: 160, 35: 175, 40: 190 }
  },
  Zone3: {
    Pool: { 10: 105, 15: 125, 20: 135, 25: 150, 30: 165, 35: 180, 40: 195 },
    PoolSpa: { 10: 110, 15: 130, 20: 140, 25: 155, 30: 170, 35: 185, 40: 200 }
  }
};

const BASE_COORDS = { lat: 30.18731958121329, lng: -92.09195601079207 };

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in miles
}

const calculateZoneFromDistance = (dist) => {
  if (dist < 8) return 'Zone1';
  if (dist <= 15) return 'Zone2';
  if (dist <= 20) return 'Zone3';
  return 'Out';
};

export default function Estimator() {
  // Service Type State: 'routine' or 'chemCheck'
  const [serviceType, setServiceType] = useState('routine');

  // Residential Calculator State
  const [zone, setZone] = useState('Zone1');
  const [poolType, setPoolType] = useState('Pool');
  const [capacity, setCapacity] = useState(15);
  const [frequency, setFrequency] = useState('Weekly');

  // Chemical Check Type State: 'std' (Standard $45) or 'out' (Outside Lafayette $55)
  const [chemCheckType, setChemCheckType] = useState('std');

  // Addons State
  const [addons, setAddons] = useState({
    cart: false,
    cell: false
  });

  // Geocoding and Distance States
  const [address, setAddress] = useState('');
  const [matchedAddress, setMatchedAddress] = useState('');
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);
  const [calcStatus, setCalcStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  // Clipboard State
  const [copied, setCopied] = useState(false);

  // Calculate Residential Price
  const resPrice = useMemo(() => {
    let capKey = capacity;
    if (capacity < 10) capKey = 10;
    if (capacity > 40) capKey = 40;
    return PRICING_MATRIX[zone][poolType][capKey];
  }, [zone, poolType, capacity]);

  // Handle Addon Toggles
  const toggleAddon = (key) => {
    setAddons(prev => {
      const isAlreadyActive = prev[key];
      return {
        cart: key === 'cart' ? !isAlreadyActive : false,
        cell: key === 'cell' ? !isAlreadyActive : false
      };
    });
  };

  const calculateAddonsTotal = () => {
    let total = 0;
    if (addons.cart) total += 100;
    if (addons.cell) total += 50;
    return total;
  };

  // Get current per visit maintenance price
  const maintenancePrice = useMemo(() => {
    if (serviceType === 'routine') {
      return resPrice;
    } else {
      return chemCheckType === 'std' ? 45 : 55;
    }
  }, [serviceType, resPrice, chemCheckType]);

  // Calculate Zone & Distance based on address input
  const handleCalculateZone = async (e) => {
    if (e) e.preventDefault();
    if (!address.trim()) return;

    setCalcStatus('loading');
    setDistance(null);
    setCoords(null);

    try {
      const result = await geocodeAddress(address);
      if (result) {
        const dist = calculateDistance(BASE_COORDS.lat, BASE_COORDS.lng, result.lat, result.lng);
        setDistance(dist);
        setCoords(result);
        setMatchedAddress(result.displayName || address);
        
        const calculatedZone = calculateZoneFromDistance(dist);
        if (calculatedZone !== 'Out') {
          setZone(calculatedZone);
        } else {
          setZone('Zone3');
        }

        // Auto-set chemical check type based on calculated distance
        if (dist < 8) {
          setChemCheckType('std');
        } else {
          setChemCheckType('out');
        }

        setCalcStatus('success');
      } else {
        setCalcStatus('error');
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      setCalcStatus('error');
    }
  };

  // Generate Customer Estimate Text
  const copyText = useMemo(() => {
    let text = `Hi! Here is your pool service estimate from Cricket's Pool & Spa World\n\n`;
    
    if (matchedAddress || address) {
      text += `Address: ${matchedAddress || address}\n`;
    }
    
    text += `\nService Details:\n`;
    if (serviceType === 'routine') {
      text += `• Service: Routine Pool Maintenance (${poolType === 'Pool' ? 'Pool Only' : 'Pool & Spa Combo'})\n`;
      text += `• Frequency: ${frequency === 'Weekly' ? 'Weekly' : frequency === 'BiWeekly' ? 'Every other week' : 'Multiple visits per week'}\n`;
      text += `• Rate: $${maintenancePrice}.00 per visit\n`;
      text += `• Note: Rate includes all cleaning and balancing chemicals.\n`;
    } else {
      text += `• Service: Chemical-Only Check\n`;
      text += `• Rate: $${maintenancePrice}.00 per visit\n`;
      text += `• Note: This is a per-trip cost. Balancing chemicals used are billed extra based on usage.\n`;
    }

    // Quarterly services
    const quarterlyServices = [];
    if (addons.cart) quarterlyServices.push({ name: 'Cartridge Cleaning (includes salt cell cleaning if present)', price: 100 });
    if (addons.cell) quarterlyServices.push({ name: 'Salt Cell Cleaning', price: 50 });

    if (quarterlyServices.length > 0) {
      text += `\nQuarterly Add-ons:\n`;
      quarterlyServices.forEach(s => {
        text += `• ${s.name}: $${s.price}.00/quarter\n`;
      });
    }

    text += `\n*Please note: All estimates are subject to a final visual inspection of the pool. \n\n`;
    text += `Let us know if you have any questions or if you'd like to get on the schedule!`;
    return text;
  }, [serviceType, poolType, frequency, maintenancePrice, addons, address, matchedAddress]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800/80 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-outfit uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Service Pricing Matrix</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
              Maintenance & Routine Care Estimator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Calculate standard weekly maintenance, chemical inspections, and quarterly add-ons with automated distance-based Lafayette zone detection.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/60 backdrop-blur-md p-3 rounded-2xl border border-slate-800 self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Base</p>
              <p className="text-sm font-black font-outfit text-white">${maintenancePrice}.00 <span className="text-[10px] font-medium text-slate-400">/visit</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Addons (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Service Type & Core Specs */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-white text-base">Service Configuration</h3>
                <p className="text-[11px] text-slate-400">Choose service package and pool specifications</p>
              </div>
            </div>

            {/* Service Type Toggle Cards */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Service Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setServiceType('routine')}
                  className={`p-4 rounded-xl border transition-all text-left relative cursor-pointer ${
                    serviceType === 'routine'
                      ? 'border-sky-500 bg-sky-500/10 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${serviceType === 'routine' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Waves className="w-5 h-5" />
                    </div>
                    {serviceType === 'routine' && (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white font-outfit">Routine Maintenance</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Full cleaning service with all balancing chemicals included.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('chemCheck')}
                  className={`p-4 rounded-xl border transition-all text-left relative cursor-pointer ${
                    serviceType === 'chemCheck'
                      ? 'border-sky-500 bg-sky-500/10 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${serviceType === 'chemCheck' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'}`}>
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    {serviceType === 'chemCheck' && (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white font-outfit">Chemical-Only Check</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Trip fee + diagnostic water test. Chemicals billed on usage.
                  </p>
                </button>
              </div>
            </div>

            {/* Conditional Routine Maintenance Fields */}
            {serviceType === 'routine' && (
              <div className="space-y-5 pt-4 border-t border-slate-800/80">
                {/* Pool Configuration */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pool Configuration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPoolType('Pool')}
                      className={`p-3 rounded-xl border font-outfit text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        poolType === 'Pool'
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Waves className="w-4 h-4" />
                      <span>Pool Only</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPoolType('PoolSpa')}
                      className={`p-3 rounded-xl border font-outfit text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        poolType === 'PoolSpa'
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Pool & Spa Combo</span>
                    </button>
                  </div>
                </div>

                {/* Pool Capacity Slider */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pool Capacity
                    </label>
                    <span className="text-xs font-black font-outfit px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/20">
                      {capacity}k Gallons
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="40" 
                    step="5" 
                    value={capacity} 
                    onChange={(e) => setCapacity(parseInt(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1">
                    <span>10k gal (Small)</span>
                    <span>25k gal (Standard)</span>
                    <span>40k+ gal (Large)</span>
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Service Frequency
                  </label>
                  <select 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                    value={frequency} 
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="Weekly">1x Per Week (Standard Baseline)</option>
                    <option value="BiWeekly">Every Other Week (Seasonal Only)</option>
                    <option value="Multiple">2x+ Per Week (High Bather Load)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Conditional Chemical Check Fields */}
            {serviceType === 'chemCheck' && (
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Chemical Check Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChemCheckType('std')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      chemCheckType === 'std'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block font-outfit">Standard Chem Check</span>
                    <span className="text-[11px] font-mono text-cyan-400 mt-0.5 block">$45.00 / visit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChemCheckType('out')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      chemCheckType === 'out'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block font-outfit">Outside Lafayette</span>
                    <span className="text-[11px] font-mono text-cyan-400 mt-0.5 block">$55.00 / visit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Service Zone Override */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Service Pricing Zone
                </label>
                {distance !== null && (
                  <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    Auto-Resolved
                  </span>
                )}
              </div>
              <select 
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                value={zone} 
                onChange={(e) => {
                  setZone(e.target.value);
                  setDistance(null);
                }}
              >
                <option value="Zone1">Zone 1 (Lafayette Core - &lt; 8 miles)</option>
                <option value="Zone2">Zone 2 (Outer Suburbs - 8 to 15 miles)</option>
                <option value="Zone3">Zone 3 (Extended Service - 15 to 20 miles)</option>
              </select>
            </div>
          </div>

          {/* Card 2: Quarterly Add-ons */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div>
              <h3 className="font-outfit font-bold text-white text-base">Quarterly Maintenance Add-ons</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Recommended recurring operations to protect equipment and optimize sanitation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleAddon('cart')}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  addons.cart
                    ? 'border-sky-500 bg-sky-500/10 text-white ring-1 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    addons.cart ? 'bg-sky-500 border-sky-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {addons.cart && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Cartridge Deep Clean</span>
                    <span className="text-[10px] text-slate-400 block">Includes salt cell soak</span>
                  </div>
                </div>
                <span className="text-xs font-black font-outfit text-cyan-400">$100<span className="text-[10px] font-normal text-slate-400">/qtr</span></span>
              </button>

              <button
                type="button"
                onClick={() => toggleAddon('cell')}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  addons.cell
                    ? 'border-sky-500 bg-sky-500/10 text-white ring-1 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    addons.cell ? 'bg-sky-500 border-sky-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {addons.cell && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Salt Cell Descaling</span>
                    <span className="text-[10px] text-slate-400 block">Removes calcium buildup</span>
                  </div>
                </div>
                <span className="text-xs font-black font-outfit text-cyan-400">$50<span className="text-[10px] font-normal text-slate-400">/qtr</span></span>
              </button>
            </div>
          </div>

          {/* Card 3: Address & Radial Zone Calculator */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-white text-base">Service Location & Distance Geocoder</h3>
                <p className="text-[11px] text-slate-400">Calculate exact radial mileage from dispatch hub (30.187, -92.092)</p>
              </div>
            </div>

            <form onSubmit={handleCalculateZone} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. 101 E Vermilion St, Lafayette, LA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                disabled={calcStatus === 'loading'}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 font-outfit"
              >
                {calcStatus === 'loading' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>Calculate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Radial Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Hub (0 mi)</span>
                <span>Zone 1 (&lt;8 mi)</span>
                <span>Zone 2 (8-15 mi)</span>
                <span>Zone 3 (15-20 mi)</span>
              </div>
              <div className="relative h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex">
                <div className="h-full bg-emerald-500/20 border-r border-emerald-500/30" style={{ width: '40%' }}></div>
                <div className="h-full bg-sky-500/20 border-r border-sky-500/30" style={{ width: '35%' }}></div>
                <div className="h-full bg-indigo-500/20 border-r border-indigo-500/30" style={{ width: '25%' }}></div>
                
                {distance !== null && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 border-2 border-slate-950 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center"
                    style={{ 
                      left: `${Math.min(100, (distance / 20) * 100)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400/40 opacity-75"></span>
                  </div>
                )}
              </div>

              {calcStatus === 'success' && distance !== null && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs mt-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Distance: {distance.toFixed(2)} radial miles</span>
                    {matchedAddress && (
                      <span className="text-[11px] text-slate-400 block leading-snug">
                        {matchedAddress}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Coords: {coords?.lat?.toFixed(4)}, {coords?.lng?.toFixed(4)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase font-outfit shadow-sm whitespace-nowrap ${
                    distance < 8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    distance <= 15 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    distance <= 20 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                  }`}>
                    {distance < 8 ? 'Zone 1 (Core)' :
                     distance <= 15 ? 'Zone 2 (Suburbs)' :
                     distance <= 20 ? 'Zone 3 (Outer)' :
                     'Out of Range'}
                  </span>
                </div>
              )}

              {calcStatus === 'error' && (
                <div className="bg-red-950/40 text-red-300 text-xs p-3 rounded-xl border border-red-800/50 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>Could not resolve address location. Please enter a valid street address.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Rate Summary & Quote Generator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Rate Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full border border-sky-500/20 font-outfit">
                Rate Sheet Preview
              </span>
              {distance !== null && distance > 20 && (
                <span className="text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  Extended Radius
                </span>
              )}
            </div>

            <div className="my-6 relative z-10 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Per Visit Rate
                </div>
                <div className="text-4xl sm:text-5xl font-black font-outfit text-white tracking-tight mt-1 flex items-baseline">
                  ${maintenancePrice}
                  <span className="text-xs text-slate-400 font-medium ml-2">/ visit</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {serviceType === 'routine' 
                    ? 'Includes full physical cleaning & balancing chemicals' 
                    : 'Trip fee only (chemicals billed separately by volume)'}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-3.5 flex justify-between items-baseline">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quarterly Add-ons</div>
                  <span className="text-[10px] text-slate-500">Scheduled filter & cell maintenance</span>
                </div>
                <div className="text-xl font-black font-outfit text-cyan-400">
                  ${calculateAddonsTotal()}
                  <span className="text-xs text-slate-400 font-medium ml-1">/ qtr</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic relative z-10 border-t border-slate-800/60 pt-3">
              *All maintenance rates subject to initial on-site equipment inspection.
            </div>
          </div>

          {/* Conditional Alerts */}
          {serviceType === 'routine' && frequency !== 'Weekly' && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl flex items-start space-x-3 text-amber-200 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-amber-300">Frequency Advisory:</strong>
                Standard maintenance requires weekly service to guarantee water chemistry. Non-weekly schedules require signed chemical disclaimers.
              </div>
            </div>
          )}

          {distance !== null && distance > 20 && (
            <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-start space-x-3 text-red-200 text-xs leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-red-300">Out of Standard Range:</strong>
                Calculated radial distance ({distance.toFixed(1)} miles) exceeds the 20-mile standard boundary. Route dispatch surcharge applies.
              </div>
            </div>
          )}

          {/* Customer Quote Copy Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">
                  Customer Quote Generator
                </h4>
                <p className="text-[10px] text-slate-400">Formatted for instant SMS or email transmission.</p>
              </div>
              <Info className="w-4 h-4 text-slate-500" />
            </div>

            <textarea
              readOnly
              value={copyText}
              className="w-full h-44 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] font-mono leading-relaxed text-slate-300 focus:outline-none resize-none"
            />

            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black font-outfit transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 shadow-sky-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Customer Quote Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
