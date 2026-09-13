import { ClipboardList, Calculator, Wrench, FileText, Sparkles } from 'lucide-react';

export default function Navigation({ activeView, setActiveView }) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Field Dashboard', 
      shortLabel: 'Dashboard',
      icon: ClipboardList,
      description: 'Route & service assessments'
    },
    { 
      id: 'estimator', 
      label: 'Maintenance Estimator', 
      shortLabel: 'Maintenance',
      icon: Calculator,
      description: 'Care tiers & zone pricing'
    },
    { 
      id: 'repair-estimator', 
      label: 'Repair Estimator', 
      shortLabel: 'Repairs',
      icon: Wrench,
      description: 'Dynamic kits & custom quotes'
    },
    { 
      id: 'operations', 
      label: 'Operations & Policies', 
      shortLabel: 'Operations',
      icon: FileText,
      description: 'Rates & service guidelines'
    },
  ];

  return (
    <>
      {/* Sidebar for Desktop / Tablet */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-[#080c18] via-[#0d1527] to-[#080c18] text-white fixed h-full left-0 top-0 border-r border-slate-800/80 z-30 shadow-2xl">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-800/80 bg-[#080c18]/60 backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl blur-sm opacity-40 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-white p-1.5 rounded-xl flex items-center justify-center w-12 h-12 flex-shrink-0 shadow-md">
                <img 
                  src="https://res.cloudinary.com/drvl3r9me/image/upload/f_auto,q_auto/CRICKET-POOL-LOGO-fun-2_ifxtqw" 
                  alt="Cricket's Pool & Spa World" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-outfit font-extrabold text-base tracking-tight text-white leading-tight truncate">
                Cricket's Pool & Spa
              </h1>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <p className="text-[10px] text-cyan-400/90 font-bold uppercase tracking-widest font-outfit">
                  Field Pro Portal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 px-3.5 py-6 space-y-2 overflow-y-auto no-scrollbar">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
              Main Menu
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-lg shadow-sky-600/25 border border-white/15'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-white/15 text-white' 
                      : 'bg-slate-800/70 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold font-outfit tracking-tight block truncate">
                      {item.label}
                    </span>
                    <span className={`text-[11px] block truncate transition-colors ${
                      isActive ? 'text-white/80' : 'text-slate-400/80 group-hover:text-slate-300'
                    }`}>
                      {item.description}
                    </span>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-5 bg-white rounded-full shadow-sm"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Info Box in Sidebar */}
          <div className="pt-6 px-1">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 to-slate-800/40 border border-slate-700/50 backdrop-blur-sm shadow-inner relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-sky-500/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center space-x-2 text-cyan-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold font-outfit">Pro Tech Tip</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Estimates copy directly to your clipboard formatted for SMS or client email.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#080c18]/80 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-slate-300">Live Database Connected</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">v2.0</span>
          </div>
        </div>
      </aside>

      {/* Floating Modern Bottom Nav Bar for Mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around p-1.5 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 relative ${
                isActive 
                  ? 'bg-gradient-to-b from-sky-500/20 to-cyan-500/10 text-sky-400 border border-sky-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-sky-400' : ''}`} />
              <span className={`text-[10px] mt-1 font-outfit truncate max-w-[80px] ${
                isActive ? 'font-bold text-sky-300' : 'font-medium'
              }`}>
                {item.shortLabel}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-cyan-400 rounded-full mt-0.5 shadow-[0_0_6px_#38bdf8]"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
