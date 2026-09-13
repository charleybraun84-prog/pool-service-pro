import { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Camera, 
  Link as LinkIcon, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Droplets, 
  Gauge, 
  Activity, 
  Layers, 
  X,
  Maximize2
} from 'lucide-react';

export default function DataList({ data, searchQuery }) {
  const [copiedId, setCopiedId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.replace(/\s+/g, ' ').replace(/(AM|PM)/i, ' $1');
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'CP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopyAddress = (address, id) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const fieldsToHide = [
    'Water feature pump present',
    'Spa jet pump present',
    'Heater present',
    'Alternative Sanitizer present',
    'Additional Issue photos',
    'Additional Photos',
    'Additional Photo',
    'Submission ID',
    'Choose an image'
  ];

  if (data.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
          <Droplets className="w-6 h-6" />
        </div>
        <h3 className="font-outfit font-bold text-slate-800 text-base">No Matching Records</h3>
        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
          {searchQuery ? `No customer assessments matching "${searchQuery}". Try adjusting your filters or search terms.` : 'No records found in this category.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.map((row, index) => {
          const customerName = row['Customer name'] || row['Customer Name'] || 'Unknown Customer';
          const address = row['Customer Address'] || row['Customer address'];
          const submissionTime = row['Submission time'];
          const cardId = `card-${index}`;
          const isExpanded = !!expandedCards[index];

          // Key spec highlights for quick glance
          const pumpModel = row['Filter Pump Model'] || row['Pump Model'];
          const pumpHp = row['Filter Pump HP'] || row['Pump HP'];
          const sanitizer = row['Sanitizer'];
          const filterType = row['Filter Type'];
          const booster = row['Booster Pump'];

          // Photo entries
          const photoEntries = Object.entries(row).filter(([key, value]) => {
            if (!value || value === '') return false;
            const lowKey = key.toLowerCase();
            if (fieldsToHide.some(h => h.toLowerCase() === lowKey)) return false;
            return lowKey.includes('photo') || lowKey.includes('image');
          });

          // All remaining specification fields
          const allSpecEntries = Object.entries(row).filter(([key, value]) => {
            if (!value || value === '') return false;
            const lowKey = key.toLowerCase();
            if (lowKey.includes('customer name') ||
                lowKey.includes('customer address') ||
                lowKey.includes('submission time')) return false;
            if (lowKey.includes('photo') || lowKey.includes('image')) return false;
            if (fieldsToHide.some(h => h.toLowerCase() === lowKey)) return false;
            return true;
          });

          return (
            <div 
              key={index} 
              className="bg-white rounded-3xl border border-slate-200/85 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-5 sm:p-6">
                {/* Header: Customer Info & Date */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {/* Customer Initials Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-cyan-500 text-white font-outfit font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-600/15">
                      {getInitials(customerName)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black font-outfit text-slate-900 leading-snug truncate">
                        {customerName}
                      </h3>
                      
                      {address && (
                        <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                          <span className="text-xs text-slate-500 flex items-center leading-tight">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-sky-600 flex-shrink-0" />
                            <span className="truncate max-w-xs sm:max-w-md">{address}</span>
                          </span>

                          <div className="flex items-center space-x-1 ml-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors"
                              title="Open Directions in Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleCopyAddress(address, cardId)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Copy Address to Clipboard"
                            >
                              {copiedId === cardId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {submissionTime && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 flex-shrink-0 self-start sm:self-center">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>{formatDate(submissionTime)}</span>
                    </div>
                  )}
                </div>

                {/* Quick Highlight Pills Bar */}
                {(pumpModel || sanitizer || filterType || booster) && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    {pumpModel && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/60">
                        <Gauge className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                        {pumpModel} {pumpHp && `(${pumpHp} HP)`}
                      </span>
                    )}
                    {sanitizer && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/60">
                        <Droplets className="w-3.5 h-3.5 mr-1.5 text-cyan-600" />
                        {sanitizer}
                      </span>
                    )}
                    {filterType && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                        <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        {filterType} Filter
                      </span>
                    )}
                    {booster && booster.toLowerCase() !== 'no' && booster.toLowerCase() !== 'none' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        Booster Pump
                      </span>
                    )}
                  </div>
                )}

                {/* Photo Gallery Chips */}
                {photoEntries.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Assessment Media ({photoEntries.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {photoEntries.map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setActivePhotoModal({ title: key, url: value })}
                          className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-all shadow-sm group cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                          <div className="text-left">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block leading-none">{key}</span>
                            <span className="text-[11px] font-bold text-sky-600 leading-tight">View Photo</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible / Expandable Full Specifications */}
                {allSpecEntries.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(index)}
                      className="w-full flex items-center justify-between py-2 text-xs font-bold font-outfit text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
                    >
                      <span>
                        {isExpanded ? 'Hide Equipment Specifications' : `View All Equipment Specifications (${allSpecEntries.length})`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/50">
                        {allSpecEntries.map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                              {key}
                            </span>
                            {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-800 underline font-semibold flex items-center mt-1 text-xs truncate"
                              >
                                <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                View Link
                              </a>
                            ) : (
                              <span className="text-slate-800 text-xs font-bold mt-0.5 break-words">
                                {String(value)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Lightbox Photo Viewer Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white font-outfit">{activePhotoModal.title}</h4>
                <p className="text-[11px] text-slate-400">Pool Assessment Photo</p>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={activePhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Open Full Image"
                >
                  <Maximize2 className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={activePhotoModal.url}
                alt={activePhotoModal.title}
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
