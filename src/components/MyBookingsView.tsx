import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Phone,
  Scissors,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { formatReadableSpanishDate, getUpcomingDates, STUDIO_TIME_SLOTS } from '../seedData';
import { Appointment } from '../types';

interface MyBookingsViewProps {
  onBackToBooking: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onBackToBooking }) => {
  const {
    appointments,
    bookedSlots,
    currentUser,
    signInWithGoogle,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
  } = useStudio();

  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const upcomingDates = getUpcomingDates(14);

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setEditDate(apt.date);
    setEditTime(apt.time);
    setEditClientName(apt.clientName);
    setEditClientPhone(apt.clientPhone);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setSaving(true);
    try {
      await updateReservation(editingApt.id, {
        date: editDate,
        time: editTime,
        clientName: editClientName,
        clientPhone: editClientPhone,
      });
      setEditingApt(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#121214] min-h-[75vh]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToBooking}
              className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#E5C158] mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Agenda de Reserva</span>
            </button>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-white">
              Mis Turnos Reservados
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Consulta, reprograma o cancela tus turnos de 1 hora en tiempo real.
            </p>
          </div>

          {!currentUser && (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-colors cursor-pointer"
            >
              Iniciar Sesión con Google
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-[2rem] bg-[#222228] border border-[#32323A] p-12 text-center space-y-4">
            <Scissors className="w-10 h-10 text-[#D4AF37] mx-auto" />
            <h2 className="font-display text-2xl text-white">
              No tienes turnos registrados todavía
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
              Selecciona una fecha y una hora libre en nuestra agenda interactiva para reservar tu
              turno.
            </p>
            <button
              type="button"
              onClick={onBackToBooking}
              className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-colors cursor-pointer"
            >
              Reservar mi Primer Turno
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((apt) => {
              const isCancelled = apt.status === 'cancelled';
              const isCompleted = apt.status === 'completed';

              return (
                <div
                  key={apt.id}
                  className={`rounded-[2rem] bg-[#222228] border p-6 flex flex-col justify-between gap-5 transition-all ${
                    isCancelled
                      ? 'border-[#282830] opacity-65'
                      : 'border-[#32323A] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[#A1A1AA]">
                        <span className="font-mono text-[#D4AF37] tabular-nums">
                          #{apt.id.slice(-5).toUpperCase()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Turno de 1 Hora</span>
                      </div>

                      <span
                        className={`font-medium flex items-center gap-1 ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isCancelled
                            ? 'text-[#ffb4ab]'
                            : 'text-[#D4AF37]'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completado</span>
                          </>
                        ) : isCancelled ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Confirmado</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-[#D4AF37]" />
                        <span>{apt.clientName}</span>
                      </h3>
                      <p className="text-xs text-[#A1A1AA] inline-flex items-center gap-1.5 font-mono tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{apt.clientPhone}</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#18181C] border border-[#2C2C34] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-white">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{formatReadableSpanishDate(apt.date)}</span>
                      </span>
                      <span className="font-mono font-semibold text-[#D4AF37] tabular-nums">
                        {apt.time} hs (1 hora)
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#32323A] flex flex-wrap items-center justify-end gap-2">
                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(apt)}
                          className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Cambiar Hora / Datos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReservationStatus(apt.id, 'cancelled')}
                          className="px-3.5 py-2 rounded-full bg-[#18181C] border border-[#3A3A44] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancelar Turno
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteReservation(apt.id)}
                      className="p-2 rounded-full bg-[#18181C] border border-[#2C2C34] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Reservation Modal */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-white">
                Modificar Turno
              </h3>
              <button
                type="button"
                onClick={() => setEditingApt(null)}
                className="text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Fecha</label>
                  <select
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white focus-gold"
                  >
                    {upcomingDates.map((d) => (
                      <option key={d.iso} value={d.iso}>
                        {d.dayNameShort} {d.dayNumber} {d.monthShort} ({d.iso})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Hora (Bloques de 1h)</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#2C2C34] text-xs text-white font-mono focus-gold"
                  >
                    {STUDIO_TIME_SLOTS.map((t) => {
                      const isTakenByOther = bookedSlots.some(
                        (s) =>
                          s.date === editDate &&
                          s.time === t &&
                          (s.status === 'booked' || s.status === 'completed') &&
                          s.appointmentId !== editingApt.id
                      );
                      return (
                        <option key={t} value={t} disabled={isTakenByOther}>
                          {t} hs {isTakenByOther ? '(Ocupado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-5 py-2.5 rounded-full bg-[#222228] text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
