import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  MapPin, 
  Store, 
  Compass, 
  Building2,
  ChevronRight
} from 'lucide-react';
import { AppModule, StudentLevel } from '../types';

interface RightUtilitiesPanelProps {
  selectedLevel: StudentLevel | 'All';
  onSelectLevel: (lvl: StudentLevel | 'All') => void;
  onNavigateModule: (mod: AppModule) => void;
  onSelectLandmark?: (landmarkId: string) => void;
}

export const RightUtilitiesPanel = ({
  selectedLevel,
  onSelectLevel,
  onNavigateModule,
}: RightUtilitiesPanelProps) => {
  const levelsList: Array<StudentLevel | 'All'> = ['All', '100L', '200L', '300L', '400L', '500L'];

  return (
    <aside className="hidden xl:flex w-80 flex-col gap-5 border-l border-neutral-800/80 bg-neutral-950/70 p-4 shrink-0 overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]">
      
      {/* 1. Academic Level Quick Filter */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <span>Academic Level View</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {selectedLevel === 'All' ? 'Global' : selectedLevel}
          </span>
        </div>

        <p className="text-[11px] text-neutral-400">
          Filter posts and updates tailored to your class year:
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {levelsList.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <motion.button
                key={lvl}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`rounded-lg py-1.5 px-2 text-xs font-bold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {lvl}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Campus Quick Nav Links */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-amber-400" />
          <span>Campus Hubs & Shortcuts</span>
        </span>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onNavigateModule('marketplace')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-white group-hover:text-amber-400">Student Marketplace</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('academics')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-white group-hover:text-blue-400">Faculties & Departments</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('map')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-white group-hover:text-emerald-400">Campus Spatial Guide</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
          </button>
        </div>
      </div>

    </aside>
  );
};
