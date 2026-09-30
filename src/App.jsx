import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Laptop,
  Smartphone,
  BookOpen,
  X,
  ArrowRight,
  Landmark,
  Shield,
  Handshake,
  Zap,
  Info
} from 'lucide-react';
import MobileFrame from './components/MobileFrame';
import SimulatorPanel from './components/SimulatorPanel';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('c-001');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [showTransparencyModal, setShowTransparencyModal] = useState(false);
  const [showJuryGuide, setShowJuryGuide] = useState(false);
  const [recentEvents, setRecentEvents] = useState([
    { desc: 'Engine booted & initialized with baseline dataset', time: '10:00:00' }
  ]);

  // Show temporary toast notification
  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const logEvent = (desc) => {
    const time = new Date().toLocaleTimeString('nl-BE');
    setRecentEvents(prev => [{ desc, time }, ...prev.slice(0, 9)]);
  };

  // 1. Fetch clients on mount
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
          const initialId = data.find(c => c.id === 'c-001' || c.id === 'c1')?.id || data[0].id;
          setSelectedClientId(initialId);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        triggerToast('Could not connect to FastAPI backend on port 8000', 'error');
      }
    }
    fetchClients();
  }, []);

  // 2. Fetch selected client prediction
  useEffect(() => {
    if (!selectedClientId) return;

    async function loadClientPrediction() {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${selectedClientId}`);
        if (!res.ok) throw new Error(`Failed to load prediction for ${selectedClientId}`);
        const data = await res.json();
        setPredictionData(data);
        logEvent(`Loaded profile: ${data.client?.name} (${selectedClientId})`);
      } catch (err) {
        console.error(err);
        triggerToast(`Error loading data for ${selectedClientId}`, 'error');
      } finally {
        setLoading(false);
      }
    }

    loadClientPrediction();
  }, [selectedClientId]);

  // 3. Inject new live event (triggers predict_client_intent in backend)
  const handleTriggerEvent = async (eventObj) => {
    if (!selectedClientId) return;
    try {
      setInjecting(true);
      const res = await fetch(`/api/clients/${selectedClientId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventObj)
      });
      if (!res.ok) throw new Error(`Failed to inject event: ${res.statusText}`);
      const updatedPrediction = await res.json();
      
      setPredictionData(updatedPrediction);
      
      const eventName = eventObj.type === 'transaction' 
        ? `Payment to ${eventObj.payload?.merchant || 'merchant'} (€${Math.abs(eventObj.payload?.amount || 0)})` 
        : eventObj.payload?.action?.replace(/_/g, ' ');
      
      const stageName = updatedPrediction.prediction?.stage?.replace(/_/g, ' ').toUpperCase();
      logEvent(`Signal injected: "${eventName}" ➔ Stage: ${stageName}`);
      triggerToast(`Live Signal Processed: "${eventName}"!`);
    } catch (err) {
      console.error(err);
      triggerToast(err.message, 'error');
    } finally {
      setInjecting(false);
    }
  };

  // 4. Reset simulator dataset
  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/simulator/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      
      const clientRes = await fetch(`/api/clients/${selectedClientId}`);
      const freshData = await clientRes.json();
      setPredictionData(freshData);

      logEvent('Dataset reset to pristine initial demo baseline state');
      triggerToast('Demo reset successfully to baseline state.');
    } catch (err) {
      console.error(err);
      triggerToast('Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030812] text-slate-100 selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00a2e0] to-[#002d5a] text-white font-extrabold text-sm shadow-glow-cyan border border-cyan-400/30">
              KBC
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Signal-to-Action Realtime Experience</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
                  KBC Challenge
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Cross-Domain Personalization Engine • Bank • Insurance • Partners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowJuryGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-semibold"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Demo Script</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium">FastAPI :8000</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dual-View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* LEFT COLUMN: 44% - Authentic Smartphone Mockup */}
          <section className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[395px] sticky top-20">
              <div className="flex items-center justify-between mb-2.5 px-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>KBC Mobile Live Feed</span>
                </span>
                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Instant Mirror
                </span>
              </div>

              {/* Smartphone Component */}
              <MobileFrame
                client={predictionData?.client}
                prediction={predictionData?.prediction}
                experience={predictionData?.experience}
                onActionClick={(action) => setActionModal(action)}
                onOpenTransparency={() => setShowTransparencyModal(true)}
              />
            </div>
          </section>

          {/* RIGHT COLUMN: 56% - Engine Simulator Dashboard */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-cyan-400" />
                <span>Behind-the-Scenes Engine Dashboard</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Jury Control Room</span>
            </div>

            <SimulatorPanel
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={(id) => setSelectedClientId(id)}
              prediction={predictionData?.prediction}
              client={predictionData?.client}
              onTriggerEvent={handleTriggerEvent}
              onReset={handleReset}
              loading={loading}
              injecting={injecting}
              recentEvents={recentEvents}
              onOpenTransparency={() => setShowTransparencyModal(true)}
            />
          </section>

        </div>
      </main>

      {/* Action Click Modal */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {actionModal.domain} Solution
                  </span>
                  <h3 className="text-base font-bold text-white mt-2.5">{actionModal.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {actionModal.description}
              </p>

              <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider">
                  How this integrates into KBC Mobile:
                </span>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Instant pre-filling using customer's known financial profile</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Cross-domain bundling (e.g. combined mortgage + fire insurance discount)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Direct Kate assistant handoff with pre-configured parameters</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionModal(null);
                    triggerToast(`Activated: "${actionModal.title}"`);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-[#00a2e0] hover:brightness-110 font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>{actionModal.cta || "Proceed in App"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Algorithmic Transparency & Explainability Modal (GDPR Art. 22) */}
      <AnimatePresence>
        {showTransparencyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-glow-cyan">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Algorithmic Transparency</h4>
                    <p className="text-[10px] text-slate-400 font-mono">GDPR Art. 22 Compliant • Explainable AI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransparencyModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Client & State Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Client Profile</span>
                  <span className="font-bold text-white">{predictionData?.client?.name}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Predicted Intent</span>
                  <span className="font-bold text-cyan-300 capitalize">
                    {predictionData?.prediction?.detected_intent?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="space-y-3">
                <div className="rounded-2xl bg-cyan-950/50 border border-cyan-500/30 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                    <Info className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Engine Rationale</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {predictionData?.experience?.why_am_i_seeing_this || "Computed in real time by the KBC Signal-to-Action engine based on recent spending patterns and simulator usage."}
                  </p>
                </div>

                {/* Signals breakdown */}
                {predictionData?.prediction?.detected_signals && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Active Trigger Signals Evaluated:
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll pr-1">
                      {predictionData.prediction.detected_signals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-200 bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60"
                        >
                          <Zap className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Badge */}
                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-[11px] text-slate-400 leading-normal">
                  🔒 <strong className="text-slate-300">Human in control:</strong> These recommendations assist your planning without locking credit decisions or altering account settings (GDPR Art. 22 §2).
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowTransparencyModal(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-[#00a2e0] py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Jury Demo Guide Modal */}
      <AnimatePresence>
        {showJuryGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Jury Presentation Script</h3>
                    <p className="text-[11px] text-slate-400">Step-by-step walkthrough to wow the judges</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJuryGuide(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-300">Step 1: Start with Thomas De Smet (Default)</div>
                  <p className="text-slate-300">
                    Show the jury that Thomas is in the <strong>Active Decision</strong> stage (88% confidence) for buying a home. Point out the Kate bubble and the 3 recommended cards (Bank: Loan calculator, Insurance: First home guide, Partner: Immoweb matcher).
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300">Step 2: The Climax Trigger (Notary Fee Payment)</div>
                  <p className="text-slate-300">
                    Click <strong>"2. Trigger Closing: Notary Fee (€750)"</strong> in the scenario panel. Watch the stage jump live to <strong>ACTION READY</strong>! Kate immediately changes her message to congratulate Thomas, and the cards update to closing deeds, home insurance, and partner moving discounts.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-300">Step 3: Switch to Sarah Alami (Freelancer)</div>
                  <p className="text-slate-300">
                    Click <strong>Sarah Alami</strong> in the persona switcher. Instantly, the entire mobile feed pivots into freelance accounting, KBC business accounts, and VAT tools.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400">Step 4: Algorithmic Transparency</div>
                  <p className="text-slate-300">
                    Click <strong>"Why am I seeing this?"</strong> inside the mobile frame to demonstrate GDPR Art. 22 compliance and Explainable AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowJuryGuide(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white transition-all shadow-md"
              >
                Close & Return to Demo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Realtime Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : 'bg-slate-900/90 text-cyan-200 border-cyan-500/40 shadow-glow-cyan'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}