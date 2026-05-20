import { useState, useEffect } from 'react';
import { Calculator, Sparkles, Check, AlertTriangle, HelpCircle } from 'lucide-react';

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

export default function Estimator() {
  const [subTab, setSubTab] = useState('residential');

  // Residential Calculator State
  const [zone, setZone] = useState('Zone1');
  const [poolType, setPoolType] = useState('Pool');
  const [capacity, setCapacity] = useState(15);
  const [frequency, setFrequency] = useState('Weekly');
  const [resPrice, setResPrice] = useState(0);

  // Addons State
  const [addons, setAddons] = useState({
    stdChem: false,
    outChem: false,
    cart: false,
    cell: false
  });

  // Calculate Residential Price
  useEffect(() => {
    let capKey = capacity;
    if (capacity < 10) capKey = 10;
    if (capacity > 40) capKey = 40;
    const basePrice = PRICING_MATRIX[zone][poolType][capKey];
    setResPrice(basePrice);
  }, [zone, poolType, capacity]);

  // Handle Addon Toggles with Mutual Exclusion
  const toggleAddon = (key) => {
    setAddons(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      
      // Mutual exclusion for chemical checks
      if (key === 'stdChem' && newState.stdChem) newState.outChem = false;
      if (key === 'outChem' && newState.outChem) newState.stdChem = false;
      
      // Mutual exclusion for cleanings
      if (key === 'cart' && newState.cart) newState.cell = false;
      if (key === 'cell' && newState.cell) newState.cart = false;

      return newState;
    });
  };

  const calculateAddonsTotal = () => {
    let total = 0;
    if (addons.stdChem) total += 45;
    if (addons.outChem) total += 55;
    if (addons.cart) total += 100;
    if (addons.cell) total += 50;
    return total;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      {/* View Selector Tabs */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex space-x-1.5 border border-slate-300/40">
        <button
          onClick={() => setSubTab('residential')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold font-outfit transition-all duration-200 ${
            subTab === 'residential'
              ? 'bg-white shadow-premium text-brand-blue'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Residential Estimate
        </button>
        <button
          onClick={() => setSubTab('addons')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold font-outfit transition-all duration-200 ${
            subTab === 'addons'
              ? 'bg-white shadow-premium text-brand-blue'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Add-Ons & Services
        </button>
      </div>

      {subTab === 'residential' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Residential Form Controls */}
          <div className="md:col-span-3 bg-white p-5.5 rounded-2xl border border-brand-border shadow-premium space-y-5">
            <h3 className="text-base font-bold font-outfit text-slate-800 flex items-center">
              <Calculator className="w-4.5 h-4.5 mr-2 text-brand-blue" />
              Configure Quote details
            </h3>

            {/* Service Zone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Zone</label>
              <select 
                className="w-full bg-slate-50 border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-slate-800 font-medium transition-all"
                value={zone} 
                onChange={(e) => setZone(e.target.value)}
              >
                <option value="Zone1">Zone 1 (Core Area)</option>
                <option value="Zone2">Zone 2 (Outer Suburbs)</option>
                <option value="Zone3">Zone 3 (Extended Service)</option>
              </select>
            </div>

            {/* Pool Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pool Configuration</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPoolType('Pool')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all text-center ${
                    poolType === 'Pool'
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                      : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                  }`}
                >
                  <span className="text-xl mb-1">🏊‍♂️</span>
                  <span className="text-xs">Pool Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPoolType('PoolSpa')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all text-center ${
                    poolType === 'PoolSpa'
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-bold shadow-sm'
                      : 'border-brand-border bg-white text-slate-500 hover:border-slate-300 font-medium'
                  }`}
                >
                  <span className="text-xl mb-1">♨️</span>
                  <span className="text-xs">Pool/Spa Combo</span>
                </button>
              </div>
            </div>

            {/* Capacity Slider */}
            <div className="space-y-2 pt-1.5">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
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

          {/* Pricing Visualizer */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="bg-brand-dark bg-gradient-to-br from-brand-dark to-brand-slate text-white p-6 rounded-3xl border border-brand-slate shadow-xl flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden animate-pulse-glow">
              {/* Background gradient ring */}
              <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-brand-blue/10 rounded-full blur-2xl"></div>
              
              <span className="text-xs text-brand-blueLight font-semibold uppercase tracking-wider bg-brand-blue/10 px-3 py-1 rounded-full border border-brand-blue/20 mb-3.5">
                Estimated Rate
              </span>
              <div className="text-brand-blueLight text-xs font-bold uppercase tracking-widest font-sans">Base Rate</div>
              <div className="text-5xl font-black font-outfit text-white tracking-tight my-2 relative z-10">
                ${resPrice}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal max-w-[150px] relative z-10">
                per visit / routine maintenance
              </p>
            </div>

            {frequency !== 'Weekly' && (
              <div className="bg-amber-50 border-l-4 border-brand-warning p-4 rounded-xl flex items-start space-x-3 shadow-premium">
                <AlertTriangle className="w-5.5 h-5.5 text-brand-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-900">
                  <strong className="font-bold block mb-0.5">Notice:</strong> 
                  Standard visits require 1x per week maintenance. Other schedules require a signed waiver and custom manual quotation.
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Addons Checklist View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standalone Chemical Check */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium space-y-4">
              <div>
                <h3 className="font-outfit font-bold text-slate-900 text-base">Chemical-Only Checks</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Standalone visits including water testing and balancing chemicals.</p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAddon('stdChem')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                    addons.stdChem
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      addons.stdChem ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {addons.stdChem && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm font-semibold">Standard Chemical Check</span>
                  </div>
                  <span className="text-sm font-extrabold font-outfit">$45</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAddon('outChem')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                    addons.outChem
                      ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                      : 'border-brand-border bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      addons.outChem ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {addons.outChem && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm font-semibold">Outside Lafayette Check</span>
                  </div>
                  <span className="text-sm font-extrabold font-outfit">$55</span>
                </button>
              </div>
            </div>

            {/* Quarterly Cleaning Services */}
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium space-y-4">
              <div>
                <h3 className="font-outfit font-bold text-slate-900 text-base">Quarterly Maintenance</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Cartridge pressure cleaning and salt cell scale removal.</p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAddon('cart')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
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
                    <span className="text-sm font-semibold">Cartridge Cleaning</span>
                  </div>
                  <span className="text-sm font-extrabold font-outfit">$100</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAddon('cell')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
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
                    <span className="text-sm font-semibold">Salt Cell Cleaning Only</span>
                  </div>
                  <span className="text-sm font-extrabold font-outfit">$50</span>
                </button>
              </div>
            </div>
          </div>

          {/* Addons Total Summary */}
          {calculateAddonsTotal() > 0 && (
            <div className="bg-brand-dark bg-gradient-to-r from-brand-dark to-brand-slate text-white p-5 rounded-2xl border border-brand-slate shadow-lg flex items-center justify-between px-6 animate-slide-in">
              <div className="flex items-center space-x-3">
                <div className="bg-brand-blue/20 p-2 rounded-xl text-brand-blueLight border border-brand-blueLight/10">
                  <Sparkles className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-outfit">Add-Ons Total</h4>
                  <p className="text-[11px] text-slate-400">Calculated extra fee for selected items.</p>
                </div>
              </div>
              <div className="text-3xl font-black font-outfit text-brand-blueLight">
                ${calculateAddonsTotal()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
