import React, { useState, useEffect } from 'react';
import { X, Store, Plus, Trash2, Check, ShieldCheck, Clock, MapPin, Phone, Tag, Power, CreditCard } from 'lucide-react';
import { StudentBusiness, StudentServiceItem } from '../types';
import { HostelSelectMenu } from './HostelSelectMenu';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export interface EditTraderProfileModalProps {
  business: StudentBusiness;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBusiness: (updated: StudentBusiness) => void;
}

export const EditTraderProfileModal: React.FC<EditTraderProfileModalProps> = ({
  business,
  isOpen,
  onClose,
  onUpdateBusiness,
}) => {
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category);
  const [tagline, setTagline] = useState(business.tagline || '');
  const [description, setDescription] = useState(business.description || '');
  const [hostel, setHostel] = useState(business.hostelLocation || 'Zamfara Hostel');
  const [whatsapp, setWhatsapp] = useState(business.whatsapp || '08012345678');
  const [startingPrice, setStartingPrice] = useState(business.startingPrice || 1000);
  const [deliveryTime, setDeliveryTime] = useState(business.deliveryTimeEstimate || '15-30 Mins');
  const [imageUrl, setImageUrl] = useState(business.imageUrl);
  const [isOpenForBusiness, setIsOpenForBusiness] = useState(
    business.activeOrdersToday !== undefined ? business.activeOrdersToday > 0 : true
  );

  // Goods and Services list state
  const [services, setServices] = useState<StudentServiceItem[]>(business.services || []);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcType, setNewSvcType] = useState<'good' | 'service'>('good');

  const [savedToast, setSavedToast] = useState(false);

  // Bank payout details loaded via get_payment_details RPC for owner
  const [bankDetails, setBankDetails] = useState<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPaymentDetails() {
      if (isOpen && isSupabaseConfigured && business?.id) {
        try {
          const { data } = await supabase.rpc('get_payment_details', { p_business: business.id });
          if (isMounted && data) {
            setBankDetails({
              bank_name: data.bank_name || undefined,
              account_number: data.account_number || undefined,
              account_name: data.account_name || undefined,
            });
          }
        } catch {}
      }
    }
    loadPaymentDetails();
    return () => { isMounted = false; };
  }, [isOpen, business?.id]);

  if (!isOpen) return null;

  const handleAddService = () => {
    if (!newSvcName.trim() || !newSvcPrice) return;
    const item: StudentServiceItem = {
      id: `svc_${Date.now()}`,
      name: newSvcName.trim(),
      price: Number(newSvcPrice) || 500,
      type: newSvcType,
      inStock: true,
    };
    setServices((prev) => [...prev, item]);
    setNewSvcName('');
    setNewSvcPrice('');
  };

  const handleRemoveService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: StudentBusiness = {
      ...business,
      name,
      category,
      tagline,
      description,
      hostelLocation: hostel,
      whatsapp,
      startingPrice: Number(startingPrice) || 1000,
      deliveryTimeEstimate: deliveryTime,
      imageUrl,
      services,
      activeOrdersToday: isOpenForBusiness ? 12 : 0,
    };

    onUpdateBusiness(updated);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-400" />
              <span>Edit Trader Profile & Inventory</span>
            </h2>
            <p className="text-xs text-neutral-400">Manage your business details, availability & catalog</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Availability Toggle Banner */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isOpenForBusiness ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                <Power className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isOpenForBusiness ? '🟢 Open for Business' : '🔴 Away / Taking Exams'}
                </h4>
                <p className="text-[11px] text-neutral-400">
                  {isOpenForBusiness ? 'Receiving orders & WhatsApp inquiries' : 'Temporarily paused for lectures/exams'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpenForBusiness(!isOpenForBusiness)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isOpenForBusiness
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  : 'bg-rose-600 text-white hover:bg-rose-500'
              }`}
            >
              Toggle Status
            </button>
          </div>

          {/* Business Image & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Business Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanke Thrift Fits"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Food & Pastries">Food & Pastries 🍲</option>
                <option value="Fashion & Thrift">Fashion & Thrift 👕</option>
                <option value="Tech & Gadgets">Tech & Gadgets 💻</option>
                <option value="Beauty & Barbing">Beauty & Barbing ✂️</option>
                <option value="Graphics & Media">Graphics & Media 🎨</option>
                <option value="Laundry & Cleaning">Laundry & Cleaning 🧺</option>
              </select>
            </div>
          </div>

          {/* Tagline & Description */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Fresh hot shawarma & smoothies delivered to hostel rooms"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 mb-3"
            />

            <label className="text-xs font-bold text-neutral-300 block mb-1">Detailed Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your student venture, operational hours, special offers..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Location & Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <HostelSelectMenu
                selectedHostel={hostel}
                onHostelChange={(h) => setHostel(h)}
                label="Primary Delivery / Pickup Zone"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-400" />
                <span>WhatsApp Order Number</span>
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08012345678"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Price & Delivery Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Starting Price (₦)</label>
              <input
                type="number"
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Delivery Time Estimate</label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g. 15-20 Mins"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">Cover Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Owner Bank Payout Details (from get_payment_details RPC) */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <CreditCard className="h-4 w-4" />
              <span>Owner Bank Payment Details (via RPC)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-300">
              <div>
                <span className="text-neutral-500 block">Bank Name</span>
                <span className="font-semibold text-white">{bankDetails?.bank_name || 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Account Number</span>
                <span className="font-mono font-semibold text-amber-400">{bankDetails?.account_number || 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Account Name</span>
                <span className="font-semibold text-white">{bankDetails?.account_name || 'Not Configured'}</span>
              </div>
            </div>
          </div>

          {/* Goods & Services Catalog Management */}
          <div className="pt-2 border-t border-neutral-800 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              <span>Goods & Services Portfolio Catalog</span>
            </h3>

            {/* List Existing Items */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                  <div>
                    <span className="font-bold text-white">{svc.name}</span>
                    <span className="text-emerald-400 font-mono font-bold ml-2">₦{svc.price.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(svc.id)}
                    className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Item */}
            <div className="space-y-2 bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewSvcType('good')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    newSvcType === 'good' ? 'bg-amber-500 text-neutral-950 shadow-xs' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Good / Product
                </button>
                <button
                  type="button"
                  onClick={() => setNewSvcType('service')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    newSvcType === 'service' ? 'bg-amber-500 text-neutral-950 shadow-xs' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Custom Service
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={newSvcType === 'good' ? 'Product Name (e.g. Strawberry Parfait)' : 'Service Name (e.g. Screen Replacement)'}
                  value={newSvcName}
                  onChange={(e) => setNewSvcName(e.target.value)}
                  className="col-span-1 sm:col-span-2 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="₦ Price"
                    value={newSvcPrice}
                    onChange={(e) => setNewSvcPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notice */}
          {savedToast && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>Trader profile & catalog updated!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-xs font-bold shadow-lg"
            >
              Save Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditTraderProfileModal;
