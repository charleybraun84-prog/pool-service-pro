import { useState, useEffect, useMemo } from 'react';
import { Wrench, Search, Plus, Minus, Trash2, Copy, Check, RefreshCw, AlertTriangle, Calculator, Sparkles, X, RotateCcw } from 'lucide-react';
import { fetchRepairKits, fetchRepairParts, fetchCategorySheet } from '../api';

export default function RepairEstimator() {
  const [kits, setKits] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Category states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePumpModel, setActivePumpModel] = useState('All');

  // STANDARD KITS Selection state: { [kitDescription]: { [partNumber]: true/false } }
  const [selectedPartsState, setSelectedPartsState] = useState({});

  // PUMP KITS Selection state
  const [selectedSealKits, setSelectedSealKits] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [motorChecked, setMotorChecked] = useState({});

  // Diagnostic Fee checkbox
  const [includeDiagnosticFee, setIncludeDiagnosticFee] = useState(false);

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

  // Estimate cart state
  const [selectedItems, setSelectedItems] = useState([]);
  const [copied, setCopied] = useState(false);
  const [wordingType, setWordingType] = useState('estimate'); // 'estimate' or 'tentative'

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
      const [masterKitsData, partsData] = await Promise.all([
        fetchRepairKits(),
        fetchRepairParts()
      ]);
      
      // Extract unique categories from master sheet
      const uniqueCategories = Array.from(new Set(masterKitsData.map(k => k.Category).filter(Boolean)));
      
      // Autonomously attempt to fetch dedicated sheets for all categories
      const categorySheetsResults = await Promise.all(
        uniqueCategories.map(cat => fetchCategorySheet(cat))
      );
      
      // Merge results, preferring dedicated sheets over master sheet
      let finalKits = [];
      uniqueCategories.forEach((cat, index) => {
        const dedicatedSheetData = categorySheetsResults[index];
        if (dedicatedSheetData !== null && dedicatedSheetData.length > 0) {
          finalKits = [...finalKits, ...dedicatedSheetData];
        } else {
          const fallbackData = masterKitsData.filter(k => k.Category === cat);
          finalKits = [...finalKits, ...fallbackData];
        }
      });
      
      // Include any kits without a category just in case
      const noCategoryKits = masterKitsData.filter(k => !k.Category);
      finalKits = [...noCategoryKits, ...finalKits];

      setKits(finalKits);
      setParts(partsData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Could not retrieve data from your spreadsheet. Please verify Google Apps Script deployment settings.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Find part helper
  const findPart = (partNumber) => {
    return parts.find(
      dbPart => String(dbPart['Part Number']).trim().toLowerCase() === String(partNumber).trim().toLowerCase()
    );
  };

  // --- PUMP KITS LOGIC ---

  const availableSealKits = useMemo(() => {
    return parts.filter(p => {
      if (p.Category !== 'Pump Parts') return false;
      const desc = (p.Description || '').toLowerCase();
      const num = (p['Part Number'] || '').toLowerCase();
      return desc.includes('seal') || desc.includes('go kit') || num.includes('go-kit') || num.includes('ps');
    });
  }, [parts]);

  // Derived or user-selected seal kit ID helper
  const getSelectedSealKitId = (kit) => {
    const kitDesc = kit['Kit (Description)'];
    if (selectedSealKits[kitDesc]) return selectedSealKits[kitDesc];
    const kitSealKitsStr = kit['Seal Kits'] || '';
    const kitTokens = kitSealKitsStr.split(',').map(p => p.trim()).filter(Boolean);
    if (kitTokens.length > 0) return kitTokens[0];
    if (availableSealKits.length > 0) return availableSealKits[0]['Part Number'];
    return '';
  };

  const togglePumpAddon = (kitDesc, addonKey) => {
    setSelectedAddons(prev => {
      const kitState = prev[kitDesc] || { impellers: false, sealPlate: false };
      return {
        ...prev,
        [kitDesc]: {
          ...kitState,
          [addonKey]: !kitState[addonKey]
        }
      };
    });
  };

  const toggleMotor = (kitDesc) => {
    setMotorChecked(prev => {
      const current = prev[kitDesc] !== undefined ? prev[kitDesc] : true;
      return { ...prev, [kitDesc]: !current };
    });
  };

  const getKitMotor = (kit) => {
    const motorToken = kit['Motor'];
    if (!motorToken) return null;
    const motorPart = findPart(motorToken);
    if (motorPart) return motorPart;
    return { 'Part Number': motorToken, 'Description': motorToken, 'Retail Price': 0 };
  };

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
    let partsCost;

    if (kit.Category === 'Pump Repairs') {
      const motor = getKitMotor(kit);
      const isMotorEnabled = motorChecked[kitDesc] !== false; // defaults to true
      const motorCost = (motor && isMotorEnabled) ? parseNum(motor['Retail Price']) : 0;
      
      const selectedSealKitId = getSelectedSealKitId(kit);
      const sealKit = findPart(selectedSealKitId);
      const sealKitCost = sealKit ? parseNum(sealKit['Retail Price']) : 0;
      
      const addonsState = selectedAddons[kitDesc] || { impellers: false, sealPlate: false };
      
      let addonsCost = 0;
      if (selectedSealKitId?.toUpperCase() === 'GO-KIT32-9') {
        if (addonsState.impellers && kit['WF Impellers']) {
          const impPart = findPart(kit['WF Impellers']);
          if (impPart) addonsCost += parseNum(impPart['Retail Price']);
        }
        if (addonsState.sealPlate && kit['WF Seal Plate']) {
          const spPart = findPart(kit['WF Seal Plate']);
          if (spPart) addonsCost += parseNum(spPart['Retail Price']);
        }
      }
      partsCost = motorCost + sealKitCost + addonsCost;
    } else {
      const kitParts = getKitParts(kit);
      const activeParts = kitParts.filter(part => isPartChecked(kitDesc, part));
      partsCost = activeParts.reduce((acc, part) => acc + (part.retailPrice * part.quantity), 0);
    }
    
    const taxCost = 0; // Tax is no longer included in estimate
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
    const labor = parseNum(kit['Labor']);
    let partsCost;
    let partsListForSignature = [];
    let partsSummary;

    if (kit.Category === 'Pump Repairs') {
      const motor = getKitMotor(kit);
      const isMotorEnabled = motorChecked[kitDesc] !== false;
      const selectedSealKitId = getSelectedSealKitId(kit);
      const sealKit = findPart(selectedSealKitId);
      const addonsState = selectedAddons[kitDesc] || { impellers: false, sealPlate: false };
      
      const activeParts = [];
      if (motor && isMotorEnabled) activeParts.push(motor);
      if (sealKit) activeParts.push(sealKit);
      
      if (selectedSealKitId?.toUpperCase() === 'GO-KIT32-9') {
        if (addonsState.impellers && kit['WF Impellers']) {
          const impPart = findPart(kit['WF Impellers']);
          if (impPart) activeParts.push(impPart);
        }
        if (addonsState.sealPlate && kit['WF Seal Plate']) {
          const spPart = findPart(kit['WF Seal Plate']);
          if (spPart) activeParts.push(spPart);
        }
      }

      partsCost = activeParts.reduce((acc, part) => acc + parseNum(part['Retail Price']), 0);
      partsListForSignature = activeParts.map(p => p['Part Number']);
      partsSummary = activeParts.map(p => p.Description || p['Part Number']).join(', ');
      
    } else {
      const kitParts = getKitParts(kit);
      const activeParts = kitParts.filter(part => isPartChecked(kitDesc, part));
      partsCost = activeParts.reduce((acc, part) => acc + (part.retailPrice * part.quantity), 0);
      partsListForSignature = activeParts.map(p => p.partNumber);
      partsSummary = activeParts.map(p => `${p.description} (x${p.quantity})`).join(', ');
    }

    const taxCost = 0; // Tax is no longer included in estimate
    const totalPrice = labor + partsCost + taxCost;

    let description = kitDesc;
    if (partsSummary) {
      description = `${kitDesc} (incl: ${partsSummary})`;
    } else if (kit.Category !== 'Pump Repairs' && getKitParts(kit).length > 0) {
      description = `${kitDesc} (Labor only)`;
    }

    setSelectedItems(prev => {
      // Build a unique ID for this kit configuration based on which parts are selected
      const partsSignature = partsListForSignature.sort().join('-');
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
    const itemsTotal = selectedItems.reduce((acc, item) => acc + (item.totalPrice * item.quantity), 0);
    if (itemsTotal === 0) return 0;
    return itemsTotal + (includeDiagnosticFee ? 75 : 0) + 5; // $5 fuel surcharge
  }, [selectedItems, includeDiagnosticFee]);

  // Generate customer estimate copy-paste string
  const copyText = useMemo(() => {
    if (selectedItems.length === 0) return '';
    const isTentative = wordingType === 'tentative';
    
    let text = isTentative
      ? `Hi! Here is your tentative pool repair quote from Cricket's Pool & Spa World\n\n`
      : `Hi! Here is your pool repair estimate from Cricket's Pool & Spa World\n\n`;
      
    text += `Proposed Repairs:\n`;
    
    selectedItems.forEach((item) => {
      const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : '';
      text += `• ${item.description}${qtyStr}\n`;
    });

    if (isTentative) {
      text += `\nTotal Tentative Quote: $${grandTotal.toFixed(2)}\n\n`;
      text += `*Please note: This is a tentative quote for a suspected equipment failure, subject to a final visual inspection and diagnostic verification. Tax is not included in this quote.\n\n`;
    } else {
      text += `\nTotal Estimated Price: $${grandTotal.toFixed(2)}\n\n`;
      text += `*Please note: All estimates are subject to a final visual inspection of the pool. Tax is not included in this estimate.\n\n`;
    }
    
    text += `Let us know if you have any questions or if you'd like to get on the schedule!`;
    return text;
  }, [selectedItems, grandTotal, wordingType]);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCartCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleClearCart = () => {
    setSelectedItems([]);
    setIncludeDiagnosticFee(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Modern Workstation Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-500 p-3 rounded-2xl text-white shadow-lg shadow-sky-600/30 flex-shrink-0">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
                  Repair Estimator & Quote Engine
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Interactive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Configure equipment repair kits, customize parts and labor, toggle diagnostic surcharges, and generate customer-ready estimates.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Catalog Kits</span>
              <span className="text-sm font-extrabold font-outfit text-white">{kits.length} available</span>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quote Total</span>
              <span className="text-sm font-extrabold font-outfit text-cyan-400">${grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold font-outfit transition cursor-pointer disabled:opacity-50 shadow-md shadow-sky-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Database</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Browse, Search & Kits List (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search repair kits by name, model, or part number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-2xl bg-slate-50/70 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm text-slate-800 transition duration-150"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {!loading && !error && categories.length > 1 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Category Filter
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {filteredKits.length} {filteredKits.length === 1 ? 'kit' : 'kits'} found
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const displayLabel = cat === 'FIlter Repairs' ? 'Filter Repairs' : cat;
                    const isActive = activeCategory === cat;
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                            : 'bg-slate-100/80 border-slate-200/60 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
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
                <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider block">
                  Pump Model Compatibility Filter
                </span>
                <div className="flex flex-wrap gap-2">
                  {pumpModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setActivePumpModel(model);
                        setSearchQuery('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit border transition-all cursor-pointer ${
                        activePumpModel === model
                          ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                          : 'bg-teal-50/60 border-teal-200/60 text-teal-800 hover:bg-teal-100/60'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loader or Error or Kits List */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <div className="relative mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-sky-600">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-800 text-sm font-bold font-outfit">Loading Repair Catalog & Inventory...</p>
              <p className="text-slate-400 text-xs mt-1">Fetching live parts from Google Sheets database</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 text-sm p-5 rounded-3xl border border-red-200 flex items-start space-x-3.5 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-bold block text-sm">Database Retrieval Error</span>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                <button
                  onClick={() => loadData(true)}
                  className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-outfit font-bold text-slate-800 text-base">No Matching Kits Found</h4>
              <p className="text-slate-400 text-xs mt-1">Try clearing your search query or selecting a different category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredKits.map((kit, index) => {
                const kitDesc = kit['Kit (Description)'];
                const kitParts = getKitParts(kit);
                const kitTotal = calculateKitPrice(kit);
                const categoryLabel = kit.Category === 'FIlter Repairs' ? 'Filter Repairs' : kit.Category;
                
                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg uppercase tracking-wider font-outfit border border-slate-200/60">
                            {categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg uppercase tracking-wider font-outfit border border-sky-100">
                            Labor: ${parseNum(kit['Labor']).toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 font-outfit break-words leading-snug">
                          {kitDesc}
                        </h4>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Kit Price</span>
                          <span className="text-lg font-black text-sky-600 font-outfit block">
                            ${kitTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => addKit(kit)}
                          className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-3.5 py-2.5 rounded-2xl transition cursor-pointer shadow-md shadow-sky-600/20 flex items-center space-x-1.5 flex-shrink-0 font-outfit text-xs font-bold"
                          title="Add to Estimate"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add to Quote</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Parts Selection Section */}
                    {kit.Category === 'Pump Repairs' ? (
                      <div className="space-y-3 border-t border-slate-100 pt-3.5 mt-1">
                        {/* 1. Included Motor */}
                        {getKitMotor(kit) && (() => {
                          const motor = getKitMotor(kit);
                          const motorPrice = parseNum(motor['Retail Price']) * 1.09;
                          const isMotorEnabled = motorChecked[kitDesc] !== false;
                          
                          return (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                Motor Option:
                              </span>
                              <label 
                                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                                  isMotorEnabled 
                                    ? 'bg-sky-50/70 border-sky-200 text-slate-900 shadow-sm' 
                                    : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isMotorEnabled}
                                    onChange={() => toggleMotor(kitDesc)}
                                    className="rounded-lg border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4 cursor-pointer"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-bold text-slate-800">{motor.Description || motor['Part Number']}</span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                      Part No: {motor['Part Number']}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-xs font-black font-outfit ml-2 ${isMotorEnabled ? 'text-sky-600' : 'text-slate-400'}`}>
                                  ${motorPrice > 0 ? motorPrice.toFixed(2) : '0.00'}
                                </span>
                              </label>
                            </div>
                          );
                        })()}

                        {/* 2. Select Seal Kit Dropdown */}
                        {kit['Seal Kits'] && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                              Select Seal Kit:
                            </span>
                            <select
                              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs text-slate-800 transition duration-150 cursor-pointer font-semibold"
                              value={selectedSealKits[kitDesc] || ''}
                              onChange={(e) => setSelectedSealKits(prev => ({ ...prev, [kitDesc]: e.target.value }))}
                            >
                              <option value="" disabled>Select a Seal Kit</option>
                              {kit['Seal Kits'].split(',').map(token => token.trim()).filter(Boolean).map(skToken => {
                                const sk = findPart(skToken) || { 'Part Number': skToken, Description: skToken, 'Retail Price': 0 };
                                const skPrice = parseNum(sk['Retail Price']) * 1.09;
                                return (
                                  <option key={sk['Part Number']} value={sk['Part Number']}>
                                    {sk.Description} ({sk['Part Number']}) - ${skPrice.toFixed(2)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {/* 3. Optional Add-ons for GO-KIT32-9 */}
                        {selectedSealKits[kitDesc]?.toUpperCase() === 'GO-KIT32-9' && (() => {
                          const addonsState = selectedAddons[kitDesc] || { impellers: false, sealPlate: false };
                          return (
                            <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                              <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest block">
                                Optional Add-ons for {selectedSealKits[kitDesc]}:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {kit['WF Impellers'] && (() => {
                                  const impPart = findPart(kit['WF Impellers']);
                                  const isChecked = addonsState.impellers;
                                  const price = (parseNum(impPart ? impPart['Retail Price'] : 0) * 1.09);
                                  return (
                                    <label className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-teal-50/70 border-teal-200 text-slate-900 shadow-sm' 
                                        : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                    }`}>
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <input type="checkbox" checked={isChecked} onChange={() => togglePumpAddon(kitDesc, 'impellers')} className="rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer" />
                                        <div className="flex flex-col min-w-0">
                                          <span className="truncate font-bold text-slate-800">WF Impellers</span>
                                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">Part No: {kit['WF Impellers']}</span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-black font-outfit ml-2 ${isChecked ? 'text-teal-700' : 'text-slate-400'}`}>
                                        ${price.toFixed(2)}
                                      </span>
                                    </label>
                                  );
                                })()}
                                
                                {kit['WF Seal Plate'] && (() => {
                                  const spPart = findPart(kit['WF Seal Plate']);
                                  const isChecked = addonsState.sealPlate;
                                  const price = (parseNum(spPart ? spPart['Retail Price'] : 0) * 1.09);
                                  return (
                                    <label className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                                      isChecked 
                                        ? 'bg-teal-50/70 border-teal-200 text-slate-900 shadow-sm' 
                                        : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                    }`}>
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <input type="checkbox" checked={isChecked} onChange={() => togglePumpAddon(kitDesc, 'sealPlate')} className="rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer" />
                                        <div className="flex flex-col min-w-0">
                                          <span className="truncate font-bold text-slate-800">WF Seal Plate</span>
                                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">Part No: {kit['WF Seal Plate']}</span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-black font-outfit ml-2 ${isChecked ? 'text-teal-700' : 'text-slate-400'}`}>
                                        ${price.toFixed(2)}
                                      </span>
                                    </label>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      kitParts.length > 0 && (
                        <div className="space-y-3 border-t border-slate-100 pt-3.5 mt-1">
                          {/* Included Base Parts (checked by default) */}
                          {kitParts.some(p => !p.isAddon) && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                                Included Base Parts:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {kitParts.filter(p => !p.isAddon).map((part) => {
                                  const isChecked = isPartChecked(kitDesc, part);
                                  const totalPartPrice = (part.retailPrice * part.quantity) * 1.09;
                                  
                                  return (
                                    <label 
                                      key={part.partNumber} 
                                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                                        isChecked 
                                          ? 'bg-sky-50/70 border-sky-200 text-slate-900 shadow-sm' 
                                          : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePart(kitDesc, part)}
                                          className="rounded-lg border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4 cursor-pointer"
                                        />
                                        <div className="flex flex-col min-w-0">
                                          <span className="truncate font-bold text-slate-800">{part.description}</span>
                                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                            Part No: {part.partNumber} {part.quantity > 1 && `(x${part.quantity})`}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-black font-outfit ml-2 ${isChecked ? 'text-sky-600' : 'text-slate-400'}`}>
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
                              <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest block">
                                Optional Add-on Parts:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {kitParts.filter(p => p.isAddon).map((part) => {
                                  const isChecked = isPartChecked(kitDesc, part);
                                  const totalPartPrice = (part.retailPrice * part.quantity) * 1.09;
                                  
                                  return (
                                    <label 
                                      key={part.partNumber} 
                                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                                        isChecked 
                                          ? 'bg-teal-50/70 border-teal-200 text-slate-900 shadow-sm' 
                                          : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePart(kitDesc, part)}
                                          className="rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                                        />
                                        <div className="flex flex-col min-w-0">
                                          <span className="truncate font-bold text-slate-800">{part.description}</span>
                                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                            Part No: {part.partNumber} {part.quantity > 1 && `(x${part.quantity})`}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-black font-outfit ml-2 ${isChecked ? 'text-teal-700' : 'text-slate-400'}`}>
                                        ${totalPartPrice > 0 ? totalPartPrice.toFixed(2) : '0.00'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Sticky Estimate Calculator & Quote Builder (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg space-y-5 lg:sticky lg:top-20">
            {/* Header with Counter and Clear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-slate-900 text-base leading-tight">
                    Customer Quote Sheet
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {totalCartCount} {totalCartCount === 1 ? 'item selected' : 'items selected'}
                  </p>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                  title="Clear estimate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-sm font-extrabold font-outfit text-slate-800">Your Estimate is Empty</span>
                <span className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                  Click "+ Add to Quote" on any kit or add custom parts below.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* List of selected items */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                  {selectedItems.map((item) => {
                    const itemTotal = item.totalPrice * item.quantity;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center gap-1.5">
                            {item.isCustom && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded-md uppercase tracking-wider">
                                Custom
                              </span>
                            )}
                            <span className="font-bold text-slate-800 truncate block">{item.description}</span>
                          </div>
                          <span className="text-xs text-sky-600 font-extrabold font-outfit block mt-0.5">
                            ${itemTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => decreaseItem(item.id)}
                            className="bg-white hover:bg-slate-100 text-slate-600 p-1.5 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="w-5 text-center font-black text-slate-800 text-xs font-outfit">{item.quantity}</span>
                          
                          <button
                            onClick={() => increaseItem(item.id)}
                            className="bg-white hover:bg-slate-100 text-slate-600 p-1.5 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-xl transition cursor-pointer ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Surcharges & Diagnostic Fee Toggle */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <label 
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                      includeDiagnosticFee 
                        ? 'bg-sky-50 border-sky-200 text-slate-900 shadow-sm' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={includeDiagnosticFee}
                        onChange={(e) => setIncludeDiagnosticFee(e.target.checked)}
                        className="rounded-lg border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="font-bold text-slate-800">Include Diagnostic Fee</span>
                    </div>
                    <span className={`text-xs font-black font-outfit ml-2 ${includeDiagnosticFee ? 'text-sky-600' : 'text-slate-400'}`}>
                      +$75.00
                    </span>
                  </label>

                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-500">
                    <span className="font-medium">Standard Fuel & Travel Surcharge</span>
                    <span className="font-bold text-slate-700 font-outfit">+$5.00</span>
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="border-t border-slate-100 pt-3.5 bg-gradient-to-br from-slate-50 to-sky-50/30 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex justify-between items-baseline text-slate-900">
                    <span className="text-xs font-bold font-outfit uppercase tracking-wider text-slate-500">
                      Total Estimated Price
                    </span>
                    <span className="text-2xl font-black font-outfit text-sky-600">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Excludes sales tax. Subject to physical inspection on site.
                  </p>
                </div>

                {/* Estimate Wording Dropdown */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Quote Terminology
                  </label>
                  <select
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs text-slate-800 transition duration-150 cursor-pointer font-bold font-outfit"
                    value={wordingType}
                    onChange={(e) => setWordingType(e.target.value)}
                  >
                    <option value="estimate">Standard Repair Estimate</option>
                    <option value="tentative">Tentative Quote (Suspected Equipment Failure)</option>
                  </select>
                </div>

                {/* Copy Text Area */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Customer Text / SMS Preview
                  </span>
                  <textarea
                    readOnly
                    value={copyText}
                    className="w-full h-32 bg-slate-50/90 border border-slate-200 rounded-2xl p-3 text-[11px] font-mono leading-relaxed text-slate-600 focus:outline-none resize-none"
                  />
                  
                  <button
                    onClick={handleCopy}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-black font-outfit transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      copied
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Quote for Customer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Part Creator Form Toggle */}
            <div className="border-t border-slate-100 pt-4">
              {!showCustomForm ? (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-2xl text-xs font-bold font-outfit text-slate-500 hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs bg-white"
                >
                  <Plus className="w-4 h-4 text-slate-400 hover:text-sky-600" />
                  <span>Add Custom Part / Labor Item</span>
                </button>
              ) : (
                <form onSubmit={addCustomItem} className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider font-outfit">New Custom Line Item</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2 in Schedule 40 PVC Ball Valve"
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 font-medium"
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={customQty}
                        onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-xl text-xs font-bold font-outfit transition shadow-sm cursor-pointer"
                  >
                    Add Item to Quote
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
