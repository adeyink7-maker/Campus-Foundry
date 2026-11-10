import { useState, useRef, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Sparkles, 
  X, 
  Store, 
  MapPin, 
  Phone, 
  DollarSign, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Camera 
} from 'lucide-react';
import { useAuth, TraderElevationData } from '../context/AuthContext';
import { ALL_UNILORIN_HOSTELS } from '../data/mockData';
import { StudentBusiness } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { getFriendlyError } from '../utils/friendlyErrors';
import { FriendlyAlert } from './FriendlyAlert';

interface BecomeTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onElevated: (business: StudentBusiness) => void;
  onRequireAuth?: () => void;
}

const BUSINESS_CATEGORIES = [
  'Campus Pastries & Fast Foods',
  'Tech Repairs & Phone Accessories',
  'Fashion Design & Thrift (Okrika / Vintage)',
  'Hair Styling, Braids & Barbering',
  'Hostel Laundry & Dry Cleaning',
  'Graphic Design & Tech Freelancing',
  'Academic Tutoring & Project Typing',
  'Perfumes, Cosmetics & Skincare',
  'Campus Photography & Videography',
];

const PRESET_BRAND_LOGOS = [
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1556742049-0a67e557b545?auto=format&fit=crop&w=600&q=80',
];

export const BecomeTraderModal = ({
  isOpen,
  onClose,
  onElevated,
  onRequireAuth,
}: BecomeTraderModalProps) => {
  const { currentUser, elevateToTrader } = useAuth();
  const [brandName, setBrandName] = useState('');
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [campusLocation, setCampusLocation] = useState('Lagos Hostel (Male Wing)');
  const [whatsappContact, setWhatsappContact] = useState(currentUser?.whatsapp || '');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('1500');
  const [brandLogoUrl, setBrandLogoUrl] = useState(PRESET_BRAND_LOGOS[0]);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  if (!currentUser) {
    return createPortal(
      <div 
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-center space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto">
            <Store className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Elevate to UNILORIN Campus Trader</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Please sign in to your student account to create your verified campus business identity, upload products, and manage orders.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequireAuth?.();
            }}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 py-3 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-950/50"
          >
            Sign In / Register
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!brandName.trim()) {
      setErrorMessage('Please provide your Brand or Trade Name.');
      return;
    }
    if (!whatsappContact.trim()) {
      setErrorMessage('Please provide an active WhatsApp number for campus buyer orders.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const { data: existingBiz } = await supabase
          .from('student_businesses')
          .select('id, name')
          .eq('owner_id', currentUser.id)
          .maybeSingle();

        if (existingBiz) {
          setErrorMessage(`You already have a registered store ("${existingBiz.name}"). Each student account can manage one store.`);
          setIsSubmitting(false);
          return;
        }
      }

      const elevationData: TraderElevationData = {
        brandName: brandName.trim(),
        brandLogoUrl: customLogoUrl.trim() || brandLogoUrl,
        businessCategory,
        campusLocation,
        whatsappContact: whatsappContact.trim(),
        description: description.trim() || undefined,
        startingPrice: Number(startingPrice) || 1500,
        acceptsHostelDelivery: true,
      };

      const result = await elevateToTrader(elevationData);
      onElevated(result.business);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getFriendlyError(err, 'store'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full sm:max-w-xl max-h-[90dvh] h-full sm:h-auto rounded-t-3xl sm:rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Part 1: Fixed Banner Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-neutral-800 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-neutral-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Become a Verified Campus Trader</h3>
              <p className="text-[11px] text-amber-400 font-medium">Permanent Buyer-to-Trader Account Elevation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container with Flex Structure */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Part 2: Middle Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
            {errorMessage && (
              <FriendlyAlert
                message={errorMessage}
                onRetry={() => handleSubmit()}
                onDismiss={() => setErrorMessage(null)}
                variant="warning"
                isRetrying={isSubmitting}
              />
            )}

            {/* Value Prop Highlight */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Unified Student Experience:</strong> Upgrading unlocks the Vendor Dashboard inside the Marketplace and adds a public <strong>Business Catalog</strong> to your UNILORIN profile without logging into a separate account.
              </div>
            </div>

            {/* Brand Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Brand / Trade Name <span className="text-amber-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="e.g. Dami's Crust, Jay Kay Gadgets"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Business Category <span className="text-amber-400">*</span>
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand Logo / Face of the Product */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center justify-between">
                <span>Brand Logo / Face of the Brand</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UploadCloud className="h-3 w-3" />
                  <span>Upload Custom Logo</span>
                </button>
              </label>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />

              {customLogoUrl ? (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <img src={customLogoUrl} alt="Custom Logo" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">Custom Brand Logo Uploaded</p>
                    <p className="text-[10px] text-neutral-400">High-resolution verified vendor image</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomLogoUrl('')}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_BRAND_LOGOS.map((logo, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBrandLogoUrl(logo)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        brandLogoUrl === logo
                          ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-400/20'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={logo} alt="Preset Logo" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campus Location & WhatsApp Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Campus Base / Hostel Spot <span className="text-amber-400">*</span>
                </label>
                <select
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                >
                  {ALL_UNILORIN_HOSTELS.map((h) => (
                    <option key={h} value={h}>
                      📍 {h}
                    </option>
                  ))}
                  <option value="SUB Shops (Student Union Complex)">📍 SUB Shops (Student Union Complex)</option>
                  <option value="Tanke Sanrab Off-Campus Base">📍 Tanke Sanrab Off-Campus Base</option>
                  <option value="Faculty Walkway Kiosks">📍 Faculty Walkway Kiosks</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  WhatsApp Order Line <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                  <input
                    required
                    type="tel"
                    value={whatsappContact}
                    onChange={(e) => setWhatsappContact(e.target.value)}
                    onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="e.g. 08031234567"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description / Pitch */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Short Pitch / Tagline for Campus Buyers
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                placeholder="e.g. Delicious hot pies, cinnamon rolls & exam study boxes delivered straight to your dorm room."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Starting Price */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Base Starting Price (₦)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">₦</span>
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="1500"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-7 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Part 3: Sticky Footer */}
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold px-6 py-2.5 text-xs transition-all shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? 'Elevating Account...' : 'Complete Trader Elevation'}</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
