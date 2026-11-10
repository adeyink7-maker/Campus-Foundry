import { BookOpen, DollarSign, CheckCircle2, ArrowRight, Sparkles, TrendingUp, ShieldAlert } from 'lucide-react';
import { TRADER_BLUEPRINTS } from '../data/mockData';
import { BusinessBlueprint } from '../types';

interface TraderBlueprintsViewProps {
  onApplyBlueprint: (blueprint: BusinessBlueprint) => void;
}

export const TraderBlueprintsView = ({ onApplyBlueprint }: TraderBlueprintsViewProps) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Student Entrepreneurship Playbooks</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Campus Trade Launch Blueprints
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Tested operational models designed specifically for UNILORIN hostels. Learn realistic startup capital requirements, equipment checklists, and launch steps.
        </p>
      </div>

      {/* Blueprints Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {TRADER_BLUEPRINTS.map((bp) => (
          <div
            key={bp.id}
            className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 transition-all duration-200 hover:border-amber-500/50 hover:bg-neutral-900"
          >
            <div>
              {/* Category & Difficulty */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                  {bp.category}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Level: <strong className="text-white">{bp.difficulty}</strong>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                {bp.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
                {bp.summary}
              </p>

              {/* Financial Benchmarks */}
              <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                    Initial Capital Needed
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    {bp.startupCapital}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                    Target Monthly Return
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {bp.potentialEarnings}
                  </span>
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 block">
                  Action Steps:
                </span>
                {bp.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Equipment Checklist */}
              <div className="mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block mb-1">
                  Basic Equipment:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bp.equipmentNeeded.map((eq, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-400 border border-neutral-800"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Ready to start this in your hall?
              </span>
              <button
                onClick={() => onApplyBlueprint(bp)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 transition-colors shadow-md shadow-amber-950/30"
              >
                <span>Launch This Trade</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
