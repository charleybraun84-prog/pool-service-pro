import { useState, useEffect, useMemo } from 'react';
import DataList from './DataList';
import MapView from './MapView';
import { fetchSheetData, SHEET_TABS } from '../api';
import { Search, Map, List, RefreshCw, X, Activity, Droplets, Gauge, Sparkles } from 'lucide-react';

export default function Dashboard() {
  // Tabs: Service Assessments (index 1), Route Assessments (index 0)
  const dashboardTabs = [
    { name: SHEET_TABS[1], label: 'Service Assessments', icon: Activity },
    { name: SHEET_TABS[0], label: 'Route Assessments', icon: Map }
  ];
  
  const [activeTab, setActiveTab] = useState(dashboardTabs[0].name);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterChip, setActiveFilterChip] = useState('ALL'); // 'ALL', 'PHOTOS', 'SALT', 'BOOSTER'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'name-asc'
  const [isMapView, setIsMapView] = useState(false);
  const [sheetsData, setSheetsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch sheet data for active tab and setup background polling
  useEffect(() => {
    let isMounted = true;

    async function loadData(showLoading = true) {
      if (showLoading) setLoading(true);
      
      try {
        const data = await fetchSheetData(activeTab);
        if (isMounted) {
          setSheetsData(prev => ({ ...prev, [activeTab]: data }));
          setLoading(false);
          setLastRefreshed(new Date());
        }
      } catch (error) {
        console.error("Error polling sheet data:", error);
        if (isMounted) setLoading(false);
      }
    }
    
    // Initial fetch for the active tab
    loadData(!sheetsData[activeTab]);

    // Setup polling every 3 minutes
    const intervalId = setInterval(() => {
      loadData(false);
    }, 3 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchSheetData(activeTab);
    setSheetsData(prev => ({ ...prev, [activeTab]: data }));
    setLoading(false);
    setLastRefreshed(new Date());
  };

  const currentData = useMemo(() => sheetsData[activeTab] || [], [sheetsData, activeTab]);

  // Compute KPI statistics for current dataset
  const stats = useMemo(() => {
    const total = currentData.length;
    let withPhotos = 0;
    let saltSystems = 0;
    let boosterPumps = 0;

    currentData.forEach(row => {
      const hasPhoto = Object.entries(row).some(([k, v]) => 
        (k.toLowerCase().includes('photo') || k.toLowerCase().includes('image')) && Boolean(v)
      );
      if (hasPhoto) withPhotos++;

      const sanitizer = String(row['Sanitizer'] || '').toLowerCase();
      if (sanitizer.includes('salt') || sanitizer.includes('generator')) saltSystems++;

      const booster = String(row['Booster Pump'] || '').toLowerCase();
      if (booster && booster !== 'no' && booster !== 'none' && booster !== 'n/a') boosterPumps++;
    });

    return { total, withPhotos, saltSystems, boosterPumps };
  }, [currentData]);

  // Filter and Sort current data
  const processedData = useMemo(() => {
    let result = [...currentData];

    // Quick filter chips
    if (activeFilterChip === 'PHOTOS') {
      result = result.filter(row => 
        Object.entries(row).some(([k, v]) => 
          (k.toLowerCase().includes('photo') || k.toLowerCase().includes('image')) && Boolean(v)
        )
      );
    } else if (activeFilterChip === 'SALT') {
      result = result.filter(row => {
        const san = String(row['Sanitizer'] || '').toLowerCase();
        return san.includes('salt') || san.includes('generator');
      });
    } else if (activeFilterChip === 'BOOSTER') {
      result = result.filter(row => {
        const booster = String(row['Booster Pump'] || '').toLowerCase();
        return booster && booster !== 'no' && booster !== 'none' && booster !== 'n/a';
      });
    }

    // Global text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(row => 
        Object.values(row).some(val => 
          val && typeof val === 'string' && val.toLowerCase().includes(q)
        )
      );
    }

    // Sorting
    if (sortOrder === 'name-asc') {
      result.sort((a, b) => {
        const nameA = (a['Customer name'] || a['Customer Name'] || '').toLowerCase();
        const nameB = (b['Customer name'] || b['Customer Name'] || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Default: Newest first
      const parseDate = (dStr) => {
        if (!dStr) return 0;
        const clean = dStr.replace(/\s+/g, ' ').replace(/(AM|PM)/i, ' $1');
        const t = new Date(clean).getTime();
        return isNaN(t) ? 0 : t;
      };
      result.sort((a, b) => parseDate(b['Submission time']) - parseDate(a['Submission time']));
    }

    return result;
  }, [currentData, activeFilterChip, searchQuery, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Top Operations KPI Stat Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
            <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black font-outfit text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-medium">in current tab</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">With Photos</span>
            <div className="p-2 bg-teal-500/10 text-teal-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black font-outfit text-teal-600">{stats.withPhotos}</span>
            <span className="text-[11px] text-slate-400 font-medium">media verified</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salt Systems</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-600 rounded-xl">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black font-outfit text-cyan-600">{stats.saltSystems}</span>
            <span className="text-[11px] text-slate-400 font-medium">active generators</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Booster Pumps</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black font-outfit text-indigo-600">{stats.boosterPumps}</span>
            <span className="text-[11px] text-slate-400 font-medium">installed units</span>
          </div>
        </div>
      </div>

      {/* Main Control Center Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Segmented Sub-Tab Switcher */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex space-x-1.5 border border-slate-200/60">
            {dashboardTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => {
                    setActiveTab(tab.name);
                    setSearchQuery('');
                    setActiveFilterChip('ALL');
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-black rounded-xl font-outfit transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-sm text-sky-700 border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2.5 self-end md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-600 disabled:opacity-50 transition-all text-xs font-semibold cursor-pointer shadow-sm"
              title="Refresh spreadsheet data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
              <span className="hidden sm:inline">Sync ({lastRefreshed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})</span>
            </button>

            {/* List / Map view toggle */}
            <div className="bg-slate-100/90 p-1 rounded-xl flex space-x-1 border border-slate-200/60">
              <button
                onClick={() => setIsMapView(false)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit transition-all cursor-pointer ${
                  !isMapView
                    ? 'bg-white shadow-sm text-sky-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setIsMapView(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit transition-all cursor-pointer ${
                  isMapView
                    ? 'bg-white shadow-sm text-sky-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Map View"
              >
                <Map className="w-4 h-4" />
                <span>Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Bar and Quick Filters */}
        <div className="space-y-3 pt-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Search customers, addresses, or equipment in ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-200 rounded-xl bg-slate-50/70 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm text-slate-800 transition duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips & Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Filters:
              </span>
              {[
                { id: 'ALL', label: 'All Records' },
                { id: 'PHOTOS', label: '📷 Has Photos' },
                { id: 'SALT', label: '🌊 Salt System' },
                { id: 'BOOSTER', label: '⚡ Booster Pump' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilterChip(chip.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeFilterChip === chip.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Results count & Sort */}
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {processedData.length} {processedData.length === 1 ? 'account' : 'accounts'}
              </span>
              <span className="text-slate-300">•</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="name-asc">Customer (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <div className="relative mb-3">
              <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-600 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-sky-600">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-800 text-sm font-bold font-outfit">Loading Field Assessment Records...</p>
            <p className="text-slate-400 text-xs mt-1">Connecting to live Google Apps database</p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {isMapView ? (
              <MapView data={processedData} />
            ) : (
              <DataList data={processedData} searchQuery={searchQuery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
