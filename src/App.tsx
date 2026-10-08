/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { StudioProvider } from './context/StudioContext';
import { ActiveView, Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ClientBookingView } from './components/ClientBookingView';
import { ServiceCatalogSection } from './components/ServiceCatalogSection';
import { StudioLocationSection } from './components/StudioLocationSection';
import { MyBookingsView } from './components/MyBookingsView';
import { BarberAdminPortal } from './components/BarberAdminPortal';
import { StudioFooterSection } from './components/StudioFooterSection';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('client');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setGmpQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <StudioProvider>
      <div className="min-h-screen bg-[#121214] text-white flex flex-col">
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          onNavigateSection={scrollToSection}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-1">
          {activeView === 'client' && (
            <>
              <HeroSection
                onScrollToBooking={() => scrollToSection('booking')}
                onScrollToCatalog={() => scrollToSection('catalog')}
              />
              <ClientBookingView
                onOpenMyBookings={() => {
                  setActiveView('my-bookings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <ServiceCatalogSection />
              <StudioLocationSection />
              <StudioFooterSection
                onScrollToBooking={() => scrollToSection('booking')}
                onScrollToCatalog={() => scrollToSection('catalog')}
                onScrollToLocation={() => scrollToSection('location')}
                onOpenAdmin={() => {
                  setActiveView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}

          {activeView === 'my-bookings' && (
            <MyBookingsView
              onBackToBooking={() => {
                setActiveView('client');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeView === 'admin' && <BarberAdminPortal />}
        </main>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onGoToAdmin={() => {
            setActiveView('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </StudioProvider>
  );
}
