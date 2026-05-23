import { useState, useMemo } from 'react';
import { Calculator, Check, AlertTriangle, MapPin, Copy, Search, RefreshCw, Lock, Unlock, Wrench } from 'lucide-react';
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

const REPAIR_PARTS = {
  B2855: { name: '2HP Square Flange Motor (B2855)', price: 450.00, category: 'Motors' },
  B2852: { name: '3/4HP Square Flange Motor (B2852)', price: 329.99, category: 'Motors' },
  'Go-Kit32-9': { name: 'Whisperflo Go-Kit (Go-Kit32-9)', price: 55.00, category: 'Seal Kits' }
};

const REPAIR_LABOR = {
  standard: { name: 'Standard Pump Motor Labor', price: 195.00 },
  none: { name: 'Parts Only (No Labor)', price: 0.00 }
};

const TAX_RATE = 0.09;

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

export default function Estimator({ activeTab = 'maintenance' }) {
  // Repair Calculator State
  const [selectedMotor, setSelectedMotor] = useState(null); // null | 'B2855' | 'B2852' | 'none'
  const [selectedSealKit, setSelectedSealKit] = useState(null); // null | 'Go-Kit32-9' | 'none'
  const [selectedLabor, setSelectedLabor] = useState(null); // null | 'standard' | 'none'
  const [repairCopied, setRepairCopied] = useState(false);

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

  // Clipboard States
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
          // If out of range, default pricing zone to Zone3 as baseline
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

  // Repair pricing calculation
  const repairPricing = useMemo(() => {
    if (selectedMotor === null || selectedSealKit === null || selectedLabor === null) {
      return null;
    }

    const motorPrice = selectedMotor === 'none' ? 0 : REPAIR_PARTS[selectedMotor].price;
    const sealKitPrice = selectedSealKit === 'none' ? 0 : REPAIR_PARTS[selectedSealKit].price;
    const partsSubtotal = motorPrice + sealKitPrice;
    
    const laborPrice = selectedLabor === 'standard' ? REPAIR_LABOR.standard.price : 0;
    
    const taxAmount = partsSubtotal * TAX_RATE;
    const total = partsSubtotal + laborPrice + taxAmount;

    return {
      partsSubtotal,
      laborPrice,
      taxAmount,
      total
    };
  }, [selectedMotor, selectedSealKit, selectedLabor]);

  // Repair estimate copy text
  const repairCopyText = useMemo(() => {
    if (!repairPricing) return '';

    let text = `Hi! Here is your pool repair estimate from Cricket's Pool & Spa World\n\n`;
    text += `Service Details:\n`;
    
    if (selectedMotor !== 'none') {
      text += `• Motor: ${REPAIR_PARTS[selectedMotor].name} - $${REPAIR_PARTS[selectedMotor].price.toFixed(2)}\n`;
    }
    if (selectedSealKit !== 'none') {
      text += `• Seal Kit: ${REPAIR_PARTS[selectedSealKit].name} - $${REPAIR_PARTS[selectedSealKit].price.toFixed(2)}\n`;
    }
    
    text += `• Parts Subtotal: $${repairPricing.partsSubtotal.toFixed(2)}\n`;
    
    if (selectedLabor !== 'none') {
      text += `• Labor: ${REPAIR_LABOR[selectedLabor].name} - $${repairPricing.laborPrice.toFixed(2)}\n`;
    } else {
      text += `• Labor: Self-Installation / Parts Only ($0.00)\n`;
    }
    
    text += `• Sales Tax (9%): $${repairPricing.taxAmount.toFixed(2)}\n`;
    text += `• Total Estimate: $${repairPricing.total.toFixed(2)}\n\n`;
    text += `*Please note: All estimates are subject to a final visual inspection of the equipment. \n\n`;
    text += `Let us know if you have any questions or if you'd like to approve this estimate!`;
    
    return text;
  }, [selectedMotor, selectedSealKit, selectedLabor, repairPricing]);

  const handleCopyRepair = () => {
    navigator.clipboard.writeText(repairCopyText);
    setRepairCopied(true);
    setTimeout(() => setRepairCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {activeTab === 'maintenance' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Column: Configuration Forms (col-span-3) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Card 1: Service Type & Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-premium space-y-6">
              <div className="flex items-center space-x-2.5">
                <Calculator className="w-5 h-5 text-brand-blue" />
                <h3 className="font-outfit font-bold text-slate-800 text-base">Configure Service details</h3>
              </div>

              {/* Service Type Toggle Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Service Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType('routine')}
                    className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left relative ${
                      serviceType === 'routine'
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                        : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl mb-1">🏊‍♂️</span>
                      {serviceType === 'routine' && <Check className="w-4 h-4 text-brand-blue" />}
                    </div>
                    <span className="text-sm font-bold text-slate-800">Routine Maintenance</span>
                    <span className="text-[11px] font-normal text-slate-400 mt-1">Includes cleaning & chemicals</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('chemCheck')}
                    className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left relative ${
                      serviceType === 'chemCheck'
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                        : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl mb-1">🧪</span>
                      {serviceType === 'chemCheck' && <Check className="w-4 h-4 text-brand-blue" />}
                    </div>
                    <span className="text-sm font-bold text-slate-800">Chemical-Only Check</span>
                    <span className="text-[11px] font-normal text-slate-400 mt-1">Trip cost + balancing chemicals</span>
                  </button>
                </div>
              </div>

              {/* Conditional Routine Maintenance Fields */}
              {serviceType === 'routine' && (
                <div className="space-y-5 border-t border-slate-100 pt-5 animate-fade-in">
                  
                  {/* Pool Configuration */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pool Configuration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPoolType('Pool')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                          poolType === 'Pool'
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                            : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-lg mb-0.5">🏊</span>
                        <span className="text-xs">Pool Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPoolType('PoolSpa')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                          poolType === 'PoolSpa'
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                            : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-lg mb-0.5">♨️</span>
                        <span className="text-xs">Pool/Spa Combo</span>
                      </button>
                    </div>
                  </div>

                  {/* Pool Capacity Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pool Capacity</label>
                      <span className="text-xs font-extrabold px-2.5 py-1 bg-brand-blue/15 text-brand-blue rounded-full">
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
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 pt-1">
                      <span>10k (Small)</span>
                      <span>25k (Medium)</span>
                      <span>40k+ (Large)</span>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Frequency</label>
                    <select 
                      className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-slate-800 font-medium transition-all"
                      value={frequency} 
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      <option value="Weekly">1x Per Week (Standard)</option>
                      <option value="BiWeekly">Every Other Week (Seasonal)</option>
                      <option value="Multiple">2x+ Per Week (High Load)</option>
                    </select>
                  </div>

                </div>
              )}

              {/* Conditional Chemical Check Fields */}
              {serviceType === 'chemCheck' && (
                <div className="space-y-4 border-t border-slate-100 pt-5 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Chemical Check Option</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setChemCheckType('std')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                          chemCheckType === 'std'
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                            : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-sm font-semibold">Standard Chem Check</span>
                        <span className="text-[10px] font-bold opacity-80 mt-1">$45 / visit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChemCheckType('out')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                          chemCheckType === 'out'
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                            : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-sm font-semibold">Outside Lafayette</span>
                        <span className="text-[10px] font-bold opacity-80 mt-1">$55 / visit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Zone Selection (Manual Fallback / Display) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Zone</label>
                  {distance !== null && (
                    <span className="text-[10px] font-extrabold text-brand-teal uppercase bg-brand-teal/10 px-2 py-0.5 rounded-md">
                      Auto-Resolved
                    </span>
                  )}
                </div>
                <select 
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-slate-800 font-medium transition-all"
                  value={zone} 
                  onChange={(e) => {
                    setZone(e.target.value);
                    // Clear distance indicator if zone is forced manually
                    setDistance(null);
                  }}
                >
                  <option value="Zone1">Zone 1 (Core Area - &lt; 8 miles)</option>
                  <option value="Zone2">Zone 2 (Outer Suburbs - 8-15 miles)</option>
                  <option value="Zone3">Zone 3 (Extended Service - 15-20 miles)</option>
                </select>
              </div>
            </div>

            {/* Card 2: Quarterly Add-on Services */}
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-premium space-y-4">
              <div>
                <h3 className="font-outfit font-bold text-slate-800 text-base">Quarterly Maintenance Add-ons</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Select recommended quarterly operations for cleaner water and well-maintained machinery.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleAddon('cart')}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    addons.cart
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      addons.cart ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {addons.cart && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Cartridge Cleaning</span>
                      <span className="text-[10px] text-slate-400">includes salt cell cleaning if cell is present</span>
                    </div>
                  </div>
                  <span className="text-xs font-black font-outfit">$100/qtr</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAddon('cell')}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    addons.cell
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      addons.cell ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {addons.cell && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Salt Cell Cleaning</span>
                      <span className="text-[10px] text-slate-400">Scale removal</span>
                    </div>
                  </div>
                  <span className="text-xs font-black font-outfit">$50/qtr</span>
                </button>
              </div>
            </div>

            {/* Card 3: Address & Service Zone Calculator */}
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-premium space-y-5">
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-5 h-5 text-brand-teal" />
                <h3 className="font-outfit font-bold text-slate-800 text-base">Service Location & Zone Calculator</h3>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the pool address to calculate the radial distance from our dispatch location <code className="bg-slate-50 px-1 py-0.5 rounded font-mono text-[10px] border border-slate-200">30.187, -92.092</code>. This automatically resolves the correct rate zone.
              </p>

              <form onSubmit={handleCalculateZone} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. 101 E Vermilion St, Lafayette, LA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-slate-800 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <button
                  type="submit"
                  disabled={calcStatus === 'loading'}
                  className="bg-brand-blue hover:bg-brand-blueDark disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {calcStatus === 'loading' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Calculate'
                  )}
                </button>
              </form>

              {/* Visual radial distance indicator bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Office (0 mi)</span>
                  <span>Zone 1 (&lt;8 mi)</span>
                  <span>Zone 2 (8-15 mi)</span>
                  <span>Zone 3 (15-20 mi)</span>
                </div>
                <div className="relative h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex">
                  <div className="h-full bg-teal-500/10 border-r border-teal-500/20" style={{ width: '40%' }}></div>
                  <div className="h-full bg-blue-500/10 border-r border-blue-500/20" style={{ width: '35%' }}></div>
                  <div className="h-full bg-indigo-500/10 border-r border-indigo-500/20" style={{ width: '25%' }}></div>
                  
                  {distance !== null && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-blue border-2 border-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center"
                      style={{ 
                        left: `${Math.min(100, (distance / 20) * 100)}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue/30 opacity-75"></span>
                    </div>
                  )}
                </div>

                {calcStatus === 'success' && distance !== null && (
                  <div className="flex justify-between items-center text-xs mt-2 bg-slate-50 p-3 rounded-xl border border-brand-border">
                    <div className="space-y-1 pr-4">
                      <span className="font-bold text-slate-700 block">Radial Distance: {distance.toFixed(2)} miles</span>
                      {matchedAddress && (
                        <span className="text-[11px] font-semibold text-slate-600 block mt-0.5 leading-snug">
                          Matched Address: {matchedAddress}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">Coords: {coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-bold text-[10px] shadow-sm uppercase ${
                      distance < 8 ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      distance <= 15 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      distance <= 20 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                      'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                    }`}>
                      {distance < 8 ? 'Zone 1' :
                       distance <= 15 ? 'Zone 2' :
                       distance <= 20 ? 'Zone 3' :
                       'Out of Service'}
                    </span>
                  </div>
                )}

                {calcStatus === 'error' && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-200 flex items-center space-x-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                    <span>Could not calculate distance. Please check the address format and try again.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Pricing & Live Summary (col-span-2) */}
          <div className="md:col-span-2 space-y-4">
            
            {/* Card 1: Live Pricing Display */}
            <div className="bg-brand-dark bg-gradient-to-br from-brand-dark to-brand-slate text-white p-6 rounded-3xl border border-brand-slate shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-brand-blue/10 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] text-brand-blueLight font-semibold uppercase tracking-wider bg-brand-blue/10 px-2.5 py-0.5 rounded-full border border-brand-blue/20">
                  Rate Sheet Preview
                </span>
                {distance !== null && distance > 20 && (
                  <span className="text-[10px] text-amber-300 font-extrabold uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                    Out of Area
                  </span>
                )}
              </div>

              <div className="my-6 z-10 space-y-4">
                {/* Maintenance pricing */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">Per Visit Maintenance</div>
                  <div className="text-4xl font-black font-outfit text-white tracking-tight mt-1 flex items-baseline">
                    ${maintenancePrice}
                    <span className="text-xs text-slate-400 font-medium ml-1.5">/ visit</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    {serviceType === 'routine' 
                      ? 'Includes cleaning & balancing chemicals' 
                      : 'Per trip cost (chemicals billed separate)'}
                  </p>
                </div>

                {/* Quarterly add-ons pricing */}
                <div className="border-t border-slate-700/55 pt-3.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">Quarterly Add-ons</div>
                  <div className="text-2xl font-black font-outfit text-brand-blueLight tracking-tight mt-1 flex items-baseline">
                    ${calculateAddonsTotal()}
                    <span className="text-xs text-slate-400 font-medium ml-1.5">/ quarter</span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 italic z-10">
                Subject to visual inspect and signed contract agreement.
              </div>
            </div>

            {/* Conditional Warning Alerts */}
            <div className="space-y-2">
              {serviceType === 'routine' && frequency !== 'Weekly' && (
                <div className="bg-amber-50 border-l-4 border-brand-warning p-4 rounded-xl flex items-start space-x-3 shadow-premium">
                  <AlertTriangle className="w-5 h-5 text-brand-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-amber-900">
                    <strong className="font-bold block mb-0.5">Frequency Notice:</strong> 
                    Standard visits require weekly frequency. Other schedules require a signed waiver and custom manual quotation.
                  </div>
                </div>
              )}

              {distance !== null && distance > 20 && (
                <div className="bg-red-50 border-l-4 border-brand-danger p-4 rounded-xl flex items-start space-x-3 shadow-premium">
                  <AlertTriangle className="w-5 h-5 text-brand-danger flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-red-900">
                    <strong className="font-bold block mb-0.5">Out of Service Radius:</strong> 
                    Calculated distance is {distance.toFixed(1)} miles, which exceeds our standard 20-mile range. Custom trip surcharges may apply.
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Generated Customer Estimate & Clipboard */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium flex flex-col space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">Customer Estimate Text</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Ready to copy and send to the customer via SMS or Email.</p>
              </div>
              
              <textarea
                readOnly
                value={copyText}
                className="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed text-slate-700 focus:outline-none resize-none"
              />

              <button
                type="button"
                onClick={handleCopy}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-outfit transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  copied
                    ? 'bg-brand-success text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column: Repair Calculator Choices */}
          <div className="md:col-span-3 space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-premium space-y-6">
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-5 h-5 text-brand-blue" />
                <h3 className="font-outfit font-bold text-slate-800 text-base">Configure Repair Details</h3>
              </div>

              {/* 1. Select Motor */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    1. Select Pump Motor
                  </label>
                  {selectedMotor === null && (
                    <span className="text-[10px] text-brand-danger font-extrabold uppercase bg-red-100 px-2 py-0.5 rounded-md animate-pulse">
                      Required
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMotor('B2855')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedMotor === 'B2855'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedMotor === 'B2855' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedMotor === 'B2855' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">2HP Square Flange Motor (B2855)</span>
                        <span className="text-[10px] text-slate-400">Fits Whisperflo Pumps - High Power</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$450.00</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMotor('B2852')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedMotor === 'B2852'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedMotor === 'B2852' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedMotor === 'B2852' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">3/4HP Square Flange Motor (B2852)</span>
                        <span className="text-[10px] text-slate-400">Fits Standard Pumps - Efficiency</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$329.99</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMotor('none')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedMotor === 'none'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedMotor === 'none' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedMotor === 'none' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">No Motor</span>
                        <span className="text-[10px] text-slate-400">Buying seal kit or labor only</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$0.00</span>
                  </button>
                </div>
              </div>

              {/* 2. Select Seal Kit */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    2. Select Seal Kit
                  </label>
                  {selectedSealKit === null && (
                    <span className="text-[10px] text-brand-danger font-extrabold uppercase bg-red-100 px-2 py-0.5 rounded-md animate-pulse">
                      Required
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSealKit('Go-Kit32-9')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedSealKit === 'Go-Kit32-9'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedSealKit === 'Go-Kit32-9' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedSealKit === 'Go-Kit32-9' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Whisperflo Go-Kit (Go-Kit32-9)</span>
                        <span className="text-[10px] text-slate-400">Includes shaft seal, gaskets, and o-rings</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$55.00</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSealKit('none')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedSealKit === 'none'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedSealKit === 'none' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedSealKit === 'none' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">No Seal Kit</span>
                        <span className="text-[10px] text-brand-danger font-semibold">Not Recommended</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$0.00</span>
                  </button>
                </div>
              </div>

              {/* 3. Labor Option */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    3. Labor & Installation
                  </label>
                  {selectedLabor === null && (
                    <span className="text-[10px] text-brand-danger font-extrabold uppercase bg-red-100 px-2 py-0.5 rounded-md animate-pulse">
                      Required
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedLabor('standard')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedLabor === 'standard'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedLabor === 'standard' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedLabor === 'standard' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Standard Pump Motor Labor</span>
                        <span className="text-[10px] text-slate-400">Professional technician install & testing</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$195.00</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLabor('none')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                      selectedLabor === 'none'
                        ? 'border-brand-blue bg-brand-blue/5 text-slate-800'
                        : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        selectedLabor === 'none' ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selectedLabor === 'none' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Parts Only (No Labor)</span>
                        <span className="text-[10px] text-slate-400">Self-installation by customer</span>
                      </div>
                    </div>
                    <span className="text-xs font-black font-outfit text-slate-800">$0.00</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Summary */}
          <div className="md:col-span-2 space-y-4">
            {!repairPricing ? (
              /* Locked Calculator view */
              <div className="bg-brand-dark bg-gradient-to-br from-brand-dark to-brand-slate text-white p-6 rounded-3xl border border-brand-slate shadow-xl flex flex-col justify-center items-center text-center min-h-[220px] relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-brand-blue/10 rounded-full blur-2xl"></div>
                <Lock className="w-10 h-10 text-brand-blueLight mb-3 animate-pulse z-10" />
                <h4 className="font-outfit font-bold text-sm text-slate-200 uppercase tracking-wider z-10">Calculator Locked</h4>
                <p className="text-[11px] text-slate-400 mt-2 max-w-[200px] leading-relaxed z-10">
                  Please complete the selections on the left to reveal the pricing and generate the estimate.
                </p>
              </div>
            ) : (
              /* Unlocked Calculator view */
              <div className="bg-brand-dark bg-gradient-to-br from-brand-dark to-brand-slate text-white p-6 rounded-3xl border border-brand-slate shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px] animate-fade-in">
                <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-brand-teal/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start z-10">
                  <span className="text-[10px] text-brand-tealLight font-semibold uppercase tracking-wider bg-brand-teal/10 px-2.5 py-0.5 rounded-full border border-brand-teal/20 flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Ready
                  </span>
                </div>

                <div className="my-6 z-10 space-y-3">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Parts Subtotal:</span>
                    <span className="font-mono text-slate-200">${repairPricing.partsSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Labor & Install:</span>
                    <span className="font-mono text-slate-200">${repairPricing.laborPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Sales Tax (9%):</span>
                    <span className="font-mono text-slate-200">${repairPricing.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700/55 pt-3 flex justify-between items-baseline">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-sans font-bold">Total Estimate</span>
                    <div className="text-3xl font-black font-outfit text-white tracking-tight">
                      ${repairPricing.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 italic z-10">
                  Subject to visual inspection. Pricing includes standard retail markup.
                </div>
              </div>
            )}

            {/* Warnings and notices */}
            {selectedSealKit === 'none' && selectedMotor !== null && selectedMotor !== 'none' && (
              <div className="bg-red-50 border-l-4 border-brand-danger p-4 rounded-xl flex items-start space-x-3 shadow-premium animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-brand-danger flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-red-900">
                  <strong className="font-bold block mb-0.5">Critical Seal Kit Notice:</strong>
                  Replacing a pump motor without installing a new seal kit is highly discouraged. Reusing old seals almost always results in shaft seal leaks, which can damage the new motor immediately and void the warranty.
                </div>
              </div>
            )}

            {/* Estimate generator & clipboard copy */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium flex flex-col space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">Repair Estimate Text</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Ready to copy and send to the customer.</p>
              </div>

              <textarea
                readOnly
                placeholder="Complete calculator selections to generate estimate text..."
                value={repairCopyText}
                className="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed text-slate-700 focus:outline-none resize-none disabled:opacity-50"
                disabled={!repairPricing}
              />

              <button
                type="button"
                onClick={handleCopyRepair}
                disabled={!repairPricing}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-outfit transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed ${
                  repairCopied
                    ? 'bg-brand-success text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                }`}
              >
                {repairCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
