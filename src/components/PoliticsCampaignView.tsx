import React from 'react';
import { Vote, Clock } from 'lucide-react';

interface PoliticsCampaignViewProps {
  onRequireAuth?: () => void;
  onShowToast?: (msg: string) => void;
}

export const PoliticsCampaignView: React.FC<PoliticsCampaignViewProps> = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 sm:p-12 text-center backdrop-blur-md space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Vote className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Coming soon</span>
          </div>
          <h2 className="text-xl font-bold text-white">SUG Elections & Student Votes</h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Official candidate rosters, presidential manifestos, and student sentiment polls will go live once the UNECOM election window officially opens.
          </p>
        </div>
      </div>
    </div>
  );
};
