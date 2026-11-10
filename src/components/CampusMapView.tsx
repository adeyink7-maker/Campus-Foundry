import { useState } from 'react';
import { 
  MapPin, 
  Building2, 
  Search, 
  Compass, 
  Clock,
  Navigation
} from 'lucide-react';
import { CampusLandmark } from '../types';
import { CAMPUS_LANDMARKS } from '../data/socialMockData';

export const CampusMapView = () => {
  const [landmarks] = useState<CampusLandmark[]>(CAMPUS_LANDMARKS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState<CampusLandmark | null>(null);

  const categories = [
    'All',
    'Academic Complex',
    'Administrative',
    'Hostels',
    'Food & Amenities',
  ];

  const zones = ['All', 'Permanent Site', 'Tanke Off-Campus', 'Mini Campus'];

  const filteredLandmarks = landmarks.filter((lm) => {
    if (activeCategory !== 'All' && lm.category !== activeCategory) return false;
    if (selectedZone !== 'All' && lm.zone !== selectedZone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lm.name.toLowerCase().includes(q);
      const matchShort = lm.shortName.toLowerCase().includes(q);
      const matchDesc = lm.description.toLowerCase().includes(q);
      if (!matchName && !matchShort && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Map Top Hero Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-neutral-950 p-5 sm:p-6 backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>UNILORIN Spatial Guide</span>
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Permanent Site & Tanke
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Campus Landmarks & Key Destinations
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
            Navigate between CBT Centers, faculty complexes, and residential halls across UNILORIN permanent site and surrounding student hubs.
          </p>
        </div>
      </div>

      {/* 2. Interactive Schematic Campus Corridor */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              UNILORIN Campus Corridor
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Main Axis: University Gate ➔ Senate ➔ Hostels ➔ Stadium
          </span>
        </div>

        {/* Visual Map Canvas Grid */}
        <div className="relative w-full rounded-2xl bg-neutral-950 border border-neutral-800 p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {landmarks.map((lm) => (
              <button
                key={lm.id}
                type="button"
                onClick={() => setSelectedLandmark(lm)}
                className={`rounded-xl p-3 text-left transition-all cursor-pointer border ${
                  selectedLandmark?.id === lm.id
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/40'
                    : 'border-neutral-800 bg-neutral-900/70 hover:border-neutral-700 hover:bg-neutral-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="rounded-md bg-neutral-800 text-neutral-300 px-1.5 py-0.5 text-[9px] font-mono">
                    {lm.category}
                  </span>
                  <MapPin className="h-3 w-3 text-amber-400" />
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {lm.shortName}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                  Near: {lm.busStopNear}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Detailed Landmark Cards Grid (Stock Photos Removed) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landmarks e.g. CBT..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLandmarks.map((lm) => (
            <div
              key={lm.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-md flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase">
                    {lm.category}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {lm.zone}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{lm.name}</h4>
                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2 mt-1">
                  {lm.description}
                </p>

                <div className="space-y-1 text-xs text-neutral-400 pt-3 font-mono border-t border-neutral-800/80 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lm.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Bus Stop: {lm.busStopNear}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                  Key Facilities & Uses:
                </span>
                <div className="flex flex-wrap gap-1">
                  {lm.popularActivities.map((act, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-neutral-950 px-1.5 py-0.5 text-[9px] text-neutral-300 border border-neutral-800"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
