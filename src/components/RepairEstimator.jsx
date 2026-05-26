import { useState, useEffect, useMemo } from 'react';
import { Wrench, Search, Plus, Minus, Trash2, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchRepairKits, fetchRepairParts } from '../api';

export default function RepairEstimator() {
  const [kits, setKits] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePumpModel, setActivePumpModel] = useState('All');

  // Pump model filter options
  const pumpModels = ['All', 'Whisperflo', 'Challenger', 'Superflo', 'Super Pump'];

  // Helper to match kit against pump models case-insensitively using keywords
  const matchesPumpModel = (kit, model) => {
    if (model === 'All') return true;
    
    const desc = (kit['Kit (Description)'] || '').toLowerCase();
    const partsList = (kit['Parts List'] || '').toLowerCase();
    const addOns = (kit['Add-Ons'] || '').toLowerCase();
    const combinedText = `${desc} ${partsList} ${addOns}`;

    switch (model) {
      case 'Whisperflo':
        // Match whisperflo and common typos like whiserflo
        return combinedText.includes('whisperflo') || combinedText.includes('whiserflo');
      case 'Challenger':
        return combinedText.includes('challenger');
      case 'Superflo':
        return combinedText.includes('superflo');
      case 'Super Pump':
        return combinedText.includes('super pump') || combinedText.includes('superpump');
      default:
        return false;
    }
  };

  // Selection state of each part in a kit: { [kitDescription]: { [partNumber]: true/false } }
  const [selectedPartsState, setSelectedPartsState] = useState({});

  // Estimate cart state
  const [selectedItems, setSelectedItems] = useState([]);
  const [copied, setCopied] = useState(false);

  // Custom Item Form states
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);
  // Load kits and parts from Google Apps Script Web App
  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [kitsData, partsData] = await Promise.all([
        fetchRepairKits(),
        fetchRepairParts()
      ]);
      setKits(kitsData);
      setParts(partsData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Could not retrieve data from your spreadsheet. Please verify Google Apps Script deployment settings.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initLoad = async () => {
      try {
        const [kitsData, partsData] = await Promise.all([
          fetchRepairKits(),
          fetchRepairParts()
        ]);
        if (active) {
          setKits(kitsData);
          setParts(partsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load data on mount:', err);
        if (active) {
          setError('Could not retrieve data from your spreadsheet. Please verify Google Apps Script deployment settings.');
          setLoading(false);
        }
      }
    };
    initLoad();
    return () => {
      active = false;
    };
  }, []);

  // Safe parsing helper
  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper to extract parts and add-ons and match them to the parts inventory database
  const getKitParts = (kit) => {
    const basePartsListStr = kit['Parts List'];
    const addonPartsListStr = kit['Add-Ons'];
    
    const parsePartStr = (partsListStr, isAddon) => {
      if (!partsListStr) return [];
      return partsListStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(partToken => {
          // Look for quantity markers like "RubySand x6"
          const qtyMatch = partToken.match(/x\s*(\d+)/i);
          const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
          const partNoClean = partToken.replace(/x\s*\d+/i, '').trim();

          // Find matching part in loaded parts list (case-insensitive)
          const match = parts.find(
            dbPart => String(dbPart['Part Number']).trim().toLowerCase() === partNoClean.toLowerCase()
          );

          if (match) {
            return {
              partNumber: match['Part Number'],
              description: match['Description'] || match['Part Number'],
              retailPrice: parseNum(match['Retail Price']),
              quantity: quantity,
              isAddon,
              found: true
            };
          }

          // Fallback if not found in database: treat it as a generic part with 0 price
          return {
            partNumber: partNoClean,
            description: partNoClean,
            retailPrice: 0,
            quantity: quantity,
            isAddon,
            found: false
          };
        });
    };

    return [
      ...parsePartStr(basePartsListStr, false),
      ...parsePartStr(addonPartsListStr, true)
    ];
  };

  // Get checked status of a part
  const isPartChecked = (kitDesc, part) => {
    const stateValue = selectedPartsState[kitDesc]?.[part.partNumber];
    if (stateValue !== undefined) {
      return stateValue;
    }
    // Default state: base parts are checked, add-ons are unchecked
    return !part.isAddon;
  };

  // Toggle selection status of a part
  const togglePart = (kitDesc, part) => {
    setSelectedPartsState(prev => {
      const kitState = prev[kitDesc] || {};
      const currentValue = kitState[part.partNumber] !== undefined ? kitState[part.partNumber] : !part.isAddon;
      return {
        ...prev,
        [kitDesc]: {
          ...kitState,
          [part.partNumber]: !currentValue
        }
      };
    });
  };

  // Calculate live kit price based on selected parts
  const calculateKitPrice = (kit) => {
    const kitDesc = kit['Kit (Description)'];
    const labor = parseNum(kit['Labor']);
    const kitParts = getKitParts(kit);
    
    // Filter down to only checked parts
    const activeParts = kitParts.filter(
      part => isPartChecked(kitDesc, part)
    );

    const partsCost = activeParts.reduce((acc, part) => acc + (part.retailPrice * part.quantity), 0);
    const taxCost = partsCost * 0.09; // 9.0% sales tax on parts
    
    return labor + partsCost + taxCost;
  };

  // Extract unique categories from kits
  const categories = useMemo(() => {
    const cats = new Set(kits.map(k => k.Category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [kits]);

  // Filter kits based on active category, pump model & search query
  const filteredKits = useMemo(() => {
    let result = kits;
    if (activeCategory !== 'All') {
      result = result.filter(kit => kit.Category === activeCategory);
    }
    if (activePumpModel !== 'All') {
      result = result.filter(kit => matchesPumpModel(kit, activePumpModel));
    }
    if (!searchQuery.trim()) return result;
    const query = searchQuery.toLowerCase().trim();
    return result.filter(kit => {
      const desc = (kit['Kit (Description)'] || '').toLowerCase();
      const parts = (kit['Parts List'] || '').toLowerCase();
      return desc.includes(query) || parts.includes(query);
    });
  }, [kits, activeCategory, activePumpModel, searchQuery]);

  // Add standard kit (and its selected parts configuration) to estimate list
  const addKit = (kit) => {
    const kitDesc = kit['Kit (Description)'];
    const kitParts = getKitParts(kit);
    
    // Filter down to only checked parts
    const activeParts = kitParts.filter(
      part => isPartChecked(kitDesc, part)
    );

    const labor = parseNum(kit['Labor']);
    const partsCost = activeParts.reduce((acc, part) => acc + (part.retailPrice * part.quantity), 0);
    const taxCost = partsCost * 0.09;
    const totalPrice = labor + partsCost + taxCost;

    // Construct a descriptive name showing selected parts
    let description = kitDesc;
    if (activeParts.length > 0) {
      const partsSummary = activeParts.map(p => `${p.description} (x${p.quantity})`).join(', ');
      description = `${kitDesc} (incl: ${partsSummary})`;
    } else if (kitParts.length > 0) {
      description = `${kitDesc} (Labor only)`;
    }

    setSelectedItems(prev => {
      // Build a unique ID for this kit configuration based on which parts are selected
      const partsSignature = activeParts.map(p => p.partNumber).sort().join('-');
      const selectionId = `${kitDesc}-${partsSignature}`;

      const existing = prev.find(item => item.id === selectionId);
      if (existing) {
        return prev.map(item => 
          item.id === selectionId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, {
        id: selectionId,
        isCustom: false,
        description,
        totalPrice,
        quantity: 1
      }];
    });
  };

  // Add custom part/item to estimate list
  const addCustomItem = (e) => {
    e.preventDefault();
    if (!customDesc.trim()) return;

    const totalPrice = parseNum(customPrice);
    const qty = parseInt(customQty) || 1;

    setSelectedItems(prev => [
      ...prev,
      {
        id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        isCustom: true,
        description: customDesc.trim(),
        totalPrice,
        quantity: qty
      }
    ]);

    // Reset Custom Form
    setCustomDesc('');
    setCustomPrice('');
    setCustomQty(1);
    setShowCustomForm(false);
  };

  // Increase quantity of an item (standard or custom)
  const increaseItem = (itemId) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity of an item (standard or custom)
  const decreaseItem = (itemId) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.id !== itemId);
      }
      return prev.map(item => 
        item.id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  // Remove item completely
  const removeItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Estimate calculations
  const grandTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
  }, [selectedItems]);

  // Generate customer estimate copy-paste string
  const copyText = useMemo(() => {
    if (selectedItems.length === 0) return '';
    let text = `Hi! Here is your pool repair estimate from Cricket's Pool & Spa World\n\n`;
    text += `Proposed Repairs:\n`;
    
    selectedItems.forEach((item) => {
      const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : '';
      const itemPrice = item.totalPrice * item.quantity;
      text += `• ${item.description}${qtyStr}: $${itemPrice.toFixed(2)}\n`;
    });

    text += `\nTotal Estimated Price: $${grandTotal.toFixed(2)}\n\n`;
    text += `*Please note: All estimates are subject to a final visual inspection of the pool. \n\n`;
    text += `Let us know if you have any questions or if you'd like to get on the schedule!`;
    return text;
  }, [selectedItems, grandTotal]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-dark to-brand-slate text-white p-6 rounded-2xl border border-brand-slate shadow-premium relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="bg-brand-blue/20 p-2.5 rounded-xl text-brand-blueLight border border-brand-blueLight/10">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-outfit text-white">Repair Estimator</h2>
              <p className="text-xs text-slate-400 mt-1">Select repair kits, toggle dynamic add-ons, and calculate totals.</p>
            </div>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Database</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Browse, Search & Categories (col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search repair kits by description or parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-sm text-slate-800 transition duration-150"
              />
            </div>

            {/* Category Filter Pills */}
            {!loading && !error && categories.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const displayLabel = cat === 'FIlter Repairs' ? 'Filter Repairs' : cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setSearchQuery('');
                          if (cat !== 'Pump Repairs') {
                            setActivePumpModel('All');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-outfit border transition-all cursor-pointer ${
                          activeCategory === cat
                            ? 'bg-brand-blue border-brand-blue text-white shadow-sm'
                            : 'bg-slate-100 border-slate-200/50 text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pump Model Filter Pills */}
            {!loading && !error && activeCategory === 'Pump Repairs' && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Pump Model Compatibility</label>
                <div className="flex flex-wrap gap-2">
                  {pumpModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setActivePumpModel(model);
                        setSearchQuery('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-outfit border transition-all cursor-pointer ${
                        activePumpModel === model
                          ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                          : 'bg-slate-100 border-slate-200/50 text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loader or Error or List */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-premium border border-brand-border flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-3"></div>
              <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading repair database...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 text-sm p-4 rounded-xl border border-red-200 flex items-start space-x-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-bold block">Retrieval Error</span>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                <button
                  onClick={() => loadData(true)}
                  className="mt-2 text-xs font-bold underline hover:text-red-900 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry connection
                </button>
              </div>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-brand-border shadow-premium">
              <p className="text-slate-400 text-sm font-medium">No matching repair kits found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredKits.map((kit, index) => {
                const kitDesc = kit['Kit (Description)'];
                const kitParts = getKitParts(kit);
                const kitTotal = calculateKitPrice(kit);
                
                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-2xl border border-brand-border p-4.5 shadow-sm hover:shadow-premium hover:-translate-y-[1px] transition-all duration-300 flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                            {kit.Category === 'FIlter Repairs' ? 'Filter Repairs' : kit.Category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 font-outfit break-words mt-1">
                          {kitDesc}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Base Labor: ${parseNum(kit['Labor']).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100/80 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Total Price</span>
                          <span className="text-base font-extrabold text-brand-blue font-outfit block mt-0.5">
                            ${kitTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => addKit(kit)}
                          className="bg-brand-blue hover:bg-brand-blueDark text-white p-2.5 rounded-xl transition cursor-pointer shadow-sm hover:shadow flex items-center justify-center flex-shrink-0"
                          title="Add to Estimate"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Checkable Parts List from Parts Tab */}
                    {kitParts.length > 0 && (
                      <div className="space-y-2.5 border-t border-slate-100 pt-3.5 mt-1">
                        {/* Included Base Parts (checked by default) */}
                        {kitParts.some(p => !p.isAddon) && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                              Included Base Parts (checked by default):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {kitParts.filter(p => !p.isAddon).map((part) => {
                                const isChecked = isPartChecked(kitDesc, part);
                                const totalPartPrice = (part.retailPrice * part.quantity) * 1.09;
                                
                                return (
                                  <label 
                                    key={part.partNumber} 
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-brand-blue/5 border-brand-blue/20 text-slate-800' 
                                        : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePart(kitDesc, part)}
                                        className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue h-4 w-4 cursor-pointer"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate">{part.description}</span>
                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                          Part No: {part.partNumber} {part.quantity > 1 && `(x${part.quantity})`}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-extrabold ml-2 ${isChecked ? 'text-brand-blue' : 'text-slate-400'}`}>
                                      ${totalPartPrice > 0 ? totalPartPrice.toFixed(2) : '0.00'}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Optional Add-on Parts (unchecked by default) */}
                        {kitParts.some(p => p.isAddon) && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                              Optional Add-on Parts (unchecked by default):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {kitParts.filter(p => p.isAddon).map((part) => {
                                const isChecked = isPartChecked(kitDesc, part);
                                const totalPartPrice = (part.retailPrice * part.quantity) * 1.09;
                                
                                return (
                                  <label 
                                    key={part.partNumber} 
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-brand-teal/5 border-brand-teal/20 text-slate-800' 
                                        : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePart(kitDesc, part)}
                                        className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal h-4 w-4 cursor-pointer"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate">{part.description}</span>
                                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                          Part No: {part.partNumber} {part.quantity > 1 && `(x${part.quantity})`}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-extrabold ml-2 ${isChecked ? 'text-brand-teal font-bold' : 'text-slate-400'}`}>
                                      ${totalPartPrice > 0 ? totalPartPrice.toFixed(2) : '0.00'}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Estimate Cart & Custom items (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium space-y-5 flex flex-col">
            <div>
              <h3 className="font-outfit font-bold text-slate-800 text-base">Estimate Calculator</h3>
              <p className="text-xs text-slate-400 mt-1">Build an active customer repair quote.</p>
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center p-4">
                <span className="text-3xl mb-2">📋</span>
                <span className="text-xs text-slate-400 font-medium">Your estimate sheet is empty.</span>
                <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Add kits from the list or add custom parts below.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of selected items */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                  {selectedItems.map((item) => {
                    const itemTotal = item.totalPrice * item.quantity;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-brand-border text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            {item.isCustom && (
                              <span className="text-[8px] font-black px-1 py-0.5 bg-brand-teal/15 text-brand-teal rounded uppercase">
                                Custom
                              </span>
                            )}
                            <span className="font-bold text-slate-700 truncate block">{item.description}</span>
                          </div>
                          <span className="text-[10px] text-brand-blue font-bold block mt-0.5">
                            ${itemTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => decreaseItem(item.id)}
                            className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="w-5 text-center font-extrabold text-slate-700 text-xs">{item.quantity}</span>
                          
                          <button
                            onClick={() => increaseItem(item.id)}
                            className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-brand-danger p-1.5 rounded-lg transition cursor-pointer ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm font-extrabold text-slate-800 font-outfit">
                    <span>Total Estimated Price:</span>
                    <span className="text-brand-blue">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Copy Text Area */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Estimate Text</span>
                  </div>
                  <textarea
                    readOnly
                    value={copyText}
                    className="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono leading-relaxed text-slate-600 focus:outline-none resize-none"
                  />
                  
                  <button
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
                        <span>Copy Repair Estimate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Part Creator Form Toggle */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              {!showCustomForm ? (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-white"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-brand-blue" />
                  <span>Add Custom Part / Labor</span>
                </button>
              ) : (
                <form onSubmit={addCustomItem} className="bg-slate-50 p-4 rounded-xl border border-brand-border space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">New Custom Item</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2 in PVC Ball Valve"
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-brand-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blueDark text-white py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Add Custom Item
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
