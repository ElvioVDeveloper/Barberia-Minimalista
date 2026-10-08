import React from 'react';
import { Scissors, ShieldCheck } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export type ActiveView = 'client' | 'admin' | 'my-bookings';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onNavigateSection,
}) => {
  const { isAdmin } = useStudio();

  const handleNavClick = (target: 'booking' | 'catalog' | 'location' | 'my-bookings' | 'admin') => {
    if (target === 'admin') {
      setActiveView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (target === 'my-bookings') {
      setActiveView('my-bookings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveView('client');
    setTimeout(() => {
      onNavigateSection(target);
    }, 40);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#121214]/95 backdrop-blur-md border-b border-[#282830]">
      <div className="max-w-[1200px] mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('booking')}
          className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Sovereign Craft
        </button>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]">
          <button
            type="button"
            onClick={() => handleNavClick('booking')}
            className={`py-1 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeView === 'client'
                ? 'text-white border-[#D4AF37]'
                : 'border-transparent hover:text-white hover:border-[#3A3A44]'
            }`}
          >
            Reservar Turno
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('catalog')}
            className="py-1 transition-colors border-b-2 border-transparent hover:text-white hover:border-[#3A3A44] whitespace-nowrap cursor-pointer"
          >
            Catálogo de Cortes
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('my-bookings')}
            className={`py-1 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeView === 'my-bookings'
                ? 'text-white border-[#D4AF37]'
                : 'border-transparent hover:text-white hover:border-[#3A3A44]'
            }`}
          >
            Mis Turnos
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('location')}
            className="py-1 transition-colors border-b-2 border-transparent hover:text-white hover:border-[#3A3A44] whitespace-nowrap cursor-pointer"
          >
            Ubicación
          </button>
        </nav>

        {/* Zone 3: Single primary action — Panel Barbero */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(activeView === 'admin' ? 'booking' : 'admin')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeView === 'admin'
                ? 'bg-[#222228] text-white border border-[#3A3A44] hover:border-[#D4AF37]'
                : 'bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214]'
            }`}
          >
            {activeView === 'admin' ? (
              <>
                <Scissors className="w-3.5 h-3.5" />
                <span>Vista Cliente</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel Barbero {isAdmin ? '· Activo' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
