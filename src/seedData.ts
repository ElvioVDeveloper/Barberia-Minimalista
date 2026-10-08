import { Appointment, BarberService, BookedSlot, buildSlotId } from './types';

// Intervalos fijos exactos de 1 hora (sin fracciones de minutos)
export const STUDIO_TIME_SLOTS: string[] = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export function formatLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUpcomingDates(daysCount = 14): {
  iso: string;
  dayNameShort: string;
  dayNameFull: string;
  dayNumber: string;
  monthShort: string;
  monthFull: string;
  isToday: boolean;
}[] {
  const today = new Date();
  const daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthsShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthsFull = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const list = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = formatLocalISODate(d);
    list.push({
      iso,
      dayNameShort: daysShort[d.getDay()],
      dayNameFull: daysFull[d.getDay()],
      dayNumber: String(d.getDate()).padStart(2, '0'),
      monthShort: monthsShort[d.getMonth()],
      monthFull: monthsFull[d.getMonth()],
      isToday: i === 0,
    });
  }
  return list;
}

export function formatReadableSpanishDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day);
  const daysFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthsFull = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return `${daysFull[d.getDay()]} ${String(day).padStart(2, '0')} de ${monthsFull[month]}, ${year}`;
}

export const INITIAL_SERVICES: BarberService[] = [
  {
    id: 'srv_corte_imperial',
    name: 'Corte Imperial Sovereign',
    category: 'corte',
    description:
      'Corte de precisión a tijera japonesa y degradado progresivo a navaja, lavado revitalizante con carbón activo y peinado con pomada mate de autor.',
    price: 80000,
    durationMinutes: 60,
    visibility: 'public',
    featured: true,
    ownerId: 'system_seed',
  },
  {
    id: 'srv_ritual_completo',
    name: 'Ritual Maestro: Corte & Barba Real',
    category: 'combo',
    description:
      'La experiencia insignia de la barbería. Incluye Corte Imperial, esculpido geométrico de barba, doble toalla caliente aromática y masaje craneal.',
    price: 130000,
    durationMinutes: 60,
    visibility: 'public',
    featured: true,
    ownerId: 'system_seed',
  },
  {
    id: 'srv_afeitado_toalla',
    name: 'Afeitado Tradicional a Navaja & Vapor',
    category: 'ritual',
    description:
      'Ritual clásico de tres toallas calientes con aceites esenciales de sándalo, espuma montada con brocha tejón punta de plata y pasada doble a navaja libre.',
    price: 70000,
    durationMinutes: 60,
    visibility: 'public',
    featured: true,
    ownerId: 'system_seed',
  },
  {
    id: 'srv_fade_arquitectonico',
    name: 'Skin Fade Arquitectónico & Textura',
    category: 'corte',
    description:
      'Degradado milimétrico desde piel con transición limpia y diseño de estructura superior adaptado a la morfología craneal.',
    price: 75000,
    durationMinutes: 60,
    visibility: 'public',
    featured: false,
    ownerId: 'system_seed',
  },
  {
    id: 'srv_barba_escultural',
    name: 'Perfilado Escultural de Barba',
    category: 'barba',
    description:
      'Alineación de contornos con navaja, rebaje por niveles a tijera, compresa tibia de eucalipto e hidratación profunda con óleo de cedro.',
    price: 55000,
    durationMinutes: 60,
    visibility: 'public',
    featured: false,
    ownerId: 'system_seed',
  },
  {
    id: 'srv_corte_ejecutivo',
    name: 'Corte Clásico Ejecutivo a Tijera',
    category: 'corte',
    description:
      'Trabajado íntegramente a peine y tijera para una caída natural y distinguida, con terminación de cuello a navaja y tónico refrescante.',
    price: 70000,
    durationMinutes: 60,
    visibility: 'public',
    featured: false,
    ownerId: 'system_seed',
  },
];

export function getInitialSeedBookings(ownerId = 'system_seed'): {
  bookedSlots: BookedSlot[];
  appointments: Appointment[];
} {
  const dates = getUpcomingDates(4);
  const todayIso = dates[0]?.iso || formatLocalISODate(new Date());
  const tomorrowIso = dates[1]?.iso || todayIso;
  const dayAfterIso = dates[2]?.iso || todayIso;

  const sampleDefinitions = [
    {
      id: 'apt_seed_1',
      date: todayIso,
      time: '10:00',
      clientName: 'Mateo Valenzuela',
      clientPhone: '0981 458-291',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'online' as const,
    },
    {
      id: 'apt_seed_2',
      date: todayIso,
      time: '12:00',
      clientName: 'Santiago Mendizábal',
      clientPhone: '0982 632-011',
      notes: 'Turno de 1 hora',
      status: 'completed' as const,
      source: 'online' as const,
    },
    {
      id: 'apt_seed_3',
      date: todayIso,
      time: '15:00',
      clientName: 'Nicolás Echeverría',
      clientPhone: '0971 589-134',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'phone' as const,
    },
    {
      id: 'apt_seed_4',
      date: todayIso,
      time: '17:00',
      clientName: 'Lucas Albarracín',
      clientPhone: '0985 310-977',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'walkin' as const,
    },
    {
      id: 'apt_seed_5',
      date: tomorrowIso,
      time: '11:00',
      clientName: 'Joaquín Salvatierra',
      clientPhone: '0981 490-266',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'online' as const,
    },
    {
      id: 'apt_seed_6',
      date: tomorrowIso,
      time: '16:00',
      clientName: 'Facundo Benítez',
      clientPhone: '0991 721-488',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'online' as const,
    },
    {
      id: 'apt_seed_7',
      date: dayAfterIso,
      time: '14:00',
      clientName: 'Tomás Altamirano',
      clientPhone: '0983 644-120',
      notes: 'Turno de 1 hora',
      status: 'confirmed' as const,
      source: 'phone' as const,
    },
  ];

  const bookedSlots: BookedSlot[] = [];
  const appointments: Appointment[] = [];

  for (const item of sampleDefinitions) {
    const slotId = buildSlotId(item.date, item.time);
    const slotStatus = item.status === 'confirmed' ? 'booked' : item.status;

    bookedSlots.push({
      id: slotId,
      date: item.date,
      time: item.time,
      status: slotStatus,
      serviceId: 'turno_general',
      serviceName: 'Turno de Barbería (1 Hora)',
      servicePrice: 80000,
      appointmentId: item.id,
      ownerId,
      visibility: 'public',
    });

    appointments.push({
      id: item.id,
      slotId,
      date: item.date,
      time: item.time,
      serviceId: 'turno_general',
      serviceName: 'Turno de Barbería (1 Hora)',
      servicePrice: 80000,
      durationMinutes: 60,
      clientName: item.clientName,
      clientPhone: item.clientPhone,
      notes: item.notes,
      status: item.status,
      source: item.source,
      ownerId,
    });
  }

  return { bookedSlots, appointments };
}
