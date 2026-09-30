import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, ChevronRight, Zap } from 'lucide-react';

export default function KateWidget({ 
  kateMessage, 
  whyAmISeeingThis, 
  detectedSignals, 
  stage, 
  detectedIntent, 
  onOpenTransparency 
}) {
  return (
    <div className="relative">
      {/* Kate Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#023366] via-[#002244] to-[#00172e] p-4 text-white border border-[#00a2e0]/40 shadow-glow-cyan"
      >
        {/* Subtle decorative glow behind avatar */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-blue-500/10 blur-xl" />

        <div className="relative z-10 flex items-start gap-3.5">
          {/* Kate Glowing Avatar */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="kate-avatar-glow flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#00a2e0] via-[#00d2ff] to-[#38bdf8] text-white shadow-lg">
              <Sparkles className="h-5 w-5 text-white drop-shadow-sm" />
            </div>
            {/* Online Green Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#002244]" />
            </span>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wide text-cyan-300">
                  Kate
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  • KBC Assistant
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 font-mono font-medium border border-cyan-400/30">
                PROACTIVE
              </span>
            </div>

            {/* Dynamic message */}
            <p className="text-xs leading-relaxed text-slate-100 font-normal">
              {kateMessage || "Hello! I'm monitoring your financial signals in real time to offer proactive guidance."}
            </p>

            {/* Why Am I Seeing This? Link */}
            <div className="pt-0.5 flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenTransparency}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-white transition-colors py-1 group cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="underline underline-offset-2">Why am I seeing this?</span>
              </button>
              
              <span className="text-[10px] text-slate-400 font-mono">
                Explainable AI
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
