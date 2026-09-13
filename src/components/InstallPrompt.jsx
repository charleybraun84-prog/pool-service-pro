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
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-950/90 backdrop-blur-xl text-white p-5 rounded-3xl shadow-2xl z-50 border border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex space-x-3.5">
          <div className="bg-gradient-to-tr from-sky-500 to-cyan-500 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/25 flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black font-outfit text-white leading-tight">Install Field Pro App</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Add Cricket's Pool & Spa World to your home screen for instant offline access and field speed.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowPrompt(false)} 
          className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-4 flex space-x-2.5 justify-end">
        <button
          onClick={() => setShowPrompt(false)}
          className="px-4 py-2 text-xs font-bold font-outfit text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          Not Now
        </button>
        <button
          onClick={handleInstallClick}
          className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-black font-outfit py-2 px-4 rounded-xl shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <span>Install Now</span>
        </button>
      </div>
    </div>
  );
}
