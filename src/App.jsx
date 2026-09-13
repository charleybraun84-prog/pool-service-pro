import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Estimator from './components/Estimator';
import RepairEstimator from './components/RepairEstimator';
import Operations from './components/Operations';
import InstallPrompt from './components/InstallPrompt';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Field Dashboard';
      case 'estimator':
        return 'Maintenance Estimator';
      case 'repair-estimator':
        return 'Repair Estimator';
      case 'operations':
        return 'Operations & Service Policies';
      default:
        return 'Field Portal';
    }
  };

  const getSubtitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Customer assessments, equipment specs & route mapping';
      case 'estimator':
        return 'Routine pool care tiers, chemical checks & radial zone pricing';
      case 'repair-estimator':
        return 'Dynamic equipment kits & professional customer quotes';
      case 'operations':
        return 'Commercial guidelines, pricing tiers & service terms';
      default:
        return "Cricket's Pool & Spa World";
    }
  };

  const todayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-mesh-pattern flex flex-col md:flex-row pb-24 md:pb-8 selection:bg-sky-500 selection:text-white">
      {/* Side / Bottom Navigation */}
      <Navigation activeView={activeView} setActiveView={setActiveView} />

      {/* Main View Container */}
      <div className="flex-1 md:ml-72 transition-all duration-300 min-w-0">
        {/* Sticky Translucent Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3.5 z-20 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] transition-all">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-3.5 min-w-0">
              {/* Mobile Brand Logo */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 rounded-xl border border-slate-700/60 flex items-center justify-center w-11 h-11 flex-shrink-0 shadow-sm md:hidden">
                <img
                  src="https://res.cloudinary.com/drvl3r9me/image/upload/f_auto,q_auto/CRICKET-POOL-LOGO-fun-2_ifxtqw"
                  alt="Cricket's Pool & Spa World"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Breadcrumb Title */}
              <div className="min-w-0">
                <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  <span className="hover:text-sky-600 transition-colors">Portal</span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-sky-600">{getTitle()}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black font-outfit text-slate-900 tracking-tight leading-tight truncate">
                  {getTitle()}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                  {getSubtitle()}
                </p>
              </div>
            </div>

            {/* Right Header Status Bar */}
            <div className="flex items-center space-x-2.5 flex-shrink-0">
              {/* Date Badge */}
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/70 text-slate-600 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>{todayDate}</span>
              </div>

              {/* Field Pro Badge */}
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-blue-500/10 text-sky-700 rounded-xl border border-sky-500/20 font-outfit text-xs font-extrabold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden xs:inline">Field Pro</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'estimator' && <Estimator />}
          {activeView === 'repair-estimator' && <RepairEstimator />}
          {activeView === 'operations' && <Operations />}
        </main>
      </div>

      {/* PWA Install Sheet */}
      <InstallPrompt />
    </div>
  );
}
