import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  Battery, 
  Bell, 
  ShieldCheck, 
  Handshake, 
  ChevronRight, 
  Home, 
  Wallet, 
  Sparkles, 
  Menu,
  Landmark,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Send,
  QrCode
} from 'lucide-react';
import KateWidget from './KateWidget';

export default function MobileFrame({ client, prediction, experience, onActionClick, onOpenTransparency }) {
  const [activeTab, setActiveTab] = useState('home');

  const recommendedActions = experience?.recommended_actions || [];

  const getDomainTheme = (domain) => {
    switch (domain) {
      case 'banking':
        return {
          icon: <Landmark className="h-4 w-4 text-[#00a2e0]" />,
          badge: 'bg-[#00a2e0]/15 text-[#00c0ff] border-[#00a2e0]/40',
          border: 'border-[#00a2e0]/30 hover:border-[#00a2e0]/70',
          glow: 'hover:shadow-[0_0_20px_rgba(0,162,224,0.2)]',
          label: 'BANKING'
        };
      case 'insurance':
        return {
          icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          border: 'border-emerald-500/30 hover:border-emerald-500/70',
          glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
          label: 'INSURANCE'
        };
      case 'partner':
        return {
          icon: <Handshake className="h-4 w-4 text-purple-400" />,
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          border: 'border-purple-500/30 hover:border-purple-500/70',
          glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
          label: 'PARTNER DEALS'
        };
      default:
        return {
          icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
          border: 'border-cyan-500/30 hover:border-cyan-500/70',
          glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]',
          label: 'SERVICE'
        };
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(val || 0);
  };

  return (
    <div className="relative mx-auto flex justify-center py-1">
      {/* Smartphone Chassis */}
      <div className="relative w-[385px] h-[810px] rounded-[52px] bg-[#0b121e] p-3 shadow-phone-pro border-[3px] border-slate-700/80 overflow-hidden flex flex-col">
        
        {/* Hardware details: Side buttons */}
        <div className="absolute -left-[5px] top-28 h-9 w-[3px] rounded-l-sm bg-slate-600" />
        <div className="absolute -left-[5px] top-40 h-10 w-[3px] rounded-l-sm bg-slate-600" />
        <div className="absolute -left-[5px] top-52 h-10 w-[3px] rounded-l-sm bg-slate-600" />
        <div className="absolute -right-[5px] top-36 h-14 w-[3px] rounded-r-sm bg-slate-600" />

        {/* Inner Phone Screen */}
        <div className="relative flex-1 rounded-[42px] bg-[#050d18] overflow-hidden flex flex-col text-slate-100 select-none">
          
          {/* Top Status Bar & Dynamic Island */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 bg-gradient-to-b from-[#002d5a] to-[#00254a] text-slate-200">
            <span className="text-[12px] font-bold tracking-tight">9:41</span>
            
            {/* Dynamic Island */}
            <div className="h-5 w-24 rounded-full bg-black flex items-center justify-between px-2.5 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-cyan-400/90 blur-[0.5px]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#111] border border-slate-800" />
            </div>

            <div className="flex items-center gap-1.5 text-slate-200">
              <Wifi className="h-3 w-3" />
              <span className="text-[10px] font-bold font-mono">5G</span>
              <Battery className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>

          {/* KBC Mobile Brand Header & Account Balances */}
          <div className="relative z-20 bg-gradient-to-b from-[#00254a] via-[#002d5a] to-[#061527] px-4 pt-2 pb-3.5 border-b border-cyan-500/20 shadow-md">
            
            {/* Top row: Brand & Profile */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00a2e0] text-white font-extrabold text-xs shadow-md border border-white/20">
                  KBC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white tracking-tight">KBC Mobile</h3>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[11px] text-cyan-200 font-medium">
                    {client?.name || "Thomas De Smet"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  className="relative p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#002d5a]" />
                </button>
              </div>
            </div>

            {/* Account Card (KBC Plus Account) */}
            <div className="rounded-2xl bg-gradient-to-r from-white/12 to-white/5 p-3 backdrop-blur-md border border-white/15 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-cyan-200 font-semibold tracking-wide flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-cyan-300" />
                  KBC Plus Account
                </span>
                <span className="text-slate-300 text-[10px] font-mono">BE71 •••• 9012</span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  {formatCurrency((client?.monthly_income || 2650) * 0.85)}
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-300 block uppercase font-medium">Savings</span>
                  <span className="text-xs font-bold text-emerald-300">
                    {formatCurrency(client?.savings_balance || 34500)}
                  </span>
                </div>
              </div>

              {/* Quick Action Pills */}
              <div className="pt-1 grid grid-cols-3 gap-1.5 border-t border-white/10 text-[10px] font-semibold text-cyan-100">
                <button type="button" className="py-1 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center gap-1">
                  <Send className="h-2.5 w-2.5" />
                  <span>Transfer</span>
                </button>
                <button type="button" className="py-1 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center gap-1">
                  <QrCode className="h-2.5 w-2.5" />
                  <span>Pay</span>
                </button>
                <button type="button" className="py-1 rounded-lg bg-cyan-500/25 text-cyan-200 hover:bg-cyan-500/35 flex items-center justify-center gap-1 border border-cyan-400/30">
                  <Sparkles className="h-2.5 w-2.5 text-cyan-300" />
                  <span>Ask Kate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Feed Area */}
          <div className="flex-1 overflow-y-auto phone-scroll px-3.5 py-3 space-y-3">
            
            {/* Proactive Kate Bubble */}
            <KateWidget
              kateMessage={experience?.kate_message}
              whyAmISeeingThis={experience?.why_am_i_seeing_this}
              detectedSignals={prediction?.detected_signals}
              stage={prediction?.stage}
              detectedIntent={prediction?.detected_intent}
              onOpenTransparency={onOpenTransparency}
            />

            {/* Section Header */}
            <div className="flex items-center justify-between pt-1 px-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Action Feed
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Bank • Insurance • Partner
              </span>
            </div>

            {/* Cross-Domain Action Cards */}
            <div className="space-y-2.5 pb-2">
              <AnimatePresence mode="popLayout">
                {recommendedActions.map((action, index) => {
                  const theme = getDomainTheme(action.domain);
                  return (
                    <motion.div
                      key={`${action.domain}-${action.title}`}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className={`group rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-3.5 border ${theme.border} ${theme.glow} shadow-md transition-all cursor-pointer`}
                      onClick={() => onActionClick && onActionClick(action)}
                    >
                      {/* Card Header (Domain badge + Icon) */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-slate-800 border border-slate-700/80">
                            {theme.icon}
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}>
                            {theme.label}
                          </span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>

                      {/* Card Body */}
                      <h5 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                        {action.title}
                      </h5>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-300 font-normal">
                        {action.description}
                      </p>

                      {/* CTA Link */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-cyan-300 group-hover:text-cyan-200 group-hover:underline">
                          {action.cta || "View Details"}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom App Navigation Bar */}
          <div className="relative z-30 border-t border-slate-800/90 bg-[#040b15]/95 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'home' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'accounts' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Accounts</span>
              </button>

              {/* Glowing Center Kate Button */}
              <button
                type="button"
                onClick={() => setActiveTab('kate')}
                className="flex flex-col items-center gap-0.5 -mt-3.5 transition-transform hover:scale-105"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#00a2e0] to-[#38bdf8] flex items-center justify-center text-white shadow-glow-cyan border-2 border-[#040b15]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-cyan-300">Kate</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'menu' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Menu className="h-4 w-4" />
                <span>Menu</span>
              </button>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="mt-1.5 flex justify-center">
              <div className="h-1 w-28 rounded-full bg-slate-600/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
