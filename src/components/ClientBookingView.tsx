import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  Phone,
  Scissors,
  User,
  X,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import {
  formatReadableSpanishDate,
  getUpcomingDates,
  STUDIO_TIME_SLOTS,
} from '../seedData';
import { Appointment } from '../types';
import { SovereignEmblem } from './SovereignEmblem';

interface ClientBookingViewProps {
  onOpenMyBookings: () => void;
}

export const ClientBookingView: React.FC<ClientBookingViewProps> = ({
  onOpenMyBookings,
}) => {
  const {
    bookedSlots,
    currentUser,
    userProfile,
    createReservation,
    signInWithGoogle,
  } = useStudio();

  const upcomingDays = useMemo(() => getUpcomingDates(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.iso || '');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Appointment | null>(null);

  // Pre-fill user details when logged in
  useEffect(() => {
    if (userProfile) {
      if (!clientName && userProfile.displayName) {
        setClientName(userProfile.displayName);
      }
      if (!clientPhone && userProfile.phone) {
        setClientPhone(userProfile.phone);
      }
    } else if (currentUser) {
      if (!clientName && currentUser.displayName) {
        setClientName(currentUser.displayName);
      }
    }
  }, [currentUser, userProfile]);

  // Map occupied 1-hour slots for the selected date in real time
  const occupiedTimesForDate = useMemo(() => {
    const map = new Map<string, { status: string }>();
    for (const slot of bookedSlots) {
      if (
        slot.date === selectedDate &&
        (slot.status === 'booked' || slot.status === 'completed')
      ) {
        map.set(slot.time, { status: slot.status });
      }
    }
    return map;
  }, [bookedSlots, selectedDate]);

  // Automatically pick first available 1-hour slot when date changes if current slot is occupied or empty
  useEffect(() => {
    if (!selectedTime || occupiedTimesForDate.has(selectedTime)) {
      const firstFree = STUDIO_TIME_SLOTS.find((t) => !occupiedTimesForDate.has(t));
      setSelectedTime(firstFree || '');
    }
  }, [selectedDate, occupiedTimesForDate]);

  const availableSlotsCount = useMemo(() => {
    return STUDIO_TIME_SLOTS.filter((t) => !occupiedTimesForDate.has(t)).length;
  }, [occupiedTimesForDate]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedDate) {
      setFormError('Por favor selecciona una fecha en el calendario.');
      return;
    }
    if (!selectedTime) {
      setFormError('Por favor selecciona una hora disponible en la grilla.');
      return;
    }
    if (occupiedTimesForDate.has(selectedTime)) {
      setFormError('Ese horario acaba de ser reservado. Por favor elige otra hora libre.');
      return;
    }
    if (clientName.trim().length < 2) {
      setFormError('Ingresa tu nombre completo (mínimo 2 caracteres).');
      return;
    }
    if (clientPhone.trim().length < 6) {
      setFormError('Ingresa tu número de teléfono o WhatsApp (mínimo 6 dígitos).');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReservation({
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        source: 'online',
      });
      setConfirmedReservation(created);
    } catch (err) {
      setFormError('No se pudo registrar el turno. Verifica tu sesión e intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="booking" className="py-12 md:py-16 bg-[#121214]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Section Anchor Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase mb-2">
              01 / Booking
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Reservar Turno
            </h2>
          </div>
          <div className="text-xs text-[#A1A1AA] flex items-center gap-2">
            <span>Turnos de 1h</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-mono tabular-nums">
              {availableSlotsCount} de {STUDIO_TIME_SLOTS.length} horas libres
            </span>
          </div>
        </div>

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Columns: Date Selector, 1-Hour Time Grid & Basic Client Form */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Interactive Date Selector */}
            <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 md:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-medium text-white">
                    1. Selecciona la Fecha
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {formatReadableSpanishDate(selectedDate)}
                  </p>
                </div>

                {/* Custom Date Input for any date on calendar */}
                <div className="flex items-center gap-2">
                  <label htmlFor="custom-date-picker" className="text-xs text-[#A1A1AA]">
                    Elegir en calendario:
                  </label>
                  <input
                    id="custom-date-picker"
                    type="date"
                    value={selectedDate}
                    min={upcomingDays[0]?.iso}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono tabular-nums focus-gold cursor-pointer"
                  />
                </div>
              </div>

              {/* 7-Day Interactive Strip */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                {upcomingDays.slice(0, 7).map((day) => {
                  const isSelected = day.iso === selectedDate;
                  const bookedCountForDay = bookedSlots.filter(
                    (s) =>
                      s.date === day.iso &&
                      (s.status === 'booked' || s.status === 'completed')
                  ).length;
                  const freeCount = Math.max(0, STUDIO_TIME_SLOTS.length - bookedCountForDay);

                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedDate(day.iso)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1E] border-[#D4AF37] text-[#D4AF37] slot-selected-glow'
                          : 'bg-[#18181C] border-[#2C2C34] text-white hover:bg-[#2A2A32] hover:border-[#C59B27]'
                      }`}
                    >
                      <span className="text-[11px] font-medium text-[#A1A1AA]">
                        {day.isToday ? 'Hoy' : day.dayNameShort}
                      </span>
                      <span className="font-mono text-lg font-semibold tabular-nums">
                        {day.dayNumber}
                      </span>
                      <span className="text-[10px] text-[#A1A1AA] font-mono tabular-nums">
                        {freeCount} libres
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Fixed 1-Hour Time Slot Matrix */}
            <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 md:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-medium text-white">
                    2. Selecciona una Hora Libre (Turnos de 1 Hora)
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Intervalos fijos de 1 hora. Las horas ocupadas se bloquean automáticamente.
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#222228] border border-[#33333C]" />
                    <span>Libre</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                    <span>Seleccionado</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#161619] border border-[#282830]" />
                    <span>Ocupado</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {STUDIO_TIME_SLOTS.map((slotTime) => {
                  const isOccupied = occupiedTimesForDate.has(slotTime);
                  const isSelected = !isOccupied && selectedTime === slotTime;

                  if (isOccupied) {
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        disabled
                        className="px-4 py-3.5 rounded-full bg-[#161619] border border-[#1E1E24] text-[#454550] cursor-not-allowed flex flex-col items-center justify-center gap-0.5 select-none"
                        title="Horario ocupado"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums line-through">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{slotTime} hs</span>
                        </div>
                        <span className="text-[10px] font-medium">Ocupado</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={slotTime}
                      type="button"
                      onClick={() => setSelectedTime(slotTime)}
                      className={`px-4 py-3.5 rounded-full font-mono text-sm tabular-nums transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1E] border-[1.5px] border-[#D4AF37] text-[#D4AF37] font-semibold slot-selected-glow'
                          : 'bg-[#222228] border border-[#33333C] text-white hover:bg-[#2A2A32] hover:border-[#C59B27]'
                      }`}
                    >
                      <span>{slotTime} hs</span>
                      <span
                        className={`text-[10px] font-sans ${
                          isSelected ? 'text-[#E5C158]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {isSelected ? 'Hora elegida' : 'Disponible'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Simplified Client Information Form (Only Full Name and Phone/WhatsApp) */}
            <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 md:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-medium text-white">
                    3. Tus Datos de Contacto
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Ingresa únicamente tu nombre completo y número de teléfono o WhatsApp.
                  </p>
                </div>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="text-xs text-[#D4AF37] hover:text-[#E5C158] underline underline-offset-4 cursor-pointer"
                  >
                    Autocompletar con Google
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="client-name-input"
                    className="block text-xs font-medium text-[#A1A1AA]"
                  >
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#99907c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="client-name-input"
                      type="text"
                      required
                      maxLength={80}
                      placeholder="Ej. Martín Echeverría"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-sm text-white placeholder-[#52525B] focus-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="client-phone-input"
                    className="block text-xs font-medium text-[#A1A1AA]"
                  >
                    Teléfono / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#99907c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="client-phone-input"
                      type="tel"
                      required
                      maxLength={30}
                      placeholder="Ej. 0981 554-332"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-sm text-white placeholder-[#52525B] font-mono tabular-nums focus-gold transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Sticky Summary Drawer / Receipt Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-7 space-y-6">
              {/* Header with Emblem */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#D4AF37]">Resumen de Reserva</p>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    Confirmar Turno
                  </h3>
                </div>
                <SovereignEmblem className="w-11 h-11 shrink-0" />
              </div>

              {/* Perforated Dashed Separator */}
              <div className="border-t border-dashed border-[#383842]" />

              {/* Selected Details Breakdown */}
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[#A1A1AA] text-xs">Fecha seleccionada</span>
                  <span className="text-white font-medium text-right text-xs">
                    {formatReadableSpanishDate(selectedDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] text-xs">Hora reservada</span>
                  <span className="font-mono text-sm font-semibold text-[#D4AF37] tabular-nums">
                    {selectedTime ? `${selectedTime} hs` : 'Sin hora disponible'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] text-xs">Duración del bloque</span>
                  <span className="font-mono text-xs text-white tabular-nums">
                    1 Hora fija
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] text-xs">Cliente</span>
                  <span className="text-xs text-white truncate max-w-[180px]">
                    {clientName.trim() || 'Pendiente de completar'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A1A1AA] text-xs">WhatsApp / Teléfono</span>
                  <span className="text-xs font-mono text-white tabular-nums truncate max-w-[180px]">
                    {clientPhone.trim() || 'Pendiente de completar'}
                  </span>
                </div>
              </div>

              {/* Perforated Dashed Separator */}
              <div className="border-t border-dashed border-[#383842]" />

              {formError && (
                <div className="p-3.5 rounded-xl bg-[#93000a]/40 border border-[#ffb4ab]/40 text-xs text-[#ffdad6]">
                  {formError}
                </div>
              )}

              {/* Primary Pill CTA */}
              <button
                type="submit"
                disabled={submitting || !selectedTime}
                className={`w-full py-4 px-6 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  submitting || !selectedTime
                    ? 'bg-[#1A1A1E] border border-[#2A2A32] text-[#52525B] cursor-not-allowed'
                    : 'bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] gold-glow hover:gold-glow-strong cursor-pointer'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>
                  {submitting ? 'Guardando Reserva...' : 'Confirmar Reserva de Turno'}
                </span>
              </button>

              <p className="text-[11px] text-[#A1A1AA] text-center leading-relaxed">
                Al confirmar, el bloque de 1 hora se deshabilita automáticamente para otros usuarios.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Receipt Modal */}
      {confirmedReservation && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-[#1E1E24] border border-[#D4AF37]/60 p-6 md:p-8 space-y-6 gold-glow relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setConfirmedReservation(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#222228] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar comprobante"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-[#D4AF37] tracking-wider">
                Reserva Confirmada · #{confirmedReservation.id.slice(-6).toUpperCase()}
              </p>
              <h3 className="font-display text-2xl font-semibold text-white">
                ¡Tu turno está agendado!
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                El bloque de 1 hora ha quedado reservado a tu nombre.
              </p>
            </div>

            <div className="border-t border-dashed border-[#383842]" />

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Cliente</span>
                <span className="text-white font-medium">{confirmedReservation.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Teléfono / WhatsApp</span>
                <span className="text-white font-mono tabular-nums">
                  {confirmedReservation.clientPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Fecha</span>
                <span className="text-white font-medium">
                  {formatReadableSpanishDate(confirmedReservation.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Hora reservada</span>
                <span className="text-[#D4AF37] font-mono font-semibold tabular-nums">
                  {confirmedReservation.time} hs (1 hora)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmedReservation(null);
                  onOpenMyBookings();
                }}
                className="flex-1 py-3 px-4 rounded-full bg-[#222228] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Ver en Mis Turnos
              </button>
              <button
                type="button"
                onClick={() => setConfirmedReservation(null)}
                className="flex-1 py-3 px-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-colors cursor-pointer"
              >
                Listo, Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
