import { ShieldCheck, Calendar, Info, DollarSign, Clock } from 'lucide-react';

export default function Operations() {
  const disclosures = [
    { text: "A visual inspection is required for all new accounts; the $75 inspection fee is waived with a signed service agreement.", highlight: "$75 inspection fee is waived" },
    { text: "The property pool must have an active, automatic chemical system and functioning timer system installed.", highlight: "active, automatic chemical system" },
    { text: "All listed standard pricing includes normal maintenance chemicals only.", highlight: "normal maintenance chemicals only" },
    { text: "Anything less than weekly routine service requires a signed liability waiver.", highlight: "signed liability waiver" },
    { text: "Bi-weekly maintenance is strictly limited to November through February. Services automatically shift to weekly from March through October.", highlight: "November through February" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-brand-dark to-brand-slate text-white p-6 rounded-2xl border border-brand-slate shadow-premium relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="bg-brand-blue/20 p-2.5 rounded-xl text-brand-blueLight border border-brand-blueLight/10">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-outfit text-white">Operations & Service Policies</h2>
            <p className="text-xs text-slate-400 mt-1">Official guidelines, commercial rates, and policy disclosures for technicians.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Commercial Operations Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center space-x-2.5 mb-4 text-brand-teal">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-outfit font-bold text-slate-900">Commercial Rates</h3>
            </div>
            
            <div className="bg-brand-light p-4 rounded-xl border border-brand-border flex items-start space-x-3">
              <span className="text-xl mt-0.5">🏢</span>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Baseline Estimate</h4>
                <div className="text-2xl font-black font-outfit text-brand-blue mt-1">
                  $150.00<span className="text-sm font-medium text-slate-500"> / visit</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Minimum rate plus chemicals for standard pools. Price scale increases dynamically depending on total pool surface area.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-premium hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center space-x-2.5 mb-4 text-brand-blue">
              <Calendar className="w-5 h-5" />
              <h3 className="font-outfit font-bold text-slate-900">Recommended Schedule</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-100/50">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-brand-teal" />
                  <span className="text-sm font-semibold text-slate-800">March - October</span>
                </div>
                <span className="text-xs font-bold bg-brand-teal text-white py-1 px-2.5 rounded-full">2x Per Week</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100/50">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  <span className="text-sm font-semibold text-slate-800">November - February</span>
                </div>
                <span className="text-xs font-bold bg-brand-blue text-white py-1 px-2.5 rounded-full">1x Per Week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Disclosures Section */}
        <div className="md:col-span-3 bg-white p-5.5 rounded-2xl border border-brand-border shadow-premium hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center space-x-2.5 mb-4.5 text-brand-blue">
            <ShieldCheck className="w-5.5 h-5.5" />
            <h3 className="font-outfit font-bold text-slate-900">Terms & Disclosures</h3>
          </div>

          <div className="space-y-4">
            {disclosures.map((d, index) => {
              // Highlight parts of the text
              const parts = d.text.split(new RegExp(`(${d.highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
              return (
                <div key={index} className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-brand-light/60 transition-colors border border-transparent hover:border-brand-border/40">
                  <div className="bg-brand-blue/10 p-1 rounded-lg text-brand-blue mt-0.5 flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {parts.map((part, i) => 
                      part.toLowerCase() === d.highlight.toLowerCase() 
                        ? <strong key={i} className="text-slate-900 font-semibold">{part}</strong> 
                        : part
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
