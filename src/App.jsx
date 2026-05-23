import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Estimator from './components/Estimator';
import RepairEstimator from './components/RepairEstimator';
import Operations from './components/Operations';
import NewAssessment from './components/NewAssessment';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-brand-light flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Side / Bottom Navigation */}
      <Navigation activeView={activeView} setActiveView={setActiveView} />

      {/* Main View Container */}
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-brand-border px-6 py-4.5 z-20 flex justify-between items-center shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-xl border border-brand-border flex items-center justify-center w-11 h-11 flex-shrink-0 shadow-sm md:hidden">
              <img 
                src="https://res.cloudinary.com/drvl3r9me/image/upload/f_auto,q_auto/CRICKET-POOL-LOGO-fun-2_ifxtqw" 
                alt="Cricket's Pool & Spa World" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-outfit text-slate-800 tracking-tight leading-tight capitalize">
                {activeView === 'new-assessment' ? 'New Assessment' : 
                 activeView === 'estimator' ? 'Maintenance Estimator' : 
                 activeView === 'repair-estimator' ? 'Repair Estimator' : 
                 activeView}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Cricket's Pool & Spa World
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2.5 py-1.5 bg-brand-blue/10 text-brand-blue rounded-lg border border-brand-blue/15">
              Technician Portal
            </span>
          </div>
        </header>

        {/* Content View */}
        <main className="p-4 md:p-6 max-w-5xl mx-auto">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'estimator' && <Estimator />}
          {activeView === 'repair-estimator' && <RepairEstimator />}
          {activeView === 'operations' && <Operations />}
          {activeView === 'new-assessment' && <NewAssessment />}
        </main>
      </div>

      {/* PWA Install Sheet */}
      <InstallPrompt />
    </div>
  );
}
