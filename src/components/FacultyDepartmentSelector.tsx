import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { UNILORIN_FACULTIES } from '../data/mockData';
import { BottomSheetPicker } from './BottomSheetPicker';

interface FacultyDepartmentSelectorProps {
  selectedFaculty: string;
  onFacultyChange: (faculty: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  className?: string;
  required?: boolean;
  compact?: boolean;
  labelPrefix?: string;
  allowAll?: boolean;
  allFacultyLabel?: string;
  allDepartmentLabel?: string;
  stacked?: boolean;
}

export const FacultyDepartmentSelector: React.FC<FacultyDepartmentSelectorProps> = ({
  selectedFaculty,
  onFacultyChange,
  selectedDepartment,
  onDepartmentChange,
  className = '',
  required = true,
  allowAll = false,
  allFacultyLabel = 'All Faculties',
  allDepartmentLabel = 'All Departments',
  stacked = false,
}) => {
  const [isFacultySheetOpen, setIsFacultySheetOpen] = useState(false);
  const [isDeptSheetOpen, setIsDeptSheetOpen] = useState(false);

  // Find faculty object to retrieve its departments
  const currentFacultyObj = useMemo(() => {
    if (!selectedFaculty || selectedFaculty === 'All') return null;
    return UNILORIN_FACULTIES.find(
      (f) => f.faculty === selectedFaculty || selectedFaculty.includes(f.code)
    ) || null;
  }, [selectedFaculty]);

  // Clean faculty list (strictly faculty names, no numbering, no counters, no codes)
  const facultyOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    if (allowAll) {
      list.push({ value: 'All', label: allFacultyLabel });
    }
    UNILORIN_FACULTIES.forEach((fac) => {
      list.push({ value: fac.faculty, label: fac.faculty });
    });
    return list;
  }, [allowAll, allFacultyLabel]);

  // Clean department list for selected faculty
  const departmentOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    if (allowAll) {
      list.push({ value: 'All', label: allDepartmentLabel });
    }
    if (currentFacultyObj) {
      currentFacultyObj.departments.forEach((dept) => {
        list.push({ value: dept, label: dept });
      });
    }
    return list;
  }, [allowAll, allDepartmentLabel, currentFacultyObj]);

  const handleSelectFaculty = (facultyName: string) => {
    onFacultyChange(facultyName);
    if (facultyName === 'All') {
      onDepartmentChange('All');
      return;
    }
    const found = UNILORIN_FACULTIES.find((f) => f.faculty === facultyName);
    if (found && !found.departments.includes(selectedDepartment)) {
      onDepartmentChange('');
    }
  };

  const isDeptDisabled = !selectedFaculty || selectedFaculty === '';

  return (
    <div className={`w-full ${className}`}>
      <div className={`grid ${stacked ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 gap-3'}`}>
        
        {/* Faculty Select Field */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Faculty {required && !allowAll && <span className="text-orange-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setIsFacultySheetOpen(true)}
            className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 flex items-center justify-between text-left text-xs transition-colors hover:border-white/20 focus:border-orange-500 focus:outline-none cursor-pointer"
          >
            <span className={`truncate mr-2 ${selectedFaculty ? 'text-white font-medium' : 'text-neutral-500'}`}>
              {selectedFaculty === 'All' ? allFacultyLabel : selectedFaculty || 'Select Faculty'}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
          </button>
        </div>

        {/* Department Select Field (Disabled until faculty is chosen) */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Department {required && !allowAll && <span className="text-orange-500">*</span>}
          </label>
          <button
            type="button"
            disabled={isDeptDisabled}
            onClick={() => {
              if (!isDeptDisabled) setIsDeptSheetOpen(true);
            }}
            className={`w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 flex items-center justify-between text-left text-xs transition-colors ${
              isDeptDisabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:border-white/20 focus:border-orange-500 focus:outline-none cursor-pointer'
            }`}
          >
            <span className={`truncate mr-2 ${selectedDepartment ? 'text-white font-medium' : 'text-neutral-500'}`}>
              {isDeptDisabled 
                ? 'Select faculty first' 
                : (selectedDepartment === 'All' ? allDepartmentLabel : selectedDepartment || 'Select Department')}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
          </button>
        </div>

      </div>

      {/* Bottom Sheet for Faculty */}
      <BottomSheetPicker
        isOpen={isFacultySheetOpen}
        onClose={() => setIsFacultySheetOpen(false)}
        title="Select Faculty"
        searchPlaceholder="Search faculty name..."
        options={facultyOptions}
        selectedValue={selectedFaculty}
        onSelect={handleSelectFaculty}
        emptyText="No faculty matches your search"
      />

      {/* Bottom Sheet for Department */}
      <BottomSheetPicker
        isOpen={isDeptSheetOpen}
        onClose={() => setIsDeptSheetOpen(false)}
        title="Select Department"
        searchPlaceholder="Search department..."
        options={departmentOptions}
        selectedValue={selectedDepartment}
        onSelect={onDepartmentChange}
        emptyText="No department found"
      />
    </div>
  );
};
