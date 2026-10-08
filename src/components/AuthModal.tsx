import React, { useState } from 'react';
import { LogIn, LogOut, Scissors, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { SovereignEmblem } from './SovereignEmblem';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToAdmin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoToAdmin,
}) => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    signInWithGoogle,
    logout,
    unlockBarberMode,
  } = useStudio();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-[#1E1E24] border border-[#383842] p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#222228] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar ventana de acceso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <SovereignEmblem className="w-14 h-14" />
          <p className="text-xs font-semibold text-[#D4AF37] tracking-wider">
            Identidad & Sincronización Firebase
          </p>
          <h3 className="font-display text-2xl font-semibold text-white">
            {currentUser ? 'Tu Cuenta en Sovereign Craft' : 'Iniciar Sesión o Registrarse'}
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Autentícate con tu cuenta de Google para respaldar tus turnos en Firestore Database o
            acceder al Panel de Administración del Barbero.
          </p>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#18181C] border border-[#2C2C34] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA]">Usuario autenticado</span>
                <span className="text-white font-semibold">
                  {currentUser.displayName || 'Usuario Sovereign'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA]">Correo verificado</span>
                <span className="text-white font-mono">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA]">Rol activo</span>
                <span className="text-[#D4AF37] font-semibold">
                  {isAdmin ? 'Maestro Barbero (Admin)' : userProfile?.role === 'admin' ? 'Admin' : 'Cliente'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  unlockBarberMode();
                  onClose();
                  onGoToAdmin();
                }}
                className="w-full py-3.5 px-5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Abrir Portal del Barbero (Admin)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="w-full py-3 px-5 rounded-full bg-[#222228] border border-[#3A3A44] hover:border-[#ffb4ab] text-[#A1A1AA] hover:text-[#ffb4ab] text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#121214] text-xs font-semibold transition-all gold-glow flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {loading ? 'Conectando con Firebase Auth...' : 'Continuar con Google (Cliente / Admin)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                unlockBarberMode();
                onClose();
                onGoToAdmin();
              }}
              className="w-full py-3 px-5 rounded-full bg-[#222228] border border-[#3A3A44] hover:border-[#D4AF37] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Acceso Rápido al Portal del Barbero</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
