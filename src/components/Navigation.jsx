import { ClipboardList, Calculator, FileText, Wrench } from 'lucide-react';

export default function Navigation({ activeView, setActiveView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
    { id: 'estimator', label: 'Maintenance Estimator', icon: Calculator },
    { id: 'repair-estimator', label: 'Repair Estimator', icon: Wrench },
    { id: 'operations', label: 'Operations', icon: FileText },
  ];

  return (
    <>
      {/* Sidebar for Desktop / Tablet */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark text-white fixed h-full left-0 top-0 border-r border-brand-slate z-30 shadow-premium">
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-brand-slate bg-brand-darker">
          <div className="bg-white p-1 rounded-xl flex items-center justify-center w-12 h-12 flex-shrink-0 shadow-sm">
            <img 
              src="https://res.cloudinary.com/drvl3r9me/image/upload/f_auto,q_auto/CRICKET-POOL-LOGO-fun-2_ifxtqw" 
              alt="Cricket's Pool & Spa World" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-outfit font-extrabold text-base tracking-tight text-white leading-tight">Cricket's Pool & Spa World</h1>
            <p className="text-[9px] text-brand-blueLight font-semibold uppercase tracking-wider mt-0.5">Technician Portal</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-blue to-brand-blueDark text-white shadow-glow border border-brand-blueLight/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-brand-slate bg-brand-darker/60 text-center">
          <p className="text-[10px] text-slate-500">Version 1.0.0 (PWA)</p>
        </div>
      </aside>

      {/* Bottom Nav Bar for Mobile Devices */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-brand-border flex justify-around py-2 px-1 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 relative ${
                isActive ? 'text-brand-blue' : 'text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold mt-1 font-sans">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 bg-brand-blue rounded-full transform translate-y-1"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
