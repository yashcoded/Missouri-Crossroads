'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isAuthenticated, signOutUser } from '../utils/auth_service';

const UMSL_RED = '#BA0C2F';
const UMSL_GOLD = '#EAAB00';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPwaHelp, setShowPwaHelp] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setIsLoggedIn(false);
      setUsername(null);
      setIsMobileMenuOpen(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        setUsername('User');
      }
    };

    checkAuth();

    const interval = setInterval(checkAuth, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const navLinkClass =
    'block min-h-[44px] rounded-md px-4 py-3 text-lg font-bold text-zinc-200 transition duration-300 ease-in-out hover:bg-white/5 hover:text-[#EAAB00] flex items-center';

  const desktopLinkClass =
    'min-h-[44px] flex items-center text-xl md:text-2xl font-bold text-zinc-200 transition duration-300 ease-in-out hover:text-[#EAAB00]';

  const navLinks = (
    <>
      <Link
        href="/"
        className={navLinkClass}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Home
      </Link>

      {isLoggedIn && (
        <Link
          href="/test-aws"
          className={navLinkClass}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Test AWS
        </Link>
      )}

      <Link
        href="/map"
        className={navLinkClass}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Map
      </Link>
    </>
  );

  return (
    <nav
      className="w-full min-h-[60px] flex flex-row justify-between items-center px-4 md:px-6 py-3 text-white sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        background: '#18181B',
        borderColor: 'rgba(234,171,0,0.25)',
      }}
    >
      {/* Desktop Navigation */}
      <div className="hidden w-full items-center justify-start space-x-4 md:flex">
        <Link href="/" className={desktopLinkClass}>
          Home
        </Link>

        {isLoggedIn && (
          <Link href="/test-aws" className={desktopLinkClass}>
            Test AWS
          </Link>
        )}

        <Link href="/map" className={desktopLinkClass}>
          Map
        </Link>
      </div>

      {/* Mobile Menu Button and Logo */}
      <div className="flex w-full items-center justify-between md:hidden">
        <Link
          href="/"
          className="flex min-h-[44px] items-center text-xl font-bold text-zinc-100"
        >
          MO Crossroads
        </Link>

        <button
          onClick={e => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-md p-2 text-zinc-200 transition hover:bg-white/5 hover:text-[#EAAB00] focus:outline-none focus:ring-2"
          style={{ outlineColor: UMSL_GOLD }}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="absolute left-0 right-0 top-full border-t shadow-lg md:hidden"
          style={{
            background: '#18181B',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex flex-col">
            {navLinks}

            <div
              className="px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex flex-col gap-3">
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    setShowPwaHelp(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="min-h-[44px] w-full rounded border bg-transparent px-3 py-2 font-semibold text-zinc-100 shadow transition hover:text-black"
                  style={{
                    borderColor: 'rgba(234,171,0,0.55)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = UMSL_GOLD;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Install App
                </Button>
              </div>

              {isLoggedIn && (
                <div className="mt-3 flex flex-col gap-3">
                  <span
                    className="py-2 text-base font-semibold text-zinc-200"
                    title={username || 'User'}
                  >
                    Hi, {username || 'User'}!
                  </span>

                  <Button
                    id="navbar-logout"
                    className="min-h-[44px] w-full rounded border px-4 py-3 font-semibold text-white shadow"
                    style={{
                      backgroundColor: UMSL_RED,
                      borderColor: '#8f0924',
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Auth Section */}
      <div className="hidden items-center gap-4 md:flex">
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span
              className="max-w-[150px] min-w-max truncate text-base font-semibold text-zinc-200 md:text-lg"
              title={username || 'User'}
            >
              Hi, {username || 'User'}!
            </span>

            <Button
              id="navbar-logout"
              className="min-h-[44px] rounded border px-4 py-2 font-semibold text-white shadow"
              style={{
                backgroundColor: UMSL_RED,
                borderColor: '#8f0924',
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>

            <Button
              onClick={() => setShowPwaHelp(true)}
              className="min-h-[44px] rounded border bg-transparent px-3 py-2 font-semibold text-zinc-100 shadow transition hover:text-black"
              style={{
                borderColor: 'rgba(234,171,0,0.55)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = UMSL_GOLD;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Show install instructions"
            >
              Install App
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowPwaHelp(true)}
              className="min-h-[44px] rounded border bg-transparent px-3 py-2 font-semibold text-zinc-100 shadow transition hover:text-black"
              style={{
                borderColor: 'rgba(234,171,0,0.55)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = UMSL_GOLD;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Show install instructions"
            >
              Install App
            </Button>
          </div>
        )}
      </div>

      {/* PWA install instructions modal */}
      {showPwaHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-help-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white text-gray-900 shadow-xl dark:bg-gray-900 dark:text-white">
            <div className="flex items-start justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 id="pwa-help-title" className="text-lg font-semibold">
                  Install Missouri Crossroads
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Quick steps to add the app to your device.
                </p>
              </div>
              <button
                onClick={() => setShowPwaHelp(false)}
                aria-label="Close install instructions"
                className="ml-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-5 w-5 text-gray-700 dark:text-gray-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-none">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: 'rgba(234,171,0,0.12)',
                      color: UMSL_RED,
                    }}
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v14M5 12h14"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-medium">
                    Android / Desktop (Chrome/Edge)
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Use the browser install prompt or click the menu (⋮) →
                    "Install app" / use the install icon in the address bar.
                    After installing, the app runs standalone and works offline.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-none">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: 'rgba(234,171,0,0.12)',
                      color: UMSL_RED,
                    }}
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7h16M4 12h16M4 17h16"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-medium">iOS (Safari)</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    iOS doesn't support the automatic prompt. Open the Share
                    menu (▤) and choose <strong>"Add to Home Screen"</strong>.
                    Then open the app from your home screen.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setShowPwaHelp(false)}
                  className="w-full text-white"
                  style={{ backgroundColor: UMSL_RED }}
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
