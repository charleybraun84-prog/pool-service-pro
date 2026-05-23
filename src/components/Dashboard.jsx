import { useState, useEffect } from 'react';
import DataList from './DataList';
import MapView from './MapView';
import { fetchSheetData, SHEET_TABS } from '../api';
import { Search, Map, List, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  // Tabs: Service Assessments (index 1), Route Assessments (index 0)
  const dashboardTabs = [SHEET_TABS[1], SHEET_TABS[0]];
  const [activeTab, setActiveTab] = useState(dashboardTabs[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const [sheetsData, setSheetsData] = useState({});
  const [loading, setLoading] = useState(true);

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
        }
      } catch (error) {
        console.error("Error polling sheet data:", error);
        if (isMounted) setLoading(false);
      }
    }
    
    // Initial fetch for the active tab (only show loading spinner if no cached data)
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
  };

  const currentData = sheetsData[activeTab] || [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Control bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-brand-border shadow-premium space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          {/* Sub Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200/40">
            {dashboardTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery('');
                }}
                className={`px-4.5 py-2 text-xs font-extrabold rounded-lg font-outfit transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white shadow-sm text-brand-blue border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl border border-brand-border hover:bg-brand-light text-slate-500 hover:text-brand-blue disabled:opacity-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* List / Map view toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200/40">
              <button
                onClick={() => setIsMapView(false)}
                className={`p-2 rounded-lg transition-all ${
                  !isMapView
                    ? 'bg-white shadow-sm text-brand-blue'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
                title="List View"
              >
                <List className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setIsMapView(true)}
                className={`p-2 rounded-lg transition-all ${
                  isMapView
                    ? 'bg-white shadow-sm text-brand-blue'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
                title="Map View"
              >
                <Map className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-sm text-slate-800 transition duration-150"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-premium border border-brand-border flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mb-3"></div>
            <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading {activeTab} data...</p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {isMapView ? (
              <MapView data={currentData} />
            ) : (
              <DataList data={currentData} searchQuery={searchQuery} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
