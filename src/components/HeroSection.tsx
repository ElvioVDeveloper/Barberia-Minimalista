import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { SovereignEmblem } from './SovereignEmblem';

interface HeroSectionProps {
  onScrollToBooking: () => void;
  onScrollToCatalog: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScrollToBooking,
  onScrollToCatalog,
}) => {
  return (
    <section className="relative border-b border-[#282830] bg-[#121214]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-6">
          {/* Logo General de la Barbería */}
          <SovereignEmblem className="w-20 h-20 md:w-24 md:h-24" />

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
              Studio & Barbershop
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white tracking-tight">
              BarberFlow
            </h1>
            <p className="text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto leading-relaxed">
              Cortes de precisión y afeitado tradicional. Reserva tu turno de 1 hora en línea.
            </p>
          </div>

          {/* Primary & Secondary Pill CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
            <button
              type="button"
              onClick={onScrollToBooking}
              className="px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-sm font-semibold transition-all gold-glow hover:gold-glow-strong flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Reservar Turno</span>
            </button>
            <button
              type="button"
              onClick={onScrollToCatalog}
              className="px-6 py-3.5 rounded-full bg-transparent border border-[#3A3A44] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              Ver Tarifas
            </button>
          </div>

          {/* Clean unboxed studio metadata */}
          <div className="pt-4 border-t border-[#282830] w-full max-w-xl flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs text-[#A1A1AA]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Turnos de 1h · Mar a Sáb 09:00–20:00</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Reserva Previa</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
