import { MapPin, Calendar, Camera, Link as LinkIcon } from 'lucide-react';

export default function DataList({ data, searchQuery }) {
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const cleanStr = dateStr.replace(/\s+/g, ' ').replace(/(AM|PM)/i, ' $1');
    const time = new Date(cleanStr).getTime();
    return isNaN(time) ? 0 : time;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.replace(/\s+/g, ' ').replace(/(AM|PM)/i, ' $1');
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };

  // Sort data by Submission time descending (most recent first)
  const sortedData = [...data].sort((a, b) => {
    return parseDate(b['Submission time']) - parseDate(a['Submission time']);
  });

  // Filter data globally across all string values in the row
  const filteredData = sortedData.filter(row => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return Object.values(row).some(value => {
      if (value && typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      return false;
    });
  });

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-brand-border shadow-premium">
        <p className="text-slate-400 text-sm font-medium">No records matching your search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {filteredData.map((row, index) => (
        <div 
          key={index} 
          className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-premium hover:-translate-y-[1px] transition-all duration-300 shadow-sm"
        >
          <div className="p-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 font-outfit leading-tight">
                  {row['Customer name'] || row['Customer Name'] || 'Unknown Customer'}
                </h3>
                {(row['Customer Address'] || row['Customer address']) && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-start">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-brand-blue flex-shrink-0 mt-0.5" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row['Customer Address'] || row['Customer address'])}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:text-brand-blueDark hover:underline font-medium break-words leading-tight"
                    >
                      {row['Customer Address'] || row['Customer address']}
                    </a>
                  </p>
                )}
              </div>
              
              {row['Submission time'] && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-light text-brand-blue border border-brand-border/60 shadow-sm whitespace-nowrap self-start sm:self-auto">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-brand-blue flex-shrink-0" />
                  {formatDate(row['Submission time'])}
                </span>
              )}
            </div>

            {/* Photo Categories Section */}
            {(() => {
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

              const photoEntries = Object.entries(row).filter(([key, value]) => {
                if (!value || value === '') return false;
                const lowKey = key.toLowerCase();
                if (fieldsToHide.some(h => h.toLowerCase() === lowKey)) return false;
                return lowKey.includes('photo') || lowKey.includes('image');
              });

              if (photoEntries.length === 0) return null;

              return (
                <div className="mt-4 flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
                  {photoEntries.map(([key, value]) => (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-light text-slate-700 border border-brand-border hover:bg-brand-blue/5 hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm group"
                    >
                      <Camera className="w-4 h-4 mr-1.5 text-slate-400 group-hover:text-brand-blue transition-colors flex-shrink-0" />
                      <div className="flex flex-col items-start leading-tight text-left">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{key}</span>
                        <span className="text-[11px] font-bold text-brand-blue transition-colors">View Photo</span>
                      </div>
                    </a>
                  ))}
                </div>
              );
            })()}

            {/* Specs Grid Section */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-100 pt-4">
              {(() => {
                const fieldOrder = [
                  'Filter Pump Model', 'Filter Pump HP',
                  '|',
                  'Booster Pump',
                  '|',
                  'Filter Type', 'Filter Model',
                  '|',
                  'Sanitizer',
                  '|',
                  'Water feature pump model', 'Water feature pump hp'
                ];

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

                const allEntries = Object.entries(row).filter(([key, value]) => {
                  if (!value || value === '') return false;
                  const lowKey = key.toLowerCase();
                  if (lowKey.includes('customer name') ||
                    lowKey.includes('customer address') ||
                    lowKey.includes('submission time')) return false;

                  if (lowKey.includes('photo') || lowKey.includes('image')) return false;
                  if (fieldsToHide.some(h => h.toLowerCase() === lowKey)) return false;
                  return true;
                });

                const orderedItems = [];
                const usedKeys = new Set();

                fieldOrder.forEach(item => {
                  if (item === '|') {
                    if (orderedItems.length > 0 && orderedItems[orderedItems.length - 1].type !== 'separator') {
                      orderedItems.push({ type: 'separator' });
                    }
                  } else {
                    const entry = allEntries.find(([key]) => key.toLowerCase() === item.toLowerCase());
                    if (entry) {
                      orderedItems.push({ type: 'field', key: entry[0], value: entry[1] });
                      usedKeys.add(entry[0]);
                    }
                  }
                });

                allEntries.forEach(([key, value]) => {
                  if (!usedKeys.has(key)) {
                    orderedItems.push({ type: 'field', key, value });
                  }
                });

                const finalItems = [];
                orderedItems.forEach(item => {
                  if (item.type === 'separator') {
                    if (finalItems.length > 0 && finalItems[finalItems.length - 1].type !== 'separator') {
                      finalItems.push(item);
                    }
                  } else {
                    finalItems.push(item);
                  }
                });
                if (finalItems.length > 0 && finalItems[finalItems.length - 1].type === 'separator') {
                  finalItems.pop();
                }

                return finalItems.map((item, i) => {
                  if (item.type === 'separator') {
                    return <div key={`sep-${i}`} className="col-span-full border-t border-slate-100 my-0.5 pt-0.5 opacity-60" />;
                  }

                  const { key, value } = item;
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                      {typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:text-brand-blueDark underline font-semibold flex items-center mt-1 text-xs"
                        >
                          <LinkIcon className="w-3.5 h-3.5 mr-1" />
                          View Link
                        </a>
                      ) : (
                        <span className="text-slate-700 text-sm font-semibold mt-0.5 break-words">{value}</span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
