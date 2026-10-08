import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  LogIn,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import {
  formatReadableSpanishDate,
  getUpcomingDates,
  STUDIO_TIME_SLOTS,
} from '../seedData';
import {
  Appointment,
  AppointmentStatus,
  BarberService,
  BookingSource,
  formatGuarani,
  ServiceCategory,
} from '../types';
import { SovereignEmblem } from './SovereignEmblem';

export const BarberAdminPortal: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    services,
    bookedSlots,
    appointments,
    signInWithGoogle,
    unlockBarberMode,
    createReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    createService,
    updateService,
    deleteService,
    restoreSeedData,
  } = useStudio();

  const upcomingDays = useMemo(() => getUpcomingDates(14), []);
  const [adminPin, setAdminPin] = useState<string>('');

  const [activeModule, setActiveModule] = useState<'agenda' | 'catalogo'>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.iso || '');
  const [agendaMode, setAgendaMode] = useState<'hourly' | 'all'>('hourly');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Booking Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualDate, setManualDate] = useState<string>(upcomingDays[0]?.iso || '');
  const [manualTime, setManualTime] = useState<string>('10:00');
  const [manualClientName, setManualClientName] = useState<string>('');
  const [manualClientPhone, setManualClientPhone] = useState<string>('');
  const [manualSource, setManualSource] = useState<BookingSource>('walkin');
  const [manualError, setManualError] = useState<string>('');
  const [savingManual, setSavingManual] = useState<boolean>(false);

  // Edit Appointment Modal State
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editStatus, setEditStatus] = useState<AppointmentStatus>('confirmed');
  const [savingEditApt, setSavingEditApt] = useState<boolean>(false);

  // Service Catalog CRUD Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [srvName, setSrvName] = useState<string>('');
  const [srvCategory, setSrvCategory] = useState<ServiceCategory>('corte');
  const [srvPrice, setSrvPrice] = useState<string>('80000');
  const [srvDescription, setSrvDescription] = useState<string>('');
  const [srvFeatured, setSrvFeatured] = useState<boolean>(false);
  const [savingService, setSavingService] = useState<boolean>(false);
  const [restoringSeed, setRestoringSeed] = useState<boolean>(false);

  // Appointments for the selected date indexed by 1-hour slot
  const appointmentsByHourForSelectedDate = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const apt of appointments) {
      if (apt.date === selectedDate && apt.status !== 'cancelled') {
        map.set(apt.time, apt);
      }
    }
    return map;
  }, [appointments, selectedDate]);

  // Filtered appointments for list view
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (agendaMode === 'hourly' && apt.date !== selectedDate) return false;
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = apt.clientName.toLowerCase().includes(q);
        const matchPhone = apt.clientPhone.toLowerCase().includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [appointments, agendaMode, selectedDate, statusFilter, searchQuery]);

  // Metrics for selected date
  const agendaStats = useMemo(() => {
    const dayApts = appointments.filter((a) => a.date === selectedDate);
    const confirmedCount = dayApts.filter((a) => a.status === 'confirmed').length;
    const completedCount = dayApts.filter((a) => a.status === 'completed').length;
    const occupiedCount = confirmedCount + completedCount;
    const freeCount = Math.max(0, STUDIO_TIME_SLOTS.length - occupiedCount);
    return {
      occupiedCount,
      confirmedCount,
      completedCount,
      freeCount,
    };
  }, [appointments, selectedDate]);

  const handleAdminUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockBarberMode();
  };

  const openManualModalForTime = (presetTime?: string) => {
    const targetDate = selectedDate || upcomingDays[0]?.iso || '';
    setManualDate(targetDate);
    if (presetTime) {
      setManualTime(presetTime);
    } else {
      const occupiedOnDay = new Set(
        bookedSlots
          .filter(
            (s) =>
              s.date === targetDate &&
              (s.status === 'booked' || s.status === 'completed')
          )
          .map((s) => s.time)
      );
      const firstFree =
        STUDIO_TIME_SLOTS.find((t) => !occupiedOnDay.has(t)) || STUDIO_TIME_SLOTS[0];
      setManualTime(firstFree);
    }
    setManualClientName('');
    setManualClientPhone('');
    setManualSource('walkin');
    setManualError('');
    setIsManualModalOpen(true);
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    if (manualClientName.trim().length < 2) {
      setManualError('Ingresa el nombre completo del cliente.');
      return;
    }
    if (manualClientPhone.trim().length < 6) {
      setManualError('Ingresa un teléfono o WhatsApp válido.');
      return;
    }

    setSavingManual(true);
    try {
      await createReservation({
        date: manualDate,
        time: manualTime,
        clientName: manualClientName.trim(),
        clientPhone: manualClientPhone.trim(),
        source: manualSource,
      });
      setIsManualModalOpen(false);
    } catch (err) {
      setManualError('No se pudo guardar el turno manual.');
    } finally {
      setSavingManual(false);
    }
  };

  const openEditAppointment = (apt: Appointment) => {
    setEditingApt(apt);
    setEditDate(apt.date);
    setEditTime(apt.time);
    setEditClientName(apt.clientName);
    setEditClientPhone(apt.clientPhone);
    setEditStatus(apt.status);
  };

  const handleSaveAppointmentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setSavingEditApt(true);
    try {
      await updateReservation(editingApt.id, {
        date: editDate,
        time: editTime,
        clientName: editClientName.trim(),
        clientPhone: editClientPhone.trim(),
        status: editStatus,
      });
      setEditingApt(null);
    } finally {
      setSavingEditApt(false);
    }
  };

  const openNewServiceModal = () => {
    setEditingService(null);
    setSrvName('');
    setSrvCategory('corte');
    setSrvPrice('80000');
    setSrvDescription('');
    setSrvFeatured(false);
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (srv: BarberService) => {
    setEditingService(srv);
    setSrvName(srv.name);
    setSrvCategory(srv.category);
    setSrvPrice(String(srv.price));
    setSrvDescription(srv.description);
    setSrvFeatured(srv.featured);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (srvName.trim().length < 2 || srvDescription.trim().length < 4) return;
    setSavingService(true);
    try {
      const payload = {
        name: srvName.trim(),
        category: srvCategory,
        price: Number(srvPrice) || 0,
        durationMinutes: 60,
        description: srvDescription.trim(),
        featured: srvFeatured,
      };
      if (editingService) {
        await updateService(editingService.id, payload);
      } else {
        await createService(payload);
      }
      setIsServiceModalOpen(false);
    } finally {
      setSavingService(false);
    }
  };

  const handleRestoreSeed = async () => {
    setRestoringSeed(true);
    try {
      await restoreSeedData();
    } finally {
      setRestoringSeed(false);
    }
  };

  // Restricted Admin Gate if not unlocked yet
  if (!isAdmin) {
    return (
      <section className="py-16 md:py-24 bg-[#121214] min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[2rem] bg-[#222228] border border-[#32323A] p-8 space-y-6 text-center">
          <SovereignEmblem className="w-16 h-16 mx-auto" />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#D4AF37] tracking-wider">
              Acceso Exclusivo · Administración
            </p>
            <h1 className="font-display text-3xl font-semibold text-white">
              Panel del Barbero
            </h1>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Inicia sesión como administrador para gestionar la agenda hora por hora y el catálogo
              de precios.
            </p>
          </div>

          <form onSubmit={handleAdminUnlockSubmit} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="barber-pin-input"
                className="block text-xs font-medium text-[#A1A1AA] mb-1.5"
              >
                Clave de Administrador (Demo: 1234 o ingreso directo)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#99907c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="barber-pin-input"
                  type="password"
                  placeholder="Ingresa clave o pulsa Ingresar..."
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#18181C] border border-[#2C2C34] text-sm text-white placeholder-[#52525B] focus-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-all gold-glow flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ingresar al Panel Admin</span>
            </button>
          </form>

          {!currentUser && (
            <div className="pt-4 border-t border-[#32323A]">
              <button
                type="button"
                onClick={async () => {
                  await signInWithGoogle();
                  unlockBarberMode();
                }}
                className="w-full py-3 px-5 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#D4AF37]" />
                <span>Autenticar con Google Admin</span>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-[#121214] min-h-[85vh]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8">
        {/* Top Admin Header & Module Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#282830]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Panel de Administración · Sovereign Craft</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Agenda Diaria y Catálogo
            </h1>
            <p className="text-xs text-[#A1A1AA]">
              Gestiona las reservas organizadas hora por hora y administra los precios del catálogo
              informativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Control for Agenda vs Catalog CRUD */}
            <div className="p-1 rounded-full bg-[#1A1A1E] border border-[#2C2C34] flex items-center">
              <button
                type="button"
                onClick={() => setActiveModule('agenda')}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeModule === 'agenda'
                    ? 'bg-[#D4AF37] text-[#121214]'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Agenda Hora por Hora
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('catalogo')}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeModule === 'catalogo'
                    ? 'bg-[#D4AF37] text-[#121214]'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                Catálogo de Precios ({services.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRestoreSeed}
              disabled={restoringSeed}
              className="px-4 py-2.5 rounded-full bg-[#222228] border border-[#32323A] hover:border-[#D4AF37]/50 text-xs text-[#A1A1AA] hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              title="Recargar datos de prueba iniciales"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${restoringSeed ? 'animate-spin' : ''}`} />
              <span>{restoringSeed ? 'Restaurando...' : 'Datos de Prueba'}</span>
            </button>
          </div>
        </div>

        {/* MODULE 1: AGENDA DIARIA HORA POR HORA */}
        {activeModule === 'agenda' && (
          <div className="space-y-8">
            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-5">
                <span className="text-xs text-[#A1A1AA] block">Horas Ocupadas del Día</span>
                <span className="font-display text-3xl font-semibold text-white tabular-nums mt-1 block">
                  {agendaStats.occupiedCount} / {STUDIO_TIME_SLOTS.length}
                </span>
                <span className="text-[11px] text-[#99907c] mt-1 block">
                  {formatReadableSpanishDate(selectedDate)}
                </span>
              </div>

              <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-5">
                <span className="text-xs text-[#A1A1AA] block">Turnos Confirmados</span>
                <span className="font-display text-3xl font-semibold text-[#D4AF37] tabular-nums mt-1 block">
                  {agendaStats.confirmedCount}
                </span>
                <span className="text-[11px] text-[#99907c] mt-1 block">
                  Pendientes de atención
                </span>
              </div>

              <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-5">
                <span className="text-xs text-[#A1A1AA] block">Turnos Completados</span>
                <span className="font-display text-3xl font-semibold text-emerald-400 tabular-nums mt-1 block">
                  {agendaStats.completedCount}
                </span>
                <span className="text-[11px] text-[#99907c] mt-1 block">
                  Atendidos en el día
                </span>
              </div>

              <div className="rounded-2xl bg-[#222228] border border-[#32323A] p-5">
                <span className="text-xs text-[#A1A1AA] block">Horas Libres Hoy</span>
                <span className="font-display text-3xl font-semibold text-white tabular-nums mt-1 block">
                  {agendaStats.freeCount}
                </span>
                <span className="text-[11px] text-[#99907c] mt-1 block">
                  Bloques de 1 hora disponibles
                </span>
              </div>
            </div>

            {/* Agenda Controls: Date Strip & Manual Booking Button */}
            <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAgendaMode('hourly')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      agendaMode === 'hourly'
                        ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                        : 'bg-[#18181C] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    Grilla Hora por Hora (09:00 – 20:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaMode('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      agendaMode === 'all'
                        ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                        : 'bg-[#18181C] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    Lista General de Reservas
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono tabular-nums focus-gold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openManualModalForTime()}
                  className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-all gold-glow flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Agregar Turno Manual</span>
                </button>
              </div>

              {/* 7-Day Selector Strip */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {upcomingDays.slice(0, 7).map((d) => {
                  const isSelected = d.iso === selectedDate;
                  const countForDay = appointments.filter(
                    (a) => a.date === d.iso && a.status !== 'cancelled'
                  ).length;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setSelectedDate(d.iso)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1E] border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#18181C] border-[#2C2C34] text-white hover:border-[#C59B27]'
                      }`}
                    >
                      <span className="text-[10px] text-[#A1A1AA]">
                        {d.isToday ? 'Hoy' : d.dayNameShort}
                      </span>
                      <span className="font-mono text-base font-semibold tabular-nums">
                        {d.dayNumber}
                      </span>
                      <span className="text-[10px] text-[#A1A1AA] font-mono tabular-nums">
                        {countForDay} reservados
                      </span>
                    </button>
                  );
                })}
              </div>

              {agendaMode === 'all' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-[#32323A]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#99907c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre del cliente o teléfono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white placeholder-[#52525B] focus-gold"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Todos' },
                        { id: 'confirmed', label: 'Confirmados' },
                        { id: 'completed', label: 'Completados' },
                        { id: 'cancelled', label: 'Cancelados' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          statusFilter === st.id
                            ? 'bg-[#D4AF37] text-[#121214] font-semibold'
                            : 'bg-[#18181C] text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* VIEW A: HOURLY SCHEDULE (09:00 TO 20:00) */}
            {agendaMode === 'hourly' ? (
              <div className="space-y-3">
                {STUDIO_TIME_SLOTS.map((hourSlot) => {
                  const apt = appointmentsByHourForSelectedDate.get(hourSlot);

                  if (!apt) {
                    return (
                      <div
                        key={hourSlot}
                        className="rounded-2xl bg-[#1A1A1E] border border-[#282830] p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2.5 rounded-xl bg-[#121214] border border-[#2C2C34] font-mono text-base font-semibold text-[#A1A1AA] tabular-nums min-w-[105px] text-center">
                            {hourSlot} hs
                          </div>
                          <div>
                            <span className="text-xs text-[#A1A1AA] block">
                              Bloque de 1 hora disponible
                            </span>
                            <span className="text-xs text-[#52525B]">Sin reserva asignada</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openManualModalForTime(hourSlot)}
                          className="px-4 py-2 rounded-full bg-[#222228] border border-[#3A3A44] hover:border-[#D4AF37] text-xs font-medium text-white hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar Cliente en {hourSlot} hs</span>
                        </button>
                      </div>
                    );
                  }

                  const isCompleted = apt.status === 'completed';

                  return (
                    <div
                      key={hourSlot}
                      className="rounded-2xl bg-[#222228] border border-[#D4AF37]/40 p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                        <div className="px-4 py-2.5 rounded-xl bg-[#18181C] border border-[#D4AF37] font-mono text-base font-semibold text-[#D4AF37] tabular-nums min-w-[105px] text-center shrink-0">
                          {hourSlot} hs
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`font-semibold ${
                                isCompleted ? 'text-emerald-400' : 'text-[#D4AF37]'
                              }`}
                            >
                              {isCompleted ? 'Completado' : 'Reservado (1 Hora)'}
                            </span>
                            <span aria-hidden="true" className="text-[#A1A1AA]">
                              ·
                            </span>
                            <span className="text-[#A1A1AA]">
                              {apt.source === 'online'
                                ? 'Reserva Web'
                                : apt.source === 'phone'
                                ? 'Teléfono / WhatsApp'
                                : 'Presencial'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <h4 className="font-sans text-base font-semibold text-white flex items-center gap-1.5">
                              <User className="w-4 h-4 text-[#D4AF37]" />
                              <span>{apt.clientName}</span>
                            </h4>

                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-white tabular-nums bg-[#18181C] px-3 py-1 rounded-full border border-[#2C2C34]">
                              <Phone className="w-3 h-3 text-[#D4AF37]" />
                              <span>{apt.clientPhone}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#32323A] shrink-0">
                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(apt.id, 'completed')}
                              className="px-3.5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReservationStatus(apt.id, 'cancelled')}
                              className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Liberar Hora</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditAppointment(apt)}
                          className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteReservation(apt.id)}
                          className="p-2 rounded-full bg-[#18181C] border border-[#2C2C34] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                          title="Eliminar turno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* VIEW B: GENERAL FILTERABLE RESERVATIONS LIST */
              <div className="space-y-3">
                {filteredAppointments.length === 0 ? (
                  <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-12 text-center space-y-4">
                    <Calendar className="w-10 h-10 text-[#D4AF37] mx-auto" />
                    <h3 className="font-display text-2xl text-white">
                      No se encontraron reservas con ese filtro
                    </h3>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => {
                    const isCompleted = apt.status === 'completed';
                    const isCancelled = apt.status === 'cancelled';

                    return (
                      <div
                        key={apt.id}
                        className={`rounded-2xl bg-[#222228] border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                          isCancelled
                            ? 'border-[#282830] opacity-60'
                            : 'border-[#32323A] hover:border-[#D4AF37]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="px-4 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-center min-w-[110px]">
                            <span className="font-mono text-base font-semibold text-[#D4AF37] tabular-nums block">
                              {apt.time} hs
                            </span>
                            <span className="font-mono text-[11px] text-[#A1A1AA] tabular-nums block">
                              {apt.date}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-[#A1A1AA] flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isCompleted
                                    ? 'text-emerald-400'
                                    : isCancelled
                                    ? 'text-[#ffb4ab]'
                                    : 'text-[#D4AF37]'
                                }`}
                              >
                                {isCompleted
                                  ? 'Completado'
                                  : isCancelled
                                  ? 'Cancelado'
                                  : 'Confirmado'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>Bloque de 1 hora</span>
                            </div>

                            <h4 className="font-sans text-base font-semibold text-white">
                              {apt.clientName}
                            </h4>

                            <p className="text-xs font-mono text-[#D4AF37] tabular-nums inline-flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              <span>{apt.clientPhone}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditAppointment(apt)}
                            className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReservation(apt.id)}
                            className="p-2 rounded-full bg-[#18181C] border border-[#2C2C34] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: GESTIÓN DE CATÁLOGO INFORMATIVO (CRUD DE SERVICIOS Y PRECIOS) */}
        {activeModule === 'catalogo' && (
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">
                  Catálogo Informativo de Cortes y Precios
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Agrega nuevos tipos de corte, modifica sus precios en Guaraníes (₲) o elimina
                  servicios del catálogo de referencia.
                </p>
              </div>

              <button
                type="button"
                onClick={openNewServiceModal}
                className="px-5 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-all gold-glow flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Nuevo Corte / Servicio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                      <span className="capitalize text-[#D4AF37] font-medium">
                        {srv.category}
                      </span>
                      {srv.featured && (
                        <span className="text-[#E5C158] font-medium">Destacado</span>
                      )}
                    </div>

                    <h3 className="font-display text-xl font-semibold text-white">
                      {srv.name}
                    </h3>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#32323A] flex items-center justify-between gap-3">
                    <div className="font-display text-2xl font-semibold text-[#D4AF37] tabular-nums whitespace-nowrap">
                      {formatGuarani(srv.price)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditServiceModal(srv)}
                        className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Modificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteService(srv.id)}
                        className="p-2 rounded-full bg-[#18181C] border border-[#2C2C34] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                        title="Eliminar servicio del catálogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: AGREGAR TURNO MANUAL (SOLO FECHA, HORA DE 1H, NOMBRE Y TELÉFONO) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#222228] text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <p className="text-xs font-semibold text-[#D4AF37]">Registro Manual de Turno</p>
              <h3 className="font-display text-2xl font-semibold text-white">
                Agendar Cliente (Bloque de 1 Hora)
              </h3>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Hora (1 Hora)</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  >
                    {STUDIO_TIME_SLOTS.map((t) => {
                      const isOccupied = bookedSlots.some(
                        (s) =>
                          s.date === manualDate &&
                          s.time === t &&
                          (s.status === 'booked' || s.status === 'completed')
                      );
                      return (
                        <option key={t} value={t} disabled={isOccupied}>
                          {t} hs {isOccupied ? '(Ocupado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Origen</label>
                  <select
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value as BookingSource)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  >
                    <option value="walkin">Presencial</option>
                    <option value="phone">Teléfono / WhatsApp</option>
                    <option value="online">Web</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ramiro Castelli"
                    value={manualClientName}
                    onChange={(e) => setManualClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 0981 443-221"
                    value={manualClientPhone}
                    onChange={(e) => setManualClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  />
                </div>
              </div>

              {manualError && <p className="text-xs text-[#ffb4ab]">{manualError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#222228] text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold cursor-pointer"
                >
                  {savingManual ? 'Guardando...' : 'Guardar y Bloquear Hora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR TURNO EXISTENTE */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setEditingApt(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#222228] text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <p className="text-xs font-semibold text-[#D4AF37]">Edición de Reserva</p>
              <h3 className="font-display text-2xl font-semibold text-white">
                Modificar Turno de {editingApt.clientName}
              </h3>
            </div>

            <form onSubmit={handleSaveAppointmentEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Hora (1 Hora)</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  >
                    {STUDIO_TIME_SLOTS.map((t) => {
                      const isOccupiedByOther = bookedSlots.some(
                        (s) =>
                          s.date === editDate &&
                          s.time === t &&
                          (s.status === 'booked' || s.status === 'completed') &&
                          s.appointmentId !== editingApt.id
                      );
                      return (
                        <option key={t} value={t} disabled={isOccupiedByOther}>
                          {t} hs {isOccupiedByOther ? '(Ocupado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AppointmentStatus)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado (Libera hora)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-5 py-2.5 rounded-full bg-[#222228] text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditApt}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold cursor-pointer"
                >
                  {savingEditApt ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR / EDITAR SERVICIO DEL CATÁLOGO INFORMATIVO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#222228] text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <p className="text-xs font-semibold text-[#D4AF37]">Catálogo de Precios</p>
              <h3 className="font-display text-2xl font-semibold text-white">
                {editingService ? 'Modificar Corte / Precio' : 'Nuevo Corte o Servicio'}
              </h3>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">
                  Nombre del Corte o Servicio *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Ej. Corte Clásico a Tijera & Vapor"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Categoría</label>
                  <select
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  >
                    <option value="corte">Corte</option>
                    <option value="barba">Barba</option>
                    <option value="ritual">Ritual</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Precio en Guaraníes (₲) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50000000}
                    step={5000}
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono tabular-nums focus-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">
                  Descripción del servicio *
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={280}
                  placeholder="Describe lo que incluye este corte o servicio..."
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={srvFeatured}
                  onChange={(e) => setSrvFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#D4AF37]"
                />
                <span className="text-xs text-white">
                  Mostrar como destacado en el catálogo informativo
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#222228] text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold cursor-pointer"
                >
                  {savingService
                    ? 'Guardando...'
                    : editingService
                    ? 'Guardar Cambios'
                    : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
