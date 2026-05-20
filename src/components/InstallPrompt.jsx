import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      // Clear the deferredPrompt so it can be garbage collected
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-brand-dark text-white p-4.5 rounded-2xl shadow-xl z-50 border border-brand-slate/85 transition-all duration-300 animate-slide-in">
      <div className="flex items-start justify-between">
        <div className="flex space-x-3">
          <div className="bg-brand-blue/20 p-2 rounded-xl text-brand-blueLight flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-outfit text-white">Add to Home Screen</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Install Pool Service Pro for offline access & faster load times.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrompt(false)} 
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4 flex space-x-2 justify-end">
        <button
          onClick={() => setShowPrompt(false)}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className="bg-brand-blue hover:bg-brand-blueDark text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm flex items-center transition-colors border border-brand-blueLight/10"
        >
          Install Now
        </button>
      </div>
    </div>
  );
}
