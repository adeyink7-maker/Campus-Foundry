import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  GraduationCap, 
  MapPin, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  Layers, 
  Users, 
  ChevronLeft,
  RotateCcw,
  Sparkles,
  School,
  Home
} from 'lucide-react';
import { 
  UNILORIN_FACULTIES, 
  ALL_UNILORIN_HOSTELS_META, 
  HostelInfo,
  FacultyDepartmentMapping 
} from '../data/mockData';

interface CampusDirectoryViewProps {
  onSelectDepartmentFilter?: (dept: string, faculty: string) => void;
  onSelectHostelFilter?: (hostelName: string) => void;
  onOpenCreateBusiness?: () => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const CampusDirectoryView = ({
  onSelectDepartmentFilter,
  onSelectHostelFilter,
  onOpenCreateBusiness,
}: CampusDirectoryViewProps) => {
  // Main Section Toggle: 'faculties' | 'hostels'
  const [activeSection, setActiveSection] = useState<'faculties' | 'hostels'>('faculties');

  // ==========================================
  // SECTION 1: FACULTIES & DEPARTMENTS STATE
  // ==========================================
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Selected faculty object
  const currentFacultyObj = useMemo(() => {
    if (!selectedFaculty) return null;
    return UNILORIN_FACULTIES.find((f) => f.faculty === selectedFaculty) || null;
  }, [selectedFaculty]);

  // Departments for chosen faculty
  const availableDepartments = useMemo(() => {
    return currentFacultyObj ? currentFacultyObj.departments : [];
  }, [currentFacultyObj]);

  // Overhead search results across all faculties and departments
  const searchResultsFaculties = useMemo(() => {
    if (!facultySearch.trim()) return null;
    const q = facultySearch.toLowerCase();
    const matches: { faculty: FacultyDepartmentMapping; matchingDepts: string[] }[] = [];

    UNILORIN_FACULTIES.forEach((fac) => {
      const facMatch = fac.faculty.toLowerCase().includes(q) || fac.code.toLowerCase().includes(q);
      const matchingDepts = fac.departments.filter((d) => d.toLowerCase().includes(q));

      if (facMatch || matchingDepts.length > 0) {
        matches.push({
          faculty: fac,
          matchingDepts: matchingDepts.length > 0 ? matchingDepts : fac.departments,
        });
      }
    });

    return matches;
  }, [facultySearch]);

  // ==========================================
  // SECTION 2: HOSTELS NAVIGATION STATE
  // ==========================================
  const [hostelSearch, setHostelSearch] = useState('');

  // Step 1: Campus Location Selection ('main' | 'mini' | 'offcampus' | null)
  const [campusLocation, setCampusLocation] = useState<'main' | 'mini' | 'offcampus' | null>(null);

  // Step 2: Ownership Type Selection ('school' | 'private' | null)
  const [ownershipType, setOwnershipType] = useState<'school' | 'private' | null>(null);

  // Step 3: Gender Selection ('male' | 'female') - Explicit, no "All/Any" default
  const [genderChoice, setGenderChoice] = useState<'male' | 'female'>('male');

  // Step 4: Final Specific Hostel Selected
  const [chosenHostel, setChosenHostel] = useState<string>('');

  // Hostels matching current exact drill-down branch
  const drilledHostels = useMemo(() => {
    if (!campusLocation) return [];

    return ALL_UNILORIN_HOSTELS_META.filter((h) => {
      // Step 1: Campus match
      if (h.campus !== campusLocation) return false;

      // Step 2: Ownership match (for main and mini campuses)
      if (campusLocation === 'main' || campusLocation === 'mini') {
        if (ownershipType) {
          if (ownershipType === 'school' && h.category !== 'school') return false;
          if (ownershipType === 'private' && h.category !== 'private') return false;
        }
      }

      // Step 3: Gender match (Explicit: male vs female)
      if (genderChoice === 'male') {
        if (h.gender !== 'male' && h.gender !== 'any') return false;
      } else if (genderChoice === 'female') {
        if (h.gender !== 'female' && h.gender !== 'any') return false;
      }

      return true;
    });
  }, [campusLocation, ownershipType, genderChoice]);

  // Overhead search results across all hostels
  const searchResultsHostels = useMemo(() => {
    if (!hostelSearch.trim()) return null;
    const q = hostelSearch.toLowerCase();
    return ALL_UNILORIN_HOSTELS_META.filter((h) =>
      h.name.toLowerCase().includes(q) || h.groupName.toLowerCase().includes(q)
    );
  }, [hostelSearch]);

  const handleSelectHostelFromSearch = (hostel: HostelInfo) => {
    setCampusLocation(hostel.campus);
    setOwnershipType(hostel.category === 'school' ? 'school' : 'private');
    setGenderChoice(hostel.gender === 'female' ? 'female' : 'male');
    setChosenHostel(hostel.name);
    setHostelSearch('');
  };

  const campusCards = [
    {
      id: 'main',
      title: 'Main Campus (PS)',
      subtitle: 'Permanent Site Hostels',
      description: 'Public student halls (Village I–V, PG) and on-campus private residences.',
      icon: School,
      color: 'emerald',
      badge: 'Main Hub',
    },
    {
      id: 'mini',
      title: 'Mini Campus',
      subtitle: 'Old Campus & Sabo Oke',
      description: 'College of Health Sciences (COHS) and Sabo Oke Veterinary halls.',
      icon: Building2,
      color: 'blue',
      badge: 'Satellite',
    },
    {
      id: 'offcampus',
      title: 'Off Campus',
      subtitle: 'Tanke & University Road',
      description: 'Tipper Garage, Mark Grounds, Oke-Odo, Sanrab, Chapart & Pipeline hubs.',
      icon: Home,
      color: 'purple',
      badge: 'Student Hubs',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Building2 className="h-3.5 w-3.5" />
            <span>UNILORIN Structured Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic & Hostel Multi-Step Explorer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Progressive drill-down navigation featuring app-launch container expansion transitions for all 16 faculties and living halls.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('faculties')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSection === 'faculties'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Faculties & Departments</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeSection === 'faculties' ? 'bg-neutral-950 text-amber-300' : 'bg-neutral-800 text-neutral-400'
            }`}>
              16
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('hostels')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeSection === 'hostels'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Hostels Directory</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeSection === 'hostels' ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {ALL_UNILORIN_HOSTELS_META.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FACULTIES & DEPARTMENTS (Container Transform Expansion)         */}
      {/* ========================================================================= */}
      {activeSection === 'faculties' && (
        <div className="mt-8 space-y-6">
          
          {/* Top Search Bar */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                <span>Overhead Search (16 Faculties & 115+ Departments)</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Direct keyword search across all disciplines
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search any faculty or department (e.g. Computer Science, Anatomy, Civil, Law, Economics)..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none transition-colors shadow-inner"
              />
              {facultySearch && (
                <button
                  type="button"
                  onClick={() => setFacultySearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Display if Query is Active */}
          {searchResultsFaculties ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Direct Search Results ({searchResultsFaculties.length} faculties matched)
                </h3>
                <button
                  type="button"
                  onClick={() => setFacultySearch('')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Clear search and return to drill-down
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResultsFaculties.map(({ faculty, matchingDepts }) => (
                  <div
                    key={faculty.code}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        {faculty.code}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {faculty.departments.length} departments
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">{faculty.faculty}</h4>

                    <div className="space-y-1.5 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                        Matching Departments:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingDepts.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              setSelectedFaculty(faculty.faculty);
                              setSelectedDepartment(dept);
                              setFacultySearch('');
                              if (onSelectDepartmentFilter) {
                                onSelectDepartmentFilter(dept, faculty.faculty);
                              }
                            }}
                            className="rounded-lg bg-neutral-950 hover:bg-amber-500/20 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/40 px-2.5 py-1 text-xs text-neutral-300 transition-all text-left"
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Progressive Drill-Down with Shared Element / Container Transform */
            <AnimatePresence mode="wait">
              {!selectedFaculty ? (
                /* STEP 1: Faculty Selection Grid (16 Interactive Cards) */
                <motion.div
                  key="faculty-grid"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-neutral-950">
                        1
                      </span>
                      <span>Step 1: Tap a Faculty Card to Open</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">16 Accredited Faculties</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {UNILORIN_FACULTIES.map((fac, idx) => (
                      <motion.button
                        key={fac.code}
                        layoutId={`faculty-container-${fac.code}`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedFaculty(fac.faculty);
                          setSelectedDepartment('');
                        }}
                        transition={springTransition}
                        className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-left transition-colors hover:border-amber-500/60 hover:bg-neutral-900 flex flex-col justify-between overflow-hidden shadow-lg"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 pointer-events-none transition-all" />

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              {fac.code}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              #{idx + 1}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                            {fac.faculty}
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-neutral-400">
                            {fac.departments.length} Departments
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                            <span>Open</span>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* STEP 2: Expanded Faculty Panel (Container Transform from tapped card) */
                <motion.div
                  key={`faculty-expanded-${currentFacultyObj?.code}`}
                  layoutId={`faculty-container-${currentFacultyObj?.code}`}
                  transition={springTransition}
                  className="rounded-3xl border border-amber-500/40 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6"
                >
                  {/* Expanded Header with Back Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setSelectedFaculty('');
                          setSelectedDepartment('');
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors"
                        title="Back to all faculties"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </motion.button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300">
                            {currentFacultyObj?.code}
                          </span>
                          <span className="text-xs font-mono text-neutral-400">
                            {availableDepartments.length} Departments Enrolled
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                          {currentFacultyObj?.faculty}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFaculty('');
                        setSelectedDepartment('');
                      }}
                      className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                      <span>Change Faculty</span>
                    </button>
                  </div>

                  {/* Step 2 Department Selection (Progressive Disclosure) */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-neutral-950">
                          2
                        </span>
                        <span>Step 2: Choose Department under {currentFacultyObj?.code}</span>
                      </span>

                      <span className="text-xs text-neutral-400 font-mono">
                        Select a department to view student trades
                      </span>
                    </div>

                    {/* Department Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableDepartments.map((dept, dIdx) => (
                        <motion.button
                          key={dept}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedDepartment(dept);
                            if (onSelectDepartmentFilter && currentFacultyObj) {
                              onSelectDepartmentFilter(dept, currentFacultyObj.faculty);
                            }
                          }}
                          className={`rounded-xl border p-4 text-left flex flex-col justify-between transition-all ${
                            selectedDepartment === dept
                              ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-md'
                              : 'bg-neutral-950/80 border-neutral-800 hover:border-emerald-500/40 text-neutral-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1.5">
                              <span>DEPT #{dIdx + 1}</span>
                              <span className="text-emerald-400">{currentFacultyObj?.code}</span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold leading-snug text-white">
                              {dept}
                            </h4>
                          </div>

                          <div className="mt-3 pt-2 border-t border-neutral-850 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-400">
                              Browse Student Stores
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: HOSTELS NAVIGATION (Container Transform Expansion)              */}
      {/* ========================================================================= */}
      {activeSection === 'hostels' && (
        <div className="mt-8 space-y-6">
          
          {/* Top Search Bar */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                <span>Overhead Search (All UNILORIN Hostels)</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Direct keyword search across all residences
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                value={hostelSearch}
                onChange={(e) => setHostelSearch(e.target.value)}
                placeholder="Search hostel name (e.g. Sanusi, Bethany, Village I, Arafims, Hawa, Trunil, Zapel)..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-none transition-colors shadow-inner"
              />
              {hostelSearch && (
                <button
                  type="button"
                  onClick={() => setHostelSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Display if Query is Active */}
          {searchResultsHostels ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Search Results ({searchResultsHostels.length} hostels matched)
                </h3>
                <button
                  type="button"
                  onClick={() => setHostelSearch('')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Clear search and return to drill-down
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResultsHostels.map((hostel) => (
                  <div
                    key={hostel.name}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-neutral-900 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                          {hostel.campus} Campus • {hostel.category}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          hostel.gender === 'male' ? 'bg-blue-950 text-blue-300 border border-blue-800' : hostel.gender === 'female' ? 'bg-pink-950 text-pink-300 border border-pink-800' : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {hostel.gender}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">{hostel.name}</h4>
                      <p className="text-xs text-neutral-400 mt-1">{hostel.groupName}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSelectHostelFromSearch(hostel)}
                        className="text-xs font-bold text-emerald-400 hover:underline"
                      >
                        Select in Drill-Down
                      </button>
                      {onSelectHostelFilter && (
                        <button
                          type="button"
                          onClick={() => onSelectHostelFilter(hostel.name)}
                          className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white"
                        >
                          <span>Browse Stores</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Multi-Step Drilling Navigation with Container Transform */
            <AnimatePresence mode="wait">
              {!campusLocation ? (
                /* STEP 1: Campus Location Choice Cards (Main, Mini, Off Campus) */
                <motion.div
                  key="campus-grid"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-neutral-950">
                        1
                      </span>
                      <span>Step 1: Tap Campus Location to Expand</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">3 Academic Sectors</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {campusCards.map((loc) => {
                      const Icon = loc.icon;
                      return (
                        <motion.button
                          key={loc.id}
                          layoutId={`campus-container-${loc.id}`}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setCampusLocation(loc.id as any);
                            setOwnershipType('school');
                            setChosenHostel('');
                          }}
                          transition={springTransition}
                          className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-left transition-colors hover:border-emerald-500/60 hover:bg-neutral-900 flex flex-col justify-between overflow-hidden shadow-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              {loc.badge}
                            </span>
                            <Icon className="h-5 w-5 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {loc.title}
                            </h3>
                            <p className="text-xs text-neutral-400 font-medium mt-0.5">
                              {loc.subtitle}
                            </p>
                            <p className="text-xs text-neutral-400/80 mt-2 leading-relaxed">
                              {loc.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                            <span className="text-[11px] text-neutral-500">Tap to Drill Down</span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                              <span>Select</span>
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* STEP 2 & 3: Expanded Campus Panel (Container Transform from tapped campus card) */
                <motion.div
                  key={`campus-expanded-${campusLocation}`}
                  layoutId={`campus-container-${campusLocation}`}
                  transition={springTransition}
                  className="rounded-3xl border border-emerald-500/40 bg-neutral-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6"
                >
                  {/* Expanded Campus Header with Back Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setCampusLocation(null);
                          setOwnershipType(null);
                          setChosenHostel('');
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors"
                        title="Back to all campus locations"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </motion.button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 uppercase">
                            {campusLocation} Campus
                          </span>
                          <span className="text-xs font-mono text-neutral-400">
                            {drilledHostels.length} Matching Hostels
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                          {campusLocation === 'main' ? 'Main Campus (Permanent Site)' : campusLocation === 'mini' ? 'Mini Campus (COHS / Sabo Oke)' : 'Off Campus (Tanke & Environs)'}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCampusLocation(null);
                        setOwnershipType(null);
                        setChosenHostel('');
                      }}
                      className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Switch Location</span>
                    </button>
                  </div>

                  {/* STEP 2: Ownership Type Selection (Progressive Disclosure) */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-neutral-950">
                          2
                        </span>
                        <span>Step 2: Choose Ownership Type</span>
                      </span>
                      {ownershipType && (
                        <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                          ✓ {ownershipType === 'school' ? 'School-Owned' : 'Private'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setOwnershipType('school');
                          setChosenHostel('');
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          ownershipType === 'school'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-1 ring-emerald-400'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold">School-Owned Hostels</div>
                        <div className="text-[11px] opacity-80 mt-1">Public & University Managed Halls</div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setOwnershipType('private');
                          setChosenHostel('');
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          ownershipType === 'private'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold">Private Hostels</div>
                        <div className="text-[11px] opacity-80 mt-1">Commercial & Cooperative Residences</div>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* STEP 3: Gender & Final Hostel List (Progressive Disclosure) */}
                  {ownershipType && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.25 }}
                      className="space-y-4 pt-4 border-t border-neutral-800"
                    >
                      {/* Gender Selector: Explicit Choice (NO "All / Any" Default) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-neutral-950">
                              3
                            </span>
                            <span>Step 3: Select Gender Specification</span>
                          </span>
                          <span className="text-xs font-mono text-pink-400 font-semibold uppercase">
                            ✓ {genderChoice === 'male' ? 'Male Hostels' : 'Female Hostels'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => {
                              setGenderChoice('male');
                              setChosenHostel('');
                            }}
                            className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                              genderChoice === 'male'
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400'
                                : 'bg-neutral-950 text-blue-300/70 border-neutral-800 hover:border-neutral-700 hover:text-blue-200'
                            }`}
                          >
                            <Users className="h-4 w-4" />
                            <span>Male Hostels</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => {
                              setGenderChoice('female');
                              setChosenHostel('');
                            }}
                            className={`p-3 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                              genderChoice === 'female'
                                ? 'bg-pink-600 text-white border-pink-500 shadow-md ring-1 ring-pink-400'
                                : 'bg-neutral-950 text-pink-300/70 border-neutral-800 hover:border-neutral-700 hover:text-pink-200'
                            }`}
                          >
                            <Users className="h-4 w-4" />
                            <span>Female Hostels</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Dynamic Hostel Output */}
                      <div className="space-y-3 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>
                              Matching Hostels ({drilledHostels.length} in {campusLocation.toUpperCase()} • {ownershipType.toUpperCase()} • {genderChoice.toUpperCase()}):
                            </span>
                          </span>
                        </div>

                        {/* Hostels Grid View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {drilledHostels.map((hostel) => (
                            <motion.button
                              key={hostel.name}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setChosenHostel(hostel.name);
                                if (onSelectHostelFilter) {
                                  onSelectHostelFilter(hostel.name);
                                }
                              }}
                              className={`rounded-2xl border p-4 text-left flex flex-col justify-between transition-all ${
                                chosenHostel === hostel.name
                                  ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-md'
                                  : 'bg-neutral-950/80 border-neutral-800 hover:border-emerald-500/40 text-neutral-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                                  <span className="uppercase text-emerald-400 font-semibold">{hostel.category}</span>
                                  <span className={`uppercase font-bold ${
                                    hostel.gender === 'male' ? 'text-blue-400' : 'text-pink-400'
                                  }`}>
                                    {hostel.gender}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white">{hostel.name}</h4>
                                <p className="text-[11px] text-neutral-400 mt-1">{hostel.groupName}</p>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-neutral-850 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-emerald-400">
                                  {chosenHostel === hostel.name ? 'Active Filter' : 'Select Hostel'}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>
      )}

    </div>
  );
};
