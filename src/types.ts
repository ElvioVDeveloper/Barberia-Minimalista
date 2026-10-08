export type UserRole = 'client' | 'admin';

export type ServiceCategory = 'corte' | 'barba' | 'ritual' | 'combo';

export type SlotOccupancyStatus = 'booked' | 'completed' | 'cancelled';

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export type BookingSource = 'online' | 'walkin' | 'phone';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BarberService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  durationMinutes: number;
  visibility: 'public';
  featured: boolean;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BookedSlot {
  id: string; // YYYY-MM-DD_HHMM
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: SlotOccupancyStatus;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  appointmentId: string;
  ownerId: string;
  visibility: 'public';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Appointment {
  id: string;
  slotId: string;
  date: string;
  time: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  clientName: string;
  clientPhone: string;
  notes: string;
  status: AppointmentStatus;
  source: BookingSource;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Validation & Sanitization Constants synced verbatim with firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  TIME_PATTERN: /^[0-9]{2}:[0-9]{2}$/,
  MAX_ID_LEN: 128,
  NAME_MIN: 2,
  NAME_MAX: 80,
  DESC_MIN: 4,
  DESC_MAX: 280,
  PHONE_MIN: 6,
  PHONE_MAX: 30,
  NOTES_MAX: 240,
  PRICE_MIN: 0,
  PRICE_MAX: 50000000,
  DURATION_MIN: 10,
  DURATION_MAX: 240,
};

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function buildSlotId(date: string, time: string): string {
  return `${date}_${time.replace(':', '')}`;
}

export function normalizeTimeSlotToHour(time: string): string {
  if (!time || typeof time !== 'string') return '10:00';
  const hourPart = time.split(':')[0]?.padStart(2, '0') || '10';
  const hourNum = Math.max(9, Math.min(20, Number(hourPart) || 10));
  return `${String(hourNum).padStart(2, '0')}:00`;
}

export function formatGuarani(amount: number): string {
  const numeric = Math.round(Number(amount) || 0);
  return `${numeric.toLocaleString('es-PY')} ₲`;
}

export function normalizePriceToGuarani(price: number, serviceId?: string): number {
  const num = Number(price) || 0;
  if (num > 0 && num < 1000) {
    const legacyMap: Record<string, number> = {
      srv_corte_imperial: 80000,
      srv_ritual_completo: 130000,
      srv_afeitado_toalla: 70000,
      srv_fade_arquitectonico: 75000,
      srv_barba_escultural: 55000,
      srv_corte_ejecutivo: 70000,
    };
    if (serviceId && legacyMap[serviceId]) {
      return legacyMap[serviceId];
    }
    return Math.round(num * 2500);
  }
  return num;
}
