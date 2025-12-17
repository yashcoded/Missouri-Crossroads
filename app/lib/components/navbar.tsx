"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isAuthenticated, signOutUser } from "../utils/auth_service";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setIsLoggedIn(false);
      setUsername(null);
      setIsMobileMenuOpen(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        // For now, we'll use a placeholder username
        // You can enhance this by decoding the JWT token
        setUsername("User");
      }
    };

    checkAuth();
    
    // Check auth state periodically
    const interval = setInterval(checkAuth, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when clicking outside
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

  const navLinks = (
    <>
      <Link 
        href="/" 
        className="block py-3 px-4 text-lg font-bold text-blue-300 hover:text-blue-500 hover:bg-gray-800 transition duration-300 ease-in-out rounded-md min-h-[44px] flex items-center"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Home
      </Link>

      {isLoggedIn && (
        <Link 
          href="/test-aws" 
          className="block py-3 px-4 text-lg font-bold text-blue-300 hover:text-blue-500 hover:bg-gray-800 transition duration-300 ease-in-out rounded-md min-h-[44px] flex items-center"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Test AWS
        </Link>
      )}

      <Link 
        href="/map" 
        className="block py-3 px-4 text-lg font-bold text-blue-300 hover:text-blue-500 hover:bg-gray-800 transition duration-300 ease-in-out rounded-md min-h-[44px] flex items-center"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Map
      </Link>

      <Link 
        href="/lib/pages/aboutPage" 
        className="block py-3 px-4 text-lg font-bold text-blue-300 hover:text-blue-500 hover:bg-gray-800 transition duration-300 ease-in-out rounded-md min-h-[44px] flex items-center"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        About
      </Link>

      <Link 
        href="/lib/pages/ResourcesPage" 
        className="block py-3 px-4 text-lg font-bold text-blue-300 hover:text-blue-500 hover:bg-gray-800 transition duration-300 ease-in-out rounded-md min-h-[44px] flex items-center"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Resources
      </Link>
    </>
  );

  return (
    <nav className="bg-gray-900 w-full min-h-[60px] flex flex-row justify-between items-center px-4 md:px-6 py-3 text-white relative z-50">
      {/* Desktop Navigation */}
      <div className="hidden md:flex w-full justify-start items-center space-x-4">
        <Link href="/" className="text-xl md:text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out min-h-[44px] flex items-center">
          Home
        </Link>
        {isLoggedIn && (
          <Link href="/test-aws" className="text-xl md:text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out min-h-[44px] flex items-center">
            Test AWS
          </Link>
        )}
        <Link href="/map" className="text-xl md:text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out min-h-[44px] flex items-center">
          Map
        </Link>
        <Link href="/lib/pages/aboutPage" className="text-xl md:text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out min-h-[44px] flex items-center">
          About
        </Link>
        <Link href="/lib/pages/ResourcesPage" className="text-xl md:text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out min-h-[44px] flex items-center">
          Resources
        </Link>
      </div>

      {/* Mobile Menu Button and Logo */}
      <div className="flex md:hidden w-full justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-300 min-h-[44px] flex items-center">
          MO Crossroads
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          className="p-2 rounded-md text-blue-300 hover:text-blue-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-lg">
          <div className="flex flex-col">
            {navLinks}
            <div className="border-t border-gray-700 py-3 px-4">
              {isLoggedIn ? (
                <div className="flex flex-col gap-3">
                  <span
                    className="text-base font-semibold text-blue-300 py-2"
                    title={username || "User"}
                  >
                    Hi, {username || "User"}!
                  </span>
                  <Button
                    id="navbar-logout" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 border border-blue-700 rounded shadow min-h-[44px] w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.location.href = "/test-aws";
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 border border-blue-700 rounded shadow min-h-[44px] w-full"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Auth Section */}
      <div className="hidden md:flex items-center gap-4">
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span
              className="text-base md:text-lg font-semibold min-w-max truncate max-w-[150px] text-blue-300"
              title={username || "User"}
            >
              Hi, {username || "User"}!
            </span>
            <Button
              id="navbar-logout" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow min-h-[44px]"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => (window.location.href = "/test-aws")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow min-h-[44px]"
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}