import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  RotateCcw, 
  Users, 
  Activity, 
  CheckCircle2, 
  Send, 
  Sliders, 
  FileText, 
  Building, 
  Briefcase, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function SimulatorPanel({
  clients,
  selectedClientId,
  onSelectClient,
  prediction,
  client,
  onTriggerEvent,
  onReset,
  loading,
  injecting,
  recentEvents = [],
  onOpenTransparency
}) {
  const [showManualForm, setShowManualForm] = useState(true);
  const [manualType, setManualType] = useState('transaction');
  const [manualMerchant, setManualMerchant] = useState('Notaris Van Damme & Partners Leuven');
  const [manualAmount, setManualAmount] = useState('-750.00');
  const [manualCategory, setManualCategory] = useState('notary');
  const [manualDescription, setManualDescription] = useState('Advance deposit for sales deed closing');
  const [manualAction, setManualAction] = useState('mortgage_simulator_used');
  const [selectedPresetId, setSelectedPresetId] = useState('notary_closing');

  const confidencePercent = Math.round((prediction?.confidence || 0) * 100);

  // Format intent name to human readable
  const formatIntentName = (intent) => {
    switch (intent) {
      case 'first_time_home_buyer':
        return 'First-Time Home Buyer';
      case 'freelance_entrepreneur':
        return 'Freelance & Business Starter';
      case 'wealth_accumulator':
        return 'Wealth Accumulator & Investor';
      default:
        return intent?.replace(/_/g, ' ') || 'Evaluating Intent';
    }
  };

  // 3-Stage Pipeline mapping
  const stages = [
    { id: 'exploring', name: '1. Exploring', desc: 'Orientation & research' },
    { id: 'active_decision', name: '2. Active Decision', desc: 'Simulating & hunting' },
    { id: 'action_ready', name: '3. Action Ready', desc: 'Contract & closing' }
  ];

  const currentStageId = prediction?.stage || 'exploring';
  const getStageIndex = (stage) => {
    if (stage === 'action_ready' || stage === 'closing') return 2;
    if (stage === 'active_decision' || stage === 'actively_searching') return 1;
    return 0;
  };
  const activeStageIndex = getStageIndex(currentStageId);

  const [showAllClients, setShowAllClients] = useState(false);

  // Quick transaction templates for manual injection
  const transactionPresets = [
    {
      id: 'notary_closing',
      name: 'Notary Closing Fee',
      icon: <FileText className="h-3.5 w-3.5 text-emerald-400" />,
      merchant: 'Notaris Van Damme & Partners Leuven',
      amount: '-750.00',
      category: 'notary',
      description: 'Advance deposit for sales deed closing & title registration',
      tag: '➔ Jumps to Action Ready'
    },
    {
      id: 'immoweb_portal',
      name: 'Immoweb Listing',
      icon: <Building className="h-3.5 w-3.5 text-cyan-400" />,
      merchant: 'Immoweb S.A. Brussels',
      amount: '-49.00',
      category: 'real_estate_platform',
      description: 'Property search alerts & valuation report',
      tag: '➔ Home Buyer Signal'
    },
    {
      id: 'epc_surveyor',
      name: 'EPC Energy Audit',
      icon: <Zap className="h-3.5 w-3.5 text-amber-400" />,
      merchant: 'ACEG Certificatie & Expertise',
      amount: '-385.00',
      category: 'surveyor',
      description: 'Mandatory EPC energy certificate audit',
      tag: '➔ Pre-Purchase Check'
    },
    {
      id: 'acerta_social',
      name: 'Acerta Social Security',
      icon: <Briefcase className="h-3.5 w-3.5 text-purple-400" />,
      merchant: 'Acerta Sociaal Verzekeringsfonds',
      amount: '-845.00',
      category: 'social_contributions',
      description: 'Quarterly statutory social security contribution',
      tag: '➔ Freelance Signal'
    },
    {
      id: 'partena_kbo',
      name: 'Partena CBE Desk',
      icon: <Building className="h-3.5 w-3.5 text-blue-400" />,
      merchant: 'Partena Professional Enterprise Desk',
      amount: '-105.50',
      category: 'social_contributions',
      description: 'Crossroads Bank for Enterprises company registration',
      tag: '➔ Freelance Starter'
    },
    {
      id: 'savings_boost',
      name: 'Monthly Savings Boost',
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
      merchant: 'KBC High-Yield Savings Account',
      amount: '-650.00',
      category: 'savings_deposit',
      description: 'Automated recurring wealth reserve deposit',
      tag: '➔ Wealth Accumulation'
    }
  ];

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setManualType('transaction');
    setManualMerchant(preset.merchant);
    setManualAmount(preset.amount);
    setManualCategory(preset.category);
    setManualDescription(preset.description);
    setShowManualForm(true);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualType === 'transaction') {
      onTriggerEvent({
        type: 'transaction',
        payload: {
          amount: parseFloat(manualAmount) || -50.0,
          merchant: manualMerchant || 'Custom Merchant',
          category: manualCategory,
          description: manualDescription || 'Manual simulation event'
        }
      });
    } else {
      onTriggerEvent({
        type: 'interaction',
        payload: {
          action: manualAction,
          details: {
            note: manualDescription || 'In-app manual action'
          }
        }
      });
    }
  };

  return (
    <div className="space-y-4 rounded-3xl bg-slate-900/90 p-5 border border-slate-800 shadow-2xl backdrop-blur-xl">
      
      {/* Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/40 shadow-glow-cyan">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Engine Control & Simulation Panel</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live Reactive
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Inject behavioral signals & watch the KBC Mobile feed adapt instantly
            </p>
          </div>
        </div>

        {/* Reset Demo Button */}
        <button
          type="button"
          onClick={onReset}
          disabled={loading || injecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          title="Reset dataset back to initial state"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* 1. Customer Persona Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>1. Customer Persona ({clients.length})</span>
          </label>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any client to switch profile
            </span>
            {clients.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllClients(!showAllClients)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 transition-colors"
              >
                {showAllClients ? 'Compact view' : `View all (${clients.length})`}
              </button>
            )}
          </div>
        </div>

        {/* All Personas List / Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 ${
            showAllClients ? '' : 'max-h-[300px] overflow-y-auto custom-scroll'
          } pr-1.5 p-0.5`}
        >
          {(showAllClients ? clients : clients.slice(0, 3)).map((c) => {
            const isSelected = c.id === selectedClientId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectClient(c.id)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/90 via-blue-950/80 to-slate-900 border-cyan-400 shadow-glow-cyan text-white ring-1 ring-cyan-400/50'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-1">
                  <span className="font-bold text-xs text-white truncate">{c.name}</span>
                  <span className="text-[10px] font-mono opacity-60 bg-black/30 px-1.5 py-0.5 rounded flex-shrink-0">
                    {c.id}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-300 font-medium truncate">
                  {c.profession || c.profile || c.current_life_stage?.replace(/_/g, ' ')}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1.5">
                  <span className="truncate">Savings: €{c.savings_balance?.toLocaleString()}</span>
                  <span className="text-emerald-400 font-medium flex-shrink-0 ml-1">
                    €{c.monthly_income?.toLocaleString()}/mo
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Realtime Intent & Confidence Cockpit */}
      <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800/90 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>2. Realtime Intent Cockpit</span>
          </span>
          <span className="text-[11px] text-cyan-400 font-mono">
            {prediction?.detected_intent}
          </span>
        </div>

        {/* Intent & Confidence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Detected Intent Banner */}
          <div className="md:col-span-7 rounded-xl bg-slate-900/90 p-3 border border-slate-800/80 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">
                Predicted Life Event
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                {formatIntentName(prediction?.detected_intent)}
              </span>
            </div>

            {/* Multi-Intent Leveling Distribution */}
            {prediction?.intent_distribution && (
              <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[10px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="truncate">Home Buyer</span>
                  <span className="font-mono text-cyan-300 font-bold ml-1">
                    {Math.round((prediction.intent_distribution.first_time_home_buyer || 0) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((prediction.intent_distribution.first_time_home_buyer || 0) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span className="truncate">Freelance Starter</span>
                  <span className="font-mono text-purple-300 font-bold ml-1">
                    {Math.round((prediction.intent_distribution.freelance_entrepreneur || 0) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((prediction.intent_distribution.freelance_entrepreneur || 0) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span className="truncate">Wealth Accumulator</span>
                  <span className="font-mono text-emerald-300 font-bold ml-1">
                    {Math.round((prediction.intent_distribution.wealth_accumulator || 0) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((prediction.intent_distribution.wealth_accumulator || 0) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confidence Meter */}
          <div className="md:col-span-5 rounded-xl bg-slate-900/90 p-3 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Confidence Score
              </span>
              <span className="text-xs font-extrabold text-emerald-400 font-mono">
                {confidencePercent}%
              </span>
            </div>
            
            {/* Visual Gauge */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  confidencePercent >= 85
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic 3-Stage Visual Pipeline */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Lifecycle Stage Pipeline:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {stages.map((st, idx) => {
              const isActive = idx === activeStageIndex;
              const isPast = idx < activeStageIndex;
              return (
                <div
                  key={st.id}
                  className={`rounded-xl p-2.5 text-center transition-all border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-glow-cyan text-white ring-1 ring-cyan-400'
                      : isPast
                      ? 'bg-slate-900/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/30 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                    {isPast && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    )}
                    <span className="text-xs font-bold">{st.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Detected Signals Badges */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Signal Evidence:
            </span>
            {onOpenTransparency && (
              <button
                type="button"
                onClick={onOpenTransparency}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300 hover:text-white transition-colors bg-cyan-950/70 hover:bg-cyan-900/80 px-2 py-0.5 rounded-full border border-cyan-500/30"
              >
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                <span>Explainability (GDPR Art. 22)</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {prediction?.detected_signals?.map((sig, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm"
              >
                <Zap className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                <span>{sig}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Live Jury Quick-Trigger Scenario Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>3. Quick Jury Scenarios (Live Signal Injection)</span>
          </label>
          <span className="text-[11px] text-cyan-300 font-medium">Click to demo live reaction</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Scenario 1: Mortgage Simulator */}
          <button
            type="button"
            disabled={injecting}
            onClick={() => onTriggerEvent({
              type: 'interaction',
              payload: {
                action: 'mortgage_simulator_used',
                details: {
                  simulated_amount: 325000,
                  term_years: 25,
                  interest_rate_type: 'fixed'
                }
              }
            })}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-left transition-all active:scale-[0.98] disabled:opacity-50 group hover:shadow-glow-cyan"
          >
            <div className="p-2 rounded-xl bg-blue-500/15 text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-500/25">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-cyan-300">
                1. Simulate Mortgage (€325k)
              </span>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Simulate 25-yr loan ➔ Moves to Active Decision
              </p>
            </div>
          </button>

          {/* Scenario 2: THE CLOSING TRIGGER - Notary Fee */}
          <button
            type="button"
            disabled={injecting}
            onClick={() => onTriggerEvent({
              type: 'transaction',
              payload: {
                amount: -750.0,
                merchant: 'Notaris Van Damme & Partners Leuven',
                category: 'notary',
                description: 'Deposit for sales agreement deed closing'
              }
            })}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-800 to-slate-800 hover:from-emerald-900/80 border border-emerald-500/50 hover:border-emerald-400 text-left transition-all active:scale-[0.98] disabled:opacity-50 group shadow-glow-emerald"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 group-hover:bg-emerald-500/30">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-300 block group-hover:text-emerald-200">
                2. Trigger Closing: Notary Fee (€750)
              </span>
              <p className="text-[11px] text-emerald-200/80 leading-tight mt-0.5">
                Sales deed paid ➔ Jumps to ACTION READY
              </p>
            </div>
          </button>

          {/* Scenario 3: Freelance / CBE */}
          <button
            type="button"
            disabled={injecting}
            onClick={() => onTriggerEvent({
              type: 'interaction',
              payload: {
                action: 'business_account_viewed',
                details: {
                  product: 'KBC Business Account Plus',
                  feature: 'automated VAT reservation'
                }
              }
            })}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/60 text-left transition-all active:scale-[0.98] disabled:opacity-50 group hover:shadow-glow-purple"
          >
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 group-hover:bg-purple-500/25">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-purple-300">
                3. Simulate CBE / Freelance Tool
              </span>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Check VAT reservation & company registration
              </p>
            </div>
          </button>

          {/* Scenario 4: Savings boost */}
          <button
            type="button"
            disabled={injecting}
            onClick={() => onTriggerEvent({
              type: 'transaction',
              payload: {
                amount: -550.0,
                merchant: 'KBC High-Yield Savings Account',
                category: 'savings_deposit',
                description: 'Automatic monthly savings deposit'
              }
            })}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 text-left transition-all active:scale-[0.98] disabled:opacity-50 group hover:shadow-glow-emerald"
          >
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/25">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                4. Recurring Savings (+€550/mo)
              </span>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Register recurring deposit to boost reserve
              </p>
            </div>
          </button>
        </div>

        {/* 4. Live Activity Stream / Audit Feed */}
        {recentEvents.length > 0 && (
          <div className="rounded-2xl bg-slate-950/70 p-3 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>Realtime Signal Stream (Last Activities)</span>
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scroll pr-1 font-mono text-[11px]">
              {recentEvents.map((evt, i) => (
                <div key={i} className="flex items-center justify-between text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  <span className="text-cyan-400 truncate max-w-[280px]">
                    {evt.desc}
                  </span>
                  <span className="text-slate-500 text-[10px] flex-shrink-0">
                    {evt.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Custom Manual Event Form (Collapsible) */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider hover:text-cyan-400 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>4. Custom Signal Injection & Transaction Presets</span>
              {showManualForm ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            <span className="text-[11px] text-cyan-300 font-medium">Click preset to auto-fill</span>
          </div>

          {showManualForm && (
            <div className="space-y-3.5 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
              
              {/* Transaction Type Presets Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span>⚡ Click a Transaction Type to Pre-fill Form:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Loads preset data below</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {transactionPresets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id && manualMerchant === preset.merchant;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-xl text-left transition-all border group ${
                          isSelected
                            ? 'bg-gradient-to-br from-cyan-950/90 to-blue-950/90 border-cyan-400 shadow-glow-cyan ring-1 ring-cyan-400/50 text-white'
                            : 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {preset.icon}
                            <span className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300">
                              {preset.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-cyan-300 flex-shrink-0">
                            €{Math.abs(parseFloat(preset.amount))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span className="text-emerald-400/90 font-medium truncate">{preset.tag}</span>
                          <span className="text-[9px] text-cyan-400 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                            Pre-fill ➔
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Mode Selector & Inputs */}
              <form onSubmit={handleManualSubmit} className="space-y-3 pt-2.5 border-t border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1 max-w-[240px]">
                    <button
                      type="button"
                      onClick={() => setManualType('transaction')}
                      className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                        manualType === 'transaction'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Transaction
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualType('interaction')}
                      className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                        manualType === 'interaction'
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      In-App Action
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 italic">
                    {manualType === 'transaction' ? 'Pre-filled values (editable):' : 'Configure action:'}
                  </span>
                </div>

                {manualType === 'transaction' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Merchant Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Notaris Sterling"
                        value={manualMerchant}
                        onChange={(e) => {
                          setManualMerchant(e.target.value);
                          setSelectedPresetId(null);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Amount (€, negative for expense)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="-50.00"
                        value={manualAmount}
                        onChange={(e) => {
                          setManualAmount(e.target.value);
                          setSelectedPresetId(null);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white font-mono transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Category</label>
                      <select
                        value={manualCategory}
                        onChange={(e) => {
                          setManualCategory(e.target.value);
                          setSelectedPresetId(null);
                        }}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white transition-colors outline-none"
                      >
                        <option value="notary">Notary / Legal Closing Fees</option>
                        <option value="surveyor">Land Surveyor / EPC Energy</option>
                        <option value="real_estate_platform">Real Estate Portal (Immoweb)</option>
                        <option value="savings_deposit">Savings Deposit</option>
                        <option value="social_contributions">Social Contributions (Acerta/Xerius)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Description / Booking Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Sales agreement deed closing"
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white transition-colors outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Action Type</label>
                      <select
                        value={manualAction}
                        onChange={(e) => setManualAction(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white transition-colors outline-none"
                      >
                        <option value="mortgage_simulator_used">Mortgage Simulator Used</option>
                        <option value="kate_query">Kate Assistant Query</option>
                        <option value="business_account_viewed">Business Account Viewed</option>
                        <option value="investment_fund_viewed">Investment Fund Simulation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[11px]">Note / Parameters</label>
                      <input
                        type="text"
                        placeholder="e.g. In-app simulation details"
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 px-2.5 py-1.5 text-white transition-colors outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={injecting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#00a2e0] hover:brightness-110 font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {injecting 
                      ? 'Injecting Signal to Engine...' 
                      : manualType === 'transaction' && manualMerchant
                        ? `Inject Transaction: ${manualMerchant} (€${Math.abs(parseFloat(manualAmount) || 0)})`
                        : 'Inject Signal Now'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
