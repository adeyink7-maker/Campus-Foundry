import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppUser, StudentBusiness, CampusPost, BusinessBlueprint } from '../types';
import { UserProfileView } from './UserProfileView';
import { TRADER_BLUEPRINTS } from '../data/mockData';
import { 
  LogIn, 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Award, 
  TrendingUp, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

// Reusable SVG Circular Progress Ring component
interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
  showText?: boolean;
  textSizeClass?: string;
  sublabel?: string;
  children?: React.ReactNode;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 76,
  strokeWidth = 6,
  colorClass,
  trackClass = 'text-neutral-800',
  showText = true,
  textSizeClass = 'text-xs font-black',
  sublabel,
  children,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Dynamic color if not explicitly provided
  const resolvedColor = colorClass || (
    clamped === 100
      ? 'text-emerald-400'
      : clamped >= 75
      ? 'text-amber-400'
      : clamped >= 50
      ? 'text-yellow-400'
      : clamped > 0
      ? 'text-sky-400'
      : 'text-neutral-600'
  );

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClass}
          fill="transparent"
        />
        {/* Foreground progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${resolvedColor} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>
      {/* Centered label or content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-1">
        {children ? (
          children
        ) : showText ? (
          <>
            <span className={`text-white leading-none ${textSizeClass}`}>
              {clamped}%
            </span>
            {sublabel && (
              <span className="text-[9px] text-neutral-400 font-medium leading-tight mt-0.5">
                {sublabel}
              </span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

interface StudentDashboardProps {
  businesses: StudentBusiness[];
  posts?: CampusPost[];
  targetUser?: AppUser | null;
  onClearTargetUser?: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenCreateBusiness: () => void;
  onSelectBusiness: (business: StudentBusiness) => void;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
  onClaimBusiness?: (bizId: string) => void;
  onDeleteBusiness?: (bizId: string) => void;
  onDeletePost?: (postId: string) => void;
  onOpenBecomeTrader?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  businesses,
  posts = [],
  targetUser,
  onClearTargetUser,
  onOpenAuth,
  onOpenCreateBusiness,
  onSelectBusiness,
  onOpenTraderProfile,
}) => {
  const { currentUser } = useAuth();
  const activeUser = targetUser || currentUser;

  // Selected blueprint for milestone tracking
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(
    TRADER_BLUEPRINTS[0]?.id || 'hostel-baking-blueprint'
  );

  // Milestone completion map: { [blueprintId]: number[] (array of completed step indices) }
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, number[]>>(() => {
    if (!activeUser) return {};
    try {
      const saved = localStorage.getItem(`unilorin_blueprint_milestones_${activeUser.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback if localStorage parsing fails
    }
    // Default initial progress for realistic showcase (e.g. 2 steps of first blueprint done)
    return {
      'hostel-baking-blueprint': [0, 1],
      'dorm-barber-blueprint': [0],
      'gadget-tech-plug-blueprint': [0, 1, 2],
      'vintage-thrift-plug-blueprint': [0],
    };
  });

  // Sync to localStorage
  useEffect(() => {
    if (activeUser?.id && Object.keys(completedStepsMap).length > 0) {
      try {
        localStorage.setItem(
          `unilorin_blueprint_milestones_${activeUser.id}`,
          JSON.stringify(completedStepsMap)
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [completedStepsMap, activeUser?.id]);

  if (!activeUser) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-md">
          <LogIn className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign In to Access Student Dashboard</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
            Track your venture blueprint milestones with interactive progress rings, manage campus trades & view your social portfolio.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuth('signin')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const userBusinesses = businesses.filter((b) => {
    if (b.ownerId && b.ownerId === activeUser.id) return true;
    if (b.ownerEmail && activeUser.email && b.ownerEmail.toLowerCase().trim() === activeUser.email.toLowerCase().trim()) return true;
    return false;
  });

  const userPosts = posts.filter((p) => p.authorId === activeUser.id);
  const isViewingOther = Boolean(targetUser && currentUser && targetUser.id !== currentUser.id);

  // Active Blueprint Data
  const activeBlueprint: BusinessBlueprint =
    TRADER_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) || TRADER_BLUEPRINTS[0];

  const currentCompletedIndices = completedStepsMap[activeBlueprint.id] || [];
  const currentTotalSteps = activeBlueprint.steps.length || 1;
  const currentProgressPercent = Math.round(
    (currentCompletedIndices.length / currentTotalSteps) * 100
  );

  // Total Milestones across all available blueprints
  let totalAllMilestones = 0;
  let totalCompletedAllMilestones = 0;
  TRADER_BLUEPRINTS.forEach((bp) => {
    totalAllMilestones += bp.steps.length;
    const completedForBp = completedStepsMap[bp.id] || [];
    totalCompletedAllMilestones += completedForBp.length;
  });
  const overallMilestonesPercent = totalAllMilestones > 0
    ? Math.round((totalCompletedAllMilestones / totalAllMilestones) * 100)
    : 0;

  // Toggle milestone step completion
  const handleToggleStep = (stepIdx: number) => {
    setCompletedStepsMap((prev) => {
      const currentList = prev[activeBlueprint.id] || [];
      const isDone = currentList.includes(stepIdx);
      const updatedList = isDone
        ? currentList.filter((idx) => idx !== stepIdx)
        : [...currentList, stepIdx].sort((a, b) => a - b);

      return {
        ...prev,
        [activeBlueprint.id]: updatedList,
      };
    });
  };

  const handleResetBlueprintMilestones = () => {
    setCompletedStepsMap((prev) => ({
      ...prev,
      [activeBlueprint.id]: [],
    }));
  };

  const handleCompleteAllMilestones = () => {
    setCompletedStepsMap((prev) => ({
      ...prev,
      [activeBlueprint.id]: activeBlueprint.steps.map((_, i) => i),
    }));
  };

  // Milestone phases for student ventures
  const milestonePhases = [
    {
      id: 'phase-1',
      title: 'Market Viability',
      desc: 'Hostel demand check & pricing',
      percent: currentCompletedIndices.includes(0) ? 100 : 0,
    },
    {
      id: 'phase-2',
      title: 'Sourcing & Prep',
      desc: 'Raw materials & equipment ready',
      percent: currentCompletedIndices.includes(1) ? 100 : 0,
    },
    {
      id: 'phase-3',
      title: 'Packaging & Orders',
      desc: 'Branded bags & WhatsApp funnel',
      percent: currentCompletedIndices.includes(2) ? 100 : 0,
    },
    {
      id: 'phase-4',
      title: 'Hostel Scale',
      desc: 'Door deliveries & recurring buyers',
      percent: currentCompletedIndices.includes(3) ? 100 : 0,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-4 space-y-6">
      {/* Top Back Header when viewing another account */}
      {isViewingOther && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <button
            type="button"
            onClick={onClearTargetUser}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400" />
            <span>Back to Campus Feed</span>
          </button>

          <span className="text-xs text-neutral-400 font-mono">
            Viewing Profile: <strong className="text-white">{activeUser.fullName}</strong>
          </span>
        </div>
      )}

      {/* VENTURE BLUEPRINT MILESTONES DASHBOARD SECTION */}
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Venture Blueprint Roadmap</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Campus Trade Milestones</span>
              <Award className="h-5 w-5 text-amber-400 shrink-0" />
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
              Visualize and check off operational milestones to transform campus playbooks into high-performing hostel businesses.
            </p>
          </div>

          {/* Overall Completion Ring & Quick Stats */}
          <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 sm:px-4 sm:py-3 shrink-0 self-start lg:self-auto">
            <CircularProgressRing
              progress={overallMilestonesPercent}
              size={64}
              strokeWidth={6}
              textSizeClass="text-xs font-black"
              sublabel="Overall"
            />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                All Playbooks Progress
              </span>
              <span className="text-sm font-extrabold text-white">
                {totalCompletedAllMilestones} of {totalAllMilestones} Steps
              </span>
              <span className="text-[11px] text-amber-400 font-medium">
                {overallMilestonesPercent === 100
                  ? 'All Playbooks Fully Mastered!'
                  : overallMilestonesPercent >= 50
                  ? 'Venture In Rapid Acceleration'
                  : 'Early Execution Phase'}
              </span>
            </div>
          </div>
        </div>

        {/* Blueprint Selector Tabs with Mini Progress Rings */}
        <div className="mt-5 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Select Active Venture Blueprint:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TRADER_BLUEPRINTS.map((bp) => {
              const isSelected = bp.id === selectedBlueprintId;
              const bpCompleted = completedStepsMap[bp.id] || [];
              const bpPercent = Math.round((bpCompleted.length / bp.steps.length) * 100);

              return (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => setSelectedBlueprintId(bp.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/50 hover:border-neutral-700'
                  }`}
                >
                  <div className="pr-2 min-w-0">
                    <span className="text-[10px] text-amber-400 font-semibold block truncate">
                      {bp.category}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{bp.title}</h4>
                    <span className="text-[10px] text-neutral-400">
                      {bpCompleted.length}/{bp.steps.length} milestones
                    </span>
                  </div>

                  {/* Blueprint Mini Circular Progress Ring */}
                  <CircularProgressRing
                    progress={bpPercent}
                    size={42}
                    strokeWidth={4}
                    textSizeClass="text-[10px] font-extrabold"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Blueprint Detail Banner */}
        <div className="mt-6 rounded-2xl bg-neutral-950 border border-neutral-800/90 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left: Hero Progress Ring & Blueprint Identity */}
            <div className="flex items-center gap-5">
              <CircularProgressRing
                progress={currentProgressPercent}
                size={96}
                strokeWidth={8}
                textSizeClass="text-base font-black"
                sublabel="Completed"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {activeBlueprint.difficulty} Level
                  </span>
                  <span className="text-xs text-neutral-400">• {activeBlueprint.category}</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {activeBlueprint.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 max-w-md">
                  {activeBlueprint.summary}
                </p>
              </div>
            </div>

            {/* Right: Financial Projections & Action Controls */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-800">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  Est. Monthly Return
                </span>
                <span className="text-sm font-mono font-black text-emerald-400">
                  {activeBlueprint.potentialEarnings}
                </span>
                <span className="text-[10px] text-neutral-400 block font-mono">
                  Capital: {activeBlueprint.startupCapital}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetBlueprintMilestones}
                  className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  title="Reset steps for this blueprint"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCompleteAllMilestones}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark All Done</span>
                </button>
              </div>
            </div>

          </div>

          {/* Phase Rings Breakdown */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Milestone Phase Indicators</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {milestonePhases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800/80 flex items-center gap-3"
                >
                  <CircularProgressRing
                    progress={phase.percent}
                    size={40}
                    strokeWidth={4}
                    textSizeClass="text-[9px] font-extrabold"
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">
                      Phase {idx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">{phase.title}</h5>
                    <span className="text-[10px] text-neutral-400 truncate block">
                      {phase.percent === 100 ? 'Achieved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Milestone Step Checklist */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Operational Milestone Checklist ({currentCompletedIndices.length}/{currentTotalSteps})</span>
              </h4>
              <span className="text-[11px] text-amber-400 font-medium">
                Click any milestone to mark as completed
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {activeBlueprint.steps.map((step, idx) => {
                const isCompleted = currentCompletedIndices.includes(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleStep(idx)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-md">
                          <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-neutral-600 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                        isCompleted ? 'text-neutral-200 line-through decoration-emerald-500/60' : 'text-neutral-200'
                      }`}>
                        {step}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {isCompleted ? 'Done' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips & Equipment Footnote */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80 text-xs text-neutral-400">
            <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                Founder Playbook Tip:
              </span>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {activeBlueprint.tips[0] || 'Deliver right to room doors—convenience is why students will choose you.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Required Toolkit:
              </span>
              <div className="flex flex-wrap gap-1">
                {activeBlueprint.equipmentNeeded.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-neutral-950 text-[10px] text-neutral-300 border border-neutral-800"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* USER PROFILE & SOCIAL PORTFOLIO */}
      <UserProfileView
        user={activeUser}
        userPosts={userPosts}
        userSnaps={[]}
        userBusinesses={userBusinesses}
        onOpenCreateBusiness={onOpenCreateBusiness}
        onSelectBusiness={onSelectBusiness}
        onOpenTraderProfile={onOpenTraderProfile}
      />
    </div>
  );
};

export default StudentDashboard;

