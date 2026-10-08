import React from 'react';
import { SovereignEmblem } from './SovereignEmblem';

interface StudioFooterSectionProps {
  onScrollToBooking: () => void;
  onScrollToCatalog: () => void;
  onScrollToLocation: () => void;
  onOpenAdmin: () => void;
}

export const StudioFooterSection: React.FC<StudioFooterSectionProps> = ({
  onScrollToBooking,
  onScrollToCatalog,
  onScrollToLocation,
  onOpenAdmin,
}) => {
  return (
    <footer id="studio" className="bg-[#0e0e10] border-t border-[#282830] py-12">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <SovereignEmblem className="w-11 h-11 shrink-0" />
          <div>
            <span className="font-display text-lg font-semibold text-white block">
              BarberFlow
            </span>
            <span className="text-xs text-[#A1A1AA]">
              Turnos de 1 hora · Martes a Sábado 09:00 a 20:00 hs
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-[#A1A1AA]">
          <button
            type="button"
            onClick={onScrollToBooking}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Agendar Turno
          </button>
          <button
            type="button"
            onClick={onScrollToCatalog}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Catálogo de Precios
          </button>
          <button
            type="button"
            onClick={onScrollToLocation}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Ubicación y Mapa
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            Panel Admin
          </button>
          <span className="text-[#52525B]">© {new Date().getFullYear()} BarberFlow</span>
        </div>
      </div>
    </footer>
  );
};
