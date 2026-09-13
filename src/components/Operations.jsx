import { useState } from 'react';
import { ShieldCheck, Calendar, Clock, Building2, Copy, Check, FileText, Sparkles } from 'lucide-react';

export default function Operations() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const disclosures = [
    { 
      category: "Account Onboarding",
      text: "A visual inspection is required for all new accounts; the $75 inspection fee is waived with a signed service agreement.", 
      highlight: "$75 inspection fee is waived",
      badge: "Fee Waiver"
    },
    { 
      category: "Equipment Standard",
      text: "The property pool must have an active, automatic chemical system and functioning timer system installed.", 
      highlight: "active, automatic chemical system",
      badge: "Requirement"
    },
    { 
      category: "Chemical Coverage",
      text: "All listed standard pricing includes normal maintenance chemicals only.", 
      highlight: "normal maintenance chemicals only",
      badge: "Maintenance"
    },
    { 
      category: "Liability Protocol",
      text: "Anything less than weekly routine service requires a signed liability waiver.", 
      highlight: "signed liability waiver",
      badge: "Compliance"
    },
    { 
      category: "Seasonal Schedule Shift",
      text: "Bi-weekly maintenance is strictly limited to November through February. Services automatically shift to weekly from March through October.", 
      highlight: "November through February",
      badge: "Schedule"
    },
  ];

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Modern Page Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-500 p-3 rounded-2xl text-white shadow-lg shadow-sky-600/30 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
                  Field Operations & Service Policies
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Official commercial rate baselines, seasonal frequency schedules, and compliance disclosures.
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Cricket's Pro Standards</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Commercial Rates & Schedule (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Commercial Rates Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-sky-700">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-slate-900 text-base leading-tight">Commercial Rates</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Business & HOA Accounts</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                Commercial Tier
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 p-5 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Baseline Visit Rate
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black font-outfit text-sky-600">$150.00</span>
                <span className="text-xs font-bold text-slate-500">/ per visit</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Minimum commercial fee plus chemicals for standard pool sizes. Rate scale increases dynamically based on total pool surface area and bather load requirements.
              </p>
            </div>

            <button
              onClick={() => handleCopy("Commercial pool service baseline starts at $150.00/visit plus chemicals for standard pools, scaled according to total surface area.", "commercial")}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-2xl text-xs font-bold font-outfit transition cursor-pointer"
            >
              {copiedIndex === 'commercial' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Rate Summary!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Commercial Rate Snippet</span>
                </>
              )}
            </button>
          </div>

          {/* Recommended Maintenance Schedule Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
            <div className="flex items-center space-x-2.5 text-sky-700">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-black text-slate-900 text-base leading-tight">Seasonal Service Schedule</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Frequency</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <span className="text-sm font-extrabold text-teal-950 font-outfit">March – October</span>
                  </div>
                  <span className="text-xs font-black bg-teal-600 text-white py-1 px-3 rounded-xl shadow-xs font-outfit">
                    2x Weekly
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 leading-snug">
                  Peak summer & warm season. Required twice-per-week chemical balancing, skimmer clearing, and sanitization.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-sky-700" />
                    <span className="text-sm font-extrabold text-sky-950 font-outfit">November – February</span>
                  </div>
                  <span className="text-xs font-black bg-sky-600 text-white py-1 px-3 rounded-xl shadow-xs font-outfit">
                    1x Weekly / Bi-Weekly
                  </span>
                </div>
                <p className="text-[11px] text-sky-800 leading-snug">
                  Winter maintenance schedule. Bi-weekly service is strictly limited to this window with signed agreements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Terms & Disclosures (col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-black text-slate-900 text-base leading-tight">
                  Terms, Disclosures & Standards
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Official Account Operating Guidelines
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-400 font-outfit">
              {disclosures.length} Core Policies
            </span>
          </div>

          <div className="space-y-3.5">
            {disclosures.map((d, index) => {
              const parts = d.text.split(new RegExp(`(${d.highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
              const isCopied = copiedIndex === index;

              return (
                <div 
                  key={index} 
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all duration-200 group relative space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                        {d.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-100/70 text-sky-700 font-outfit">
                        {d.badge}
                      </span>
                      <button
                        onClick={() => handleCopy(d.text, index)}
                        className="text-slate-400 hover:text-sky-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Copy policy text"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {parts.map((part, i) => 
                      part.toLowerCase() === d.highlight.toLowerCase() 
                        ? <strong key={i} className="text-slate-900 font-bold bg-sky-100/50 px-1 py-0.5 rounded">{part}</strong> 
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
