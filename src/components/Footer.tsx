import { Store, ShieldCheck, Heart, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateBusiness: () => void;
  onOpenAuth: () => void;
}

export const Footer = ({
  onNavigateTab,
  onOpenCreateBusiness,
  onOpenAuth,
}: FooterProps) => {
  return (
    <footer className="border-t border-neutral-800/80 bg-neutral-950 pt-12 pb-8 text-neutral-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-900">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs">
                CF
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                Campus Foundry
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Empowering student entrepreneurs across University of Ilorin to launch, take orders, and deliver to hostels with zero platform cut.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>University of Ilorin · "Better by Far"</span>
            </div>
          </div>

          {/* Quick Marketplace Links */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigateTab('stores')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Stores & Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('hubs')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Campus Hostel Hubs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('blueprints')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Launch Blueprints
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab('dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Student Hub & Profile
                </button>
              </li>
            </ul>
          </div>

          {/* Student Hubs */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Campus Hostels
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-500" />
                <span>Lagos, Abuja & Zamfara Hostels</span>
              </li>
              <li className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-500" />
                <span>Village 1 & Village 2 (PS)</span>
              </li>
              <li className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-500" />
                <span>CIS Quad & Walkway Shops</span>
              </li>
              <li className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-neutral-500" />
                <span>Tanke Tipper Garage & Sanrab</span>
              </li>
            </ul>
          </div>

          {/* Trader Resources */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              For Student Traders
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenCreateBusiness}
                  className="text-amber-400 hover:text-amber-300 font-medium"
                >
                  + List Your Trade in 2 Mins
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAuth}
                  className="hover:text-white transition-colors"
                >
                  Trader Sign In / Sign Up
                </button>
              </li>
              <li>
                <span className="text-neutral-500 text-[11px]">
                  Direct WhatsApp ordering enabled
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>
            © {new Date().getFullYear()} Campus Foundry UNILORIN. Built for student founders & campus commerce.
          </p>
          <p className="flex items-center gap-1">
            <span>Better by Far</span>
            <span className="text-neutral-700">·</span>
            <span>Zero middleman commission</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
