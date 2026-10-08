import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  Appointment,
  AppointmentStatus,
  BarberService,
  BLUEPRINT_CONSTRAINTS,
  BookedSlot,
  BookingSource,
  buildSlotId,
  normalizePriceToGuarani,
  normalizeTimeSlotToHour,
  sanitizeText,
  ServiceCategory,
  UserProfile,
} from '../types';
import { getInitialSeedBookings, INITIAL_SERVICES } from '../seedData';

const BOOTSTRAPPED_ADMIN_EMAIL = 'danielalvarenga751@gmail.com';

interface CreateReservationInput {
  date: string;
  time: string;
  serviceId?: string;
  clientName: string;
  clientPhone: string;
  notes?: string;
  source?: BookingSource;
}

interface UpdateReservationInput {
  date?: string;
  time?: string;
  serviceId?: string;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  status?: AppointmentStatus;
}

interface ServiceFormInput {
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  durationMinutes: number;
  featured: boolean;
}

interface StudioContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  isAdmin: boolean;
  barberModeUnlocked: boolean;
  services: BarberService[];
  bookedSlots: BookedSlot[];
  appointments: Appointment[];
  loadingData: boolean;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  unlockBarberMode: () => void;
  createReservation: (input: CreateReservationInput) => Promise<Appointment>;
  updateReservation: (appointmentId: string, updates: UpdateReservationInput) => Promise<void>;
  updateReservationStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  deleteReservation: (appointmentId: string) => Promise<void>;
  createService: (input: ServiceFormInput) => Promise<void>;
  updateService: (serviceId: string, input: ServiceFormInput) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  restoreSeedData: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [barberModeUnlocked, setBarberModeUnlocked] = useState<boolean>(false);

  const initialSeed = useRef(getInitialSeedBookings('system_seed'));
  const [services, setServices] = useState<BarberService[]>(INITIAL_SERVICES);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>(initialSeed.current.bookedSlots);
  const [appointments, setAppointments] = useState<Appointment[]>(initialSeed.current.appointments);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const hasSeededRef = useRef<boolean>(false);

  const isAdmin = Boolean(
    barberModeUnlocked ||
      userProfile?.role === 'admin' ||
      (currentUser?.email &&
        currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase())
  );

  // 1. Auth state listener & User Profile sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isOwnerAdmin =
          user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        if (isOwnerAdmin) {
          setBarberModeUnlocked(true);
        }

        const userPath = `users/${user.uid}`;
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: sanitizeText(
                user.displayName || user.email?.split('@')[0] || 'Cliente BarberFlow',
                BLUEPRINT_CONSTRAINTS.NAME_MAX
              ),
              email: sanitizeText(user.email || 'cliente@barberflow.studio', 120),
              phone: sanitizeText(user.phoneNumber || '', BLUEPRINT_CONSTRAINTS.PHONE_MAX),
              role: isOwnerAdmin ? 'admin' : 'client',
            };
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setUserProfile(newProfile);
          }
        } catch (error) {
          // Non-fatal if user email isn't verified or offline, log structured error
          console.warn('Profile sync notice:', error);
        }
      } else {
        setUserProfile(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // 2. Public Real-Time Listeners for Services & BookedSlots + Automatic Initial Seeding
  useEffect(() => {
    if (!authReady) return;

    const servicesQuery = query(
      collection(db, 'services'),
      where('visibility', '==', 'public')
    );

    const unsubServices = onSnapshot(
      servicesQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty and user is signed in, automatically seed Firestore!
          if (currentUser && !hasSeededRef.current) {
            hasSeededRef.current = true;
            try {
              await seedDatabaseForUser(currentUser.uid);
            } catch (err) {
              console.warn('Initial seed notice:', err);
            }
          } else {
            setServices(INITIAL_SERVICES);
          }
        } else {
          const loadedServices: BarberService[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name,
              category: data.category,
              description: data.description,
              price: normalizePriceToGuarani(Number(data.price), docSnap.id),
              durationMinutes: Number(data.durationMinutes),
              visibility: 'public',
              featured: Boolean(data.featured),
              ownerId: data.ownerId,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };
          });
          setServices(loadedServices);
        }
        setLoadingData(false);
      },
      (error) => {
        setLoadingData(false);
        handleFirestoreError(error, OperationType.LIST, 'services');
      }
    );

    const slotsQuery = query(
      collection(db, 'bookedSlots'),
      where('visibility', '==', 'public')
    );

    const unsubSlots = onSnapshot(
      slotsQuery,
      (snapshot) => {
        if (snapshot.empty && !currentUser) {
          setBookedSlots(initialSeed.current.bookedSlots);
          return;
        }
        if (!snapshot.empty) {
          const loadedSlots: BookedSlot[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              date: d.date,
              time: normalizeTimeSlotToHour(d.time),
              status: d.status,
              serviceId: d.serviceId,
              serviceName: d.serviceName,
              servicePrice: normalizePriceToGuarani(Number(d.servicePrice), d.serviceId),
              appointmentId: d.appointmentId,
              ownerId: d.ownerId,
              visibility: 'public',
              createdAt: d.createdAt,
              updatedAt: d.updatedAt,
            };
          });
          setBookedSlots(loadedSlots);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookedSlots');
      }
    );

    return () => {
      unsubServices();
      unsubSlots();
    };
  }, [authReady, currentUser]);

  // 3. Authenticated Real-Time Listener for Private Appointments
  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setAppointments(initialSeed.current.appointments);
      return;
    }

    const isBootstrapped =
      currentUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    const appointmentsQuery = isBootstrapped
      ? collection(db, 'appointments')
      : query(collection(db, 'appointments'), where('ownerId', '==', currentUser.uid));

    const unsubAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Appointment[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              slotId: d.slotId,
              date: d.date,
              time: normalizeTimeSlotToHour(d.time),
              serviceId: d.serviceId,
              serviceName: d.serviceName,
              servicePrice: normalizePriceToGuarani(Number(d.servicePrice), d.serviceId),
              durationMinutes: 60,
              clientName: d.clientName,
              clientPhone: d.clientPhone,
              notes: d.notes || '',
              status: d.status,
              source: d.source,
              ownerId: d.ownerId,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt,
            };
          });
          // Sort by date and time
          loaded.sort((a, b) => `${a.date}_${a.time}`.localeCompare(`${b.date}_${b.time}`));
          setAppointments(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
      }
    );

    return () => unsubAppointments();
  }, [authReady, currentUser]);

  async function seedDatabaseForUser(uid: string) {
    // Step 1: Write initial services first
    const serviceBatch = writeBatch(db);
    for (const srv of INITIAL_SERVICES) {
      const srvRef = doc(db, 'services', srv.id);
      serviceBatch.set(srvRef, {
        name: sanitizeText(srv.name, BLUEPRINT_CONSTRAINTS.NAME_MAX),
        category: srv.category,
        description: sanitizeText(srv.description, BLUEPRINT_CONSTRAINTS.DESC_MAX),
        price: srv.price,
        durationMinutes: 60,
        visibility: 'public',
        featured: srv.featured,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await serviceBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'services');
    }

    // Step 2: Write initial bookedSlots and appointments atomically in a second batch
    const seedBookings = getInitialSeedBookings(uid);
    const bookingBatch = writeBatch(db);

    for (const slot of seedBookings.bookedSlots) {
      const slotRef = doc(db, 'bookedSlots', slot.id);
      bookingBatch.set(slotRef, {
        date: slot.date,
        time: slot.time,
        status: slot.status,
        serviceId: slot.serviceId,
        serviceName: slot.serviceName,
        servicePrice: slot.servicePrice,
        appointmentId: slot.appointmentId,
        ownerId: uid,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const apt of seedBookings.appointments) {
      const aptRef = doc(db, 'appointments', apt.id);
      bookingBatch.set(aptRef, {
        slotId: apt.slotId,
        date: apt.date,
        time: apt.time,
        serviceId: apt.serviceId,
        serviceName: apt.serviceName,
        servicePrice: apt.servicePrice,
        durationMinutes: 60,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        notes: apt.notes,
        status: apt.status,
        source: apt.source,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await bookingBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    }
  }

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setBarberModeUnlocked(false);
  };

  const unlockBarberMode = () => {
    setBarberModeUnlocked(true);
  };

  const createReservation = async (input: CreateReservationInput): Promise<Appointment> => {
    const cleanTime = normalizeTimeSlotToHour(input.time);
    const cleanName = sanitizeText(input.clientName, BLUEPRINT_CONSTRAINTS.NAME_MAX);
    const cleanPhone = sanitizeText(input.clientPhone, BLUEPRINT_CONSTRAINTS.PHONE_MAX);
    const cleanNotes = sanitizeText(input.notes || '', BLUEPRINT_CONSTRAINTS.NOTES_MAX);
    const source: BookingSource = input.source || 'online';

    const slotId = buildSlotId(input.date, cleanTime);
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ownerUid = currentUser?.uid || 'guest_local';

    const newAppointment: Appointment = {
      id: appointmentId,
      slotId,
      date: input.date,
      time: cleanTime,
      serviceId: 'turno_general',
      serviceName: 'Turno de Barbería (1 Hora)',
      servicePrice: 80000,
      durationMinutes: 60,
      clientName: cleanName.length >= 2 ? cleanName : 'Cliente BarberFlow',
      clientPhone: cleanPhone.length >= 6 ? cleanPhone : '0981 000-000',
      notes: cleanNotes,
      status: 'confirmed',
      source,
      ownerId: ownerUid,
    };

    const newSlot: BookedSlot = {
      id: slotId,
      date: input.date,
      time: cleanTime,
      status: 'booked',
      serviceId: 'turno_general',
      serviceName: newAppointment.serviceName,
      servicePrice: newAppointment.servicePrice,
      appointmentId,
      ownerId: ownerUid,
      visibility: 'public',
    };

    // Optimistic immediate UI update
    setBookedSlots((prev) => [...prev.filter((s) => s.id !== slotId), newSlot]);
    setAppointments((prev) =>
      [...prev, newAppointment].sort((a, b) =>
        `${a.date}_${a.time}`.localeCompare(`${b.date}_${b.time}`)
      )
    );

    if (currentUser) {
      // Atomic batch write for /bookedSlots/{slotId} and /appointments/{appointmentId}
      const batch = writeBatch(db);
      const slotRef = doc(db, 'bookedSlots', slotId);
      const aptRef = doc(db, 'appointments', appointmentId);

      batch.set(slotRef, {
        date: newSlot.date,
        time: newSlot.time,
        status: newSlot.status,
        serviceId: newSlot.serviceId,
        serviceName: newSlot.serviceName,
        servicePrice: newSlot.servicePrice,
        appointmentId: newSlot.appointmentId,
        ownerId: currentUser.uid,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(aptRef, {
        slotId: newAppointment.slotId,
        date: newAppointment.date,
        time: newAppointment.time,
        serviceId: newAppointment.serviceId,
        serviceName: newAppointment.serviceName,
        servicePrice: newAppointment.servicePrice,
        durationMinutes: newAppointment.durationMinutes,
        clientName: newAppointment.clientName,
        clientPhone: newAppointment.clientPhone,
        notes: newAppointment.notes,
        status: newAppointment.status,
        source: newAppointment.source,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `appointments/${appointmentId}`);
      }
    }

    return newAppointment;
  };

  const updateReservationStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<void> => {
    const existingApt = appointments.find((a) => a.id === appointmentId);
    if (!existingApt) return;

    const newSlotStatus = status === 'confirmed' ? 'booked' : status;

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
    setBookedSlots((prev) =>
      prev.map((s) =>
        s.id === existingApt.slotId ? { ...s, status: newSlotStatus } : s
      )
    );

    if (currentUser) {
      try {
        const aptRef = doc(db, 'appointments', appointmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          const batch = writeBatch(db);
          const slotRef = doc(db, 'bookedSlots', existingApt.slotId);
          batch.update(aptRef, {
            status,
            updatedAt: serverTimestamp(),
          });
          batch.update(slotRef, {
            status: newSlotStatus,
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
      }
    }
  };

  const updateReservation = async (
    appointmentId: string,
    updates: UpdateReservationInput
  ): Promise<void> => {
    const existingApt = appointments.find((a) => a.id === appointmentId);
    if (!existingApt) return;

    const newDate = updates.date || existingApt.date;
    const newTime = normalizeTimeSlotToHour(updates.time || existingApt.time);
    const newSlotId = buildSlotId(newDate, newTime);
    const newStatus = updates.status || existingApt.status;
    const newSlotStatus = newStatus === 'confirmed' ? 'booked' : newStatus;

    const updatedApt: Appointment = {
      ...existingApt,
      slotId: newSlotId,
      date: newDate,
      time: newTime,
      serviceId: existingApt.serviceId || 'turno_general',
      serviceName: existingApt.serviceName || 'Turno de Barbería (1 Hora)',
      servicePrice: Number(existingApt.servicePrice || 80000),
      durationMinutes: 60,
      clientName: sanitizeText(
        updates.clientName ?? existingApt.clientName,
        BLUEPRINT_CONSTRAINTS.NAME_MAX
      ),
      clientPhone: sanitizeText(
        updates.clientPhone ?? existingApt.clientPhone,
        BLUEPRINT_CONSTRAINTS.PHONE_MAX
      ),
      notes: sanitizeText(
        updates.notes ?? existingApt.notes,
        BLUEPRINT_CONSTRAINTS.NOTES_MAX
      ),
      status: newStatus,
    };

    const updatedSlot: BookedSlot = {
      id: newSlotId,
      date: newDate,
      time: newTime,
      status: newSlotStatus,
      serviceId: updatedApt.serviceId,
      serviceName: updatedApt.serviceName,
      servicePrice: updatedApt.servicePrice,
      appointmentId,
      ownerId: existingApt.ownerId,
      visibility: 'public',
    };

    setAppointments((prev) =>
      prev
        .map((a) => (a.id === appointmentId ? updatedApt : a))
        .sort((a, b) => `${a.date}_${a.time}`.localeCompare(`${b.date}_${b.time}`))
    );

    setBookedSlots((prev) => [
      ...prev.filter((s) => s.id !== existingApt.slotId && s.id !== newSlotId),
      updatedSlot,
    ]);

    if (currentUser) {
      try {
        const aptRef = doc(db, 'appointments', appointmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          const batch = writeBatch(db);

          batch.update(aptRef, {
            slotId: updatedApt.slotId,
            date: updatedApt.date,
            time: updatedApt.time,
            serviceId: updatedApt.serviceId,
            serviceName: updatedApt.serviceName,
            servicePrice: updatedApt.servicePrice,
            durationMinutes: updatedApt.durationMinutes,
            clientName: updatedApt.clientName,
            clientPhone: updatedApt.clientPhone,
            notes: updatedApt.notes,
            status: updatedApt.status,
            updatedAt: serverTimestamp(),
          });

          if (existingApt.slotId === newSlotId) {
            const slotRef = doc(db, 'bookedSlots', newSlotId);
            batch.update(slotRef, {
              date: updatedSlot.date,
              time: updatedSlot.time,
              serviceId: updatedSlot.serviceId,
              serviceName: updatedSlot.serviceName,
              servicePrice: updatedSlot.servicePrice,
              status: updatedSlot.status,
              updatedAt: serverTimestamp(),
            });
          } else {
            const oldSlotRef = doc(db, 'bookedSlots', existingApt.slotId);
            const newSlotRef = doc(db, 'bookedSlots', newSlotId);
            batch.delete(oldSlotRef);
            batch.set(newSlotRef, {
              date: updatedSlot.date,
              time: updatedSlot.time,
              status: updatedSlot.status,
              serviceId: updatedSlot.serviceId,
              serviceName: updatedSlot.serviceName,
              servicePrice: updatedSlot.servicePrice,
              appointmentId,
              ownerId: currentUser.uid,
              visibility: 'public',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
      }
    }
  };

  const deleteReservation = async (appointmentId: string): Promise<void> => {
    const existingApt = appointments.find((a) => a.id === appointmentId);
    if (!existingApt) return;

    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    setBookedSlots((prev) => prev.filter((s) => s.id !== existingApt.slotId));

    if (currentUser) {
      try {
        const aptRef = doc(db, 'appointments', appointmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          const batch = writeBatch(db);
          batch.delete(aptRef);
          batch.delete(doc(db, 'bookedSlots', existingApt.slotId));
          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `appointments/${appointmentId}`);
      }
    }
  };

  const createService = async (input: ServiceFormInput): Promise<void> => {
    const serviceId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ownerUid = currentUser?.uid || 'guest_local';

    const newService: BarberService = {
      id: serviceId,
      name: sanitizeText(input.name, BLUEPRINT_CONSTRAINTS.NAME_MAX),
      category: input.category,
      description: sanitizeText(input.description, BLUEPRINT_CONSTRAINTS.DESC_MAX),
      price: Math.max(
        BLUEPRINT_CONSTRAINTS.PRICE_MIN,
        Math.min(BLUEPRINT_CONSTRAINTS.PRICE_MAX, Number(input.price))
      ),
      durationMinutes: Math.max(
        BLUEPRINT_CONSTRAINTS.DURATION_MIN,
        Math.min(BLUEPRINT_CONSTRAINTS.DURATION_MAX, Number(input.durationMinutes))
      ),
      visibility: 'public',
      featured: Boolean(input.featured),
      ownerId: ownerUid,
    };

    setServices((prev) => [...prev, newService]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'services', serviceId), {
          name: newService.name,
          category: newService.category,
          description: newService.description,
          price: newService.price,
          durationMinutes: newService.durationMinutes,
          visibility: 'public',
          featured: newService.featured,
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `services/${serviceId}`);
      }
    }
  };

  const updateService = async (
    serviceId: string,
    input: ServiceFormInput
  ): Promise<void> => {
    const existingSrv = services.find((s) => s.id === serviceId);
    if (!existingSrv) return;

    const cleanName = sanitizeText(input.name, BLUEPRINT_CONSTRAINTS.NAME_MAX);
    const cleanDesc = sanitizeText(input.description, BLUEPRINT_CONSTRAINTS.DESC_MAX);
    const cleanPrice = Math.max(
      BLUEPRINT_CONSTRAINTS.PRICE_MIN,
      Math.min(BLUEPRINT_CONSTRAINTS.PRICE_MAX, Number(input.price))
    );
    const cleanDuration = Math.max(
      BLUEPRINT_CONSTRAINTS.DURATION_MIN,
      Math.min(BLUEPRINT_CONSTRAINTS.DURATION_MAX, Number(input.durationMinutes))
    );

    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              name: cleanName,
              category: input.category,
              description: cleanDesc,
              price: cleanPrice,
              durationMinutes: cleanDuration,
              featured: Boolean(input.featured),
            }
          : s
      )
    );

    if (currentUser) {
      try {
        const srvRef = doc(db, 'services', serviceId);
        const srvSnap = await getDoc(srvRef);
        if (srvSnap.exists()) {
          await updateDoc(srvRef, {
            name: cleanName,
            category: input.category,
            description: cleanDesc,
            price: cleanPrice,
            durationMinutes: cleanDuration,
            featured: Boolean(input.featured),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(srvRef, {
            name: cleanName,
            category: input.category,
            description: cleanDesc,
            price: cleanPrice,
            durationMinutes: cleanDuration,
            visibility: 'public',
            featured: Boolean(input.featured),
            ownerId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `services/${serviceId}`);
      }
    }
  };

  const deleteService = async (serviceId: string): Promise<void> => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));

    if (currentUser) {
      try {
        const srvRef = doc(db, 'services', serviceId);
        const srvSnap = await getDoc(srvRef);
        if (srvSnap.exists()) {
          await deleteDoc(srvRef);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `services/${serviceId}`);
      }
    }
  };

  const restoreSeedData = async (): Promise<void> => {
    if (currentUser) {
      await seedDatabaseForUser(currentUser.uid);
    } else {
      const freshSeed = getInitialSeedBookings('system_seed');
      setServices(INITIAL_SERVICES);
      setBookedSlots(freshSeed.bookedSlots);
      setAppointments(freshSeed.appointments);
    }
  };

  return (
    <StudioContext.Provider
      value={{
        currentUser,
        userProfile,
        authReady,
        isAdmin,
        barberModeUnlocked,
        services,
        bookedSlots,
        appointments,
        loadingData,
        signInWithGoogle,
        logout,
        unlockBarberMode,
        createReservation,
        updateReservation,
        updateReservationStatus,
        deleteReservation,
        createService,
        updateService,
        deleteService,
        restoreSeedData,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio debe usarse dentro de un StudioProvider');
  }
  return ctx;
}
