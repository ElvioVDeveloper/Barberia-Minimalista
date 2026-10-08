import React, { useMemo, useState } from 'react';
import { Scissors } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { formatGuarani, ServiceCategory } from '../types';

const FILTER_TABS: { id: 'all' | ServiceCategory; label: string }[] = [
  { id: 'all', label: 'Todos los Servicios' },
  { id: 'corte', label: 'Cortes' },
  { id: 'barba', label: 'Barba' },
  { id: 'ritual', label: 'Toalla Caliente' },
  { id: 'combo', label: 'Combos' },
];

export const ServiceCatalogSection: React.FC = () => {
  const { services } = useStudio();
  const [activeTab, setActiveTab] = useState<'all' | ServiceCategory>('all');

  const displayedServices = useMemo(() => {
    if (activeTab === 'all') return services;
    return services.filter((s) => s.category === activeTab);
  }, [services, activeTab]);

  return (
    <section
      id="catalog"
      className="py-14 md:py-20 bg-[#1A1A1E] border-t border-b border-[#282830]"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-10">
        {/* Header & Interactive Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-[#D4AF37]">
              02. Catálogo Informativo de Precios
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Tipos de Cortes y Tarifas Vigentes
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Lista de referencia de los servicios y cortes disponibles en la barbería. Elige el que
              desees directamente al momento de tu visita.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                      : 'bg-[#222228] text-[#A1A1AA] border border-[#32323A] hover:text-white hover:border-[#D4AF37]/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Service Catalog Grid (Informative Reference) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service, index) => (
            <div
              key={service.id}
              className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                {/* Clean unboxed metadata */}
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#D4AF37] tabular-nums">
                      0{index + 1}.
                    </span>
                    <span className="capitalize">{service.category}</span>
                  </div>
                  {service.featured && (
                    <span className="text-[#E5C158] font-medium">Destacado</span>
                  )}
                </div>

                <h3 className="font-display text-xl font-semibold text-white">
                  {service.name}
                </h3>

                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#32323A] flex items-center justify-between gap-4">
                <span className="text-xs text-[#A1A1AA] inline-flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Precio de referencia</span>
                </span>
                <span className="font-display text-2xl font-semibold text-[#D4AF37] tabular-nums whitespace-nowrap">
                  {formatGuarani(service.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
