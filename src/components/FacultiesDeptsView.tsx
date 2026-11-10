import { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  Layers, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Search
} from 'lucide-react';
import { StudentLevel } from '../types';
import { UNILORIN_FACULTIES } from '../data/mockData';
import { FacultyDepartmentSelector } from './FacultyDepartmentSelector';

interface FacultiesDeptsViewProps {
  selectedLevel: StudentLevel | 'All';
  onSelectLevel: (lvl: StudentLevel | 'All') => void;
  onShowToast?: (msg: string) => void;
}

export const FacultiesDeptsView = ({
  selectedLevel,
  onSelectLevel,
}: FacultiesDeptsViewProps) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [facultySearch, setFacultySearch] = useState('');

  const filteredFaculties = UNILORIN_FACULTIES.filter((fac) => {
    if (!facultySearch.trim()) return true;
    const q = facultySearch.toLowerCase();
    const matchName = fac.faculty.toLowerCase().includes(q) || fac.code.toLowerCase().includes(q);
    const matchDept = fac.departments.some((d) => d.toLowerCase().includes(q));
    return matchName || matchDept;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Academic Portal Top Hero */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/50 via-neutral-900 to-neutral-950 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                <span>UNILORIN Academic Structure</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Official Directory
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Faculties & Academic Departments
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Explore UNILORIN's 16 faculties and degree-awarding departments across Permanent Site, Mini Campus, and the College of Health Sciences.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">
                Academic Scope
              </span>
              <div className="text-base font-bold text-white mt-0.5">16 Faculties</div>
              <span className="text-[10px] text-blue-400 font-mono">Accredited Programs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Academic Resource Packs - COMING SOON CARD */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 text-center backdrop-blur-md space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Coming soon</span>
        </div>
        <h3 className="text-base font-bold text-white">Academic Resource Packs & Past Questions</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
          Course materials, past question compilations, and departmental syllabus guides will be published here once approved and verified by departmental academic representatives.
        </p>
      </div>

      {/* 3. Faculties and Departments Explorer (KEPT) */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Faculty & Department Directory
            </h3>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search faculty or course..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Faculty & Department Selector Tool */}
        <FacultyDepartmentSelector
          selectedFaculty={selectedFaculty}
          onFacultyChange={setSelectedFaculty}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          allowAll={true}
          allFacultyLabel="All Faculties"
          allDepartmentLabel="All Departments"
          required={false}
        />

        {/* Faculties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredFaculties.map((fac) => (
            <div
              key={fac.code}
              className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-2.5 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {fac.code}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {fac.departments.length} Departments
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{fac.faculty}</h4>

              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  Departments:
                </span>
                <div className="flex flex-wrap gap-1">
                  {fac.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-300 border border-neutral-800"
                    >
                      {dept}
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
