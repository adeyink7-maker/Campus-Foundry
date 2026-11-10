import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { ALL_UNILORIN_HOSTELS_META } from '../data/mockData';
import { BottomSheetPicker } from './BottomSheetPicker';

interface HostelSelectMenuProps {
  selectedHostel: string;
  onHostelChange: (hostelName: string) => void;
  roomNumber?: string;
  onRoomNumberChange?: (room: string) => void;
  showRoomInput?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  roomPlaceholder?: string;
  allowAll?: boolean;
  allLabel?: string;
}

export const HostelSelectMenu: React.FC<HostelSelectMenuProps> = ({
  selectedHostel,
  onHostelChange,
  roomNumber,
  onRoomNumberChange,
  showRoomInput = false,
  label = 'Hostel (optional)',
  required = false,
  className = '',
  roomPlaceholder = 'Room / Block (e.g. Block B, Room 102)',
  allowAll = false,
  allLabel = 'All Hostels',
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Clean hostel options for the bottom sheet
  const hostelOptions = useMemo(() => {
    const list: { value: string; label: string; sublabel?: string }[] = [];
    if (allowAll) {
      list.push({ value: 'All', label: allLabel });
    }
    ALL_UNILORIN_HOSTELS_META.forEach((h) => {
      list.push({
        value: h.name,
        label: h.name,
        sublabel: h.groupName,
      });
    });
    return list;
  }, [allowAll, allLabel]);

  return (
    <div className={`w-full ${className}`}>
      <div>
        {label && (
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            {label} {required && !allowAll && <span className="text-orange-500">*</span>}
          </label>
        )}
        
        {/* Tappable Select Field */}
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 flex items-center justify-between text-left text-xs transition-colors hover:border-white/20 focus:border-orange-500 focus:outline-none cursor-pointer"
        >
          <span className={`truncate mr-2 ${selectedHostel ? 'text-white font-medium' : 'text-neutral-500'}`}>
            {selectedHostel === 'All' ? allLabel : selectedHostel || 'Select hostel or campus lodge'}
          </span>
          <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
        </button>
      </div>

      {/* Optional Room Input if explicitly enabled */}
      {showRoomInput && onRoomNumberChange && (
        <div className="mt-2.5">
          <input
            type="text"
            value={roomNumber || ''}
            onChange={(e) => onRoomNumberChange(e.target.value)}
            placeholder={roomPlaceholder}
            className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Reusable Bottom Sheet for Hostel */}
      <BottomSheetPicker
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Select Hostel / Residence"
        searchPlaceholder="Search hostel or lodge name..."
        options={hostelOptions}
        selectedValue={selectedHostel}
        onSelect={onHostelChange}
        emptyText="No hostel found matching your search"
      />
    </div>
  );
};
