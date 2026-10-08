import React, { useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
  TouchpadOff,
} from 'lucide-react';

const STUDIO_COORDINATES = {
  lat: -25.2936,
  lng: -57.5811,
};

const STUDIO_DETAILS = {
  name: 'Sovereign Craft — Barbería & Estudio',
  streetAddress: 'Av. Mariscal López 1480 esq. Charles de Gaulle',
  neighborhoodCity: 'Barrio Villa Morra · Asunción, Paraguay',
  reference: 'Frente a la plaza, con estacionamiento exclusivo para clientes.',
  phoneDisplay: '+595 981 458-291',
  phoneRaw: '595981458291',
  instagramHandle: '@sovereigncraft.py',
  instagramUrl: 'https://www.instagram.com/',
  scheduleMain: 'Martes a Sábado · 09:00 a 20:00 hs',
  scheduleClosed: 'Domingos y Lunes · Cerrado (Atención por Turno)',
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${STUDIO_COORDINATES.lat},${STUDIO_COORDINATES.lng}`,
  openInMapsUrl: `https://www.google.com/maps/search/?api=1&query=${STUDIO_COORDINATES.lat},${STUDIO_COORDINATES.lng}`,
};

const BarberMarkerWithInfo: React.FC = () => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState<boolean>(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={STUDIO_COORDINATES}
        onClick={() => setInfoOpen((prev) => !prev)}
        title={STUDIO_DETAILS.name}
      >
        <Pin
          background={'#D4AF37'}
          borderColor={'#121214'}
          glyphColor={'#121214'}
          scale={1.25}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="text-[#121214] p-1 space-y-1.5">
            <p className="font-semibold text-sm leading-snug">
              {STUDIO_DETAILS.name}
            </p>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {STUDIO_DETAILS.streetAddress}, {STUDIO_DETAILS.neighborhoodCity}
            </p>
            <a
              href={STUDIO_DETAILS.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#997A15] hover:underline pt-0.5"
            >
              <span>Cómo llegar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const StudioLocationSection: React.FC = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');
  const [mapResetKey, setMapResetKey] = useState<number>(0);
  const [mobileTouchInteractive, setMobileTouchInteractive] = useState<boolean>(false);

  const handleCopyAddress = async () => {
    const fullText = `${STUDIO_DETAILS.streetAddress}, ${STUDIO_DETAILS.neighborhoodCity}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch {
      setCopiedAddress(false);
    }
  };

  const embedSrc = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        apiKey
      )}&solution_id=gmp_mcp_codeassist_v1_aistudio&q=${STUDIO_COORDINATES.lat},${
        STUDIO_COORDINATES.lng
      }&zoom=16&maptype=${mapTypeId}&language=es&region=PY`
    : '';

  return (
    <section
      id="location"
      className="py-14 md:py-20 bg-[#121214] border-b border-[#282830]"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-10">
        {/* Encabezado de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-[#D4AF37]">
              03. Ubicación & Contacto Directo
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Encuéntranos en el Corazón de la Ciudad
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Consulta nuestra dirección exacta, horarios de atención y abre la ruta directa en
              Google Maps desde tu móvil o navegador.
            </p>
          </div>

          {/* Botón rápido superior para móviles y escritorio */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={STUDIO_DETAILS.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs sm:text-sm font-semibold transition-all gold-glow hover:gold-glow-strong inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Cómo llegar</span>
            </a>
            <a
              href={STUDIO_DETAILS.openInMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-[#1A1A1E] border border-[#32323A] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Abrir en Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Grilla Asimétrica: Tarjeta de Dirección/Contacto (5 cols) + Mapa Interactivo (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Columna Izquierda: Información de Dirección y Contacto */}
          <div className="lg:col-span-5 rounded-[2rem] bg-[#1A1A1E] border border-[#2C2C34] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl shadow-black/50">
            <div className="space-y-6">
              {/* Bloque 1: Dirección Exacta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    <MapPin className="w-4 h-4" />
                    <span>Dirección del Estudio</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="text-xs text-[#A1A1AA] hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar dirección exacta"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">¡Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar dirección</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-4 space-y-1.5">
                  <p className="font-display text-lg font-semibold text-white leading-snug">
                    {STUDIO_DETAILS.streetAddress}
                  </p>
                  <p className="text-sm text-[#E4E4E7] font-medium">
                    {STUDIO_DETAILS.neighborhoodCity}
                  </p>
                  <p className="text-xs text-[#A1A1AA] pt-1">
                    {STUDIO_DETAILS.reference}
                  </p>
                </div>
              </div>

              {/* Bloque 2: Detalles de Contacto (Teléfono / WhatsApp e Instagram) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <a
                  href={`https://wa.me/${STUDIO_DETAILS.phoneRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-[#222228] border border-[#32323A] hover:border-[#D4AF37]/60 p-4 transition-colors flex flex-col justify-between gap-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#D4AF37]">
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp / Tel.</span>
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="font-mono text-sm font-semibold text-white tabular-nums">
                    {STUDIO_DETAILS.phoneDisplay}
                  </p>
                </a>

                <a
                  href={STUDIO_DETAILS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-[#222228] border border-[#32323A] hover:border-[#D4AF37]/60 p-4 transition-colors flex flex-col justify-between gap-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#D4AF37]">
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm font-semibold text-white truncate">
                    {STUDIO_DETAILS.instagramHandle}
                  </p>
                </a>
              </div>

              {/* Bloque 3: Horarios Generales de Atención */}
              <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Horarios Generales de Atención</span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2 text-white font-medium">
                    <span>Martes a Sábado</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums">09:00 – 20:00 hs</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[#A1A1AA] text-xs">
                    <span>Modalidad de turnos</span>
                    <span>Bloques fijos de 1 hora</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[#A1A1AA] text-xs pt-1 border-t border-[#32323A]">
                    <span>Domingos y Lunes</span>
                    <span className="text-[#ffb4ab]">Cerrado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 4: CTA Principal de Navegación */}
            <div className="pt-2 space-y-2.5">
              <a
                href={STUDIO_DETAILS.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-sm font-semibold transition-all gold-glow hover:gold-glow-strong flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Cómo llegar en Google Maps</span>
              </a>
              <p className="text-[11px] text-center text-[#A1A1AA]">
                Se abrirá la ruta directa en la aplicación de mapas de tu móvil o en una nueva pestaña.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta del Mapa Interactivo */}
          <div className="lg:col-span-7 rounded-[2rem] bg-[#1A1A1E] border border-[#2C2C34] p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-2xl shadow-black/60">
            {/* Barra de Controles del Mapa */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapTypeId('roadmap')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    mapTypeId === 'roadmap'
                      ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                      : 'bg-[#222228] text-[#A1A1AA] hover:text-white border border-[#32323A]'
                  }`}
                >
                  Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setMapTypeId('satellite')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    mapTypeId === 'satellite'
                      ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                      : 'bg-[#222228] text-[#A1A1AA] hover:text-white border border-[#32323A]'
                  }`}
                >
                  Satélite
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Control móvil para evitar bloqueo de scroll vertical en pantallas táctiles */}
                <button
                  type="button"
                  onClick={() => setMobileTouchInteractive((prev) => !prev)}
                  className={`md:hidden px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                    mobileTouchInteractive
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#222228] border-[#32323A] text-[#A1A1AA]'
                  }`}
                >
                  <TouchpadOff className="w-3.5 h-3.5" />
                  <span>{mobileTouchInteractive ? 'Bloquear mapa (Scroll)' : 'Mover mapa'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapResetKey((prev) => prev + 1)}
                  className="px-3 py-1.5 rounded-full bg-[#222228] border border-[#32323A] hover:border-[#D4AF37]/50 text-xs text-[#A1A1AA] hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Centrar ubicación de la barbería"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Centrar</span>
                </button>
              </div>
            </div>

            {/* Contenedor del Mapa con altura explícita (CF2) y protección de scroll móvil */}
            <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] rounded-[1.5rem] overflow-hidden border border-[#2C2C34] bg-[#121214]">
              {apiKey ? (
                <APIProvider apiKey={apiKey} language="es" region="PY">
                  <Map
                    key={`${mapResetKey}-${mapTypeId}`}
                    mapId="DEMO_MAP_ID"
                    colorScheme="DARK"
                    mapTypeId={mapTypeId}
                    defaultCenter={STUDIO_COORDINATES}
                    defaultZoom={16}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    fullscreenControl={true}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    className="w-full h-full"
                  >
                    <BarberMarkerWithInfo />
                  </Map>
                </APIProvider>
              ) : (
                <iframe
                  title="Ubicación de la Barbería Sovereign Craft"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={embedSrc || `https://www.google.com/maps?q=${STUDIO_COORDINATES.lat},${STUDIO_COORDINATES.lng}&hl=es&z=16&output=embed`}
                  className="w-full h-full"
                />
              )}

              {/* Escudo táctil en móviles cuando el modo de deslizamiento de página está activo */}
              {!mobileTouchInteractive && (
                <div
                  onClick={() => setMobileTouchInteractive(true)}
                  className="md:hidden absolute inset-x-0 bottom-3 mx-auto w-max max-w-[90%] px-4 py-2 rounded-full bg-[#121214]/90 backdrop-blur-md border border-[#32323A] text-[11px] text-[#E4E4E7] shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>Toca &ldquo;Mover mapa&rdquo; o usa dos dedos para explorar el mapa</span>
                </div>
              )}
            </div>

            {/* Pie del contenedor del mapa con atribución Google Maps y enlace directo */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-xs text-[#A1A1AA]">
              <div className="space-y-0.5">
                <p className="text-[11px] text-[#A1A1AA]">
                  Google Maps
                </p>
                <p className="font-mono text-[11px] text-[#71717A] tabular-nums">
                  Coord: {STUDIO_COORDINATES.lat}, {STUDIO_COORDINATES.lng}
                </p>
              </div>

              <a
                href={STUDIO_DETAILS.openInMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#D4AF37] hover:text-[#E5C158] inline-flex items-center gap-1 transition-colors"
              >
                <span>Abrir en Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
