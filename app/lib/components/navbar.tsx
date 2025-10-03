"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isAuthenticated, signOutUser } from "../utils/auth_service";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setIsLoggedIn(false);
      setUsername(null);
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

  return (
    <nav className="bg-gray-900 w-full h-[10vh] flex flex-row justify-between items-center px-6 py-3 text-white">
      <div className="flex w-full justify-start">
        <Link href="/" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
          Home
        </Link>

        {isLoggedIn ? (
          <Link href="/test-aws" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
            Test AWS
          </Link>
        ) : null}

        <Link href="/map" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
          Map
        </Link>

        <Link href="/lib/pages/aboutPage" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out mr-4">
          About
        </Link>

        <Link href="/lib/pages/ResourcesPage" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out">
          Resources
        </Link>
      </div>
      
      <div className="">
        {isLoggedIn ? (
          <div className="flex items-center gap-6 w-full">
            <span
              className="text-lg font-semibold min-w-max truncate max-w-[150px] hover:underline cursor-pointer"
              title={username || "User"}
            >
              Hi, {username || "User"}!
            </span>
            <Button
              id="navbar-logout" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={() => (window.location.href = "/test-aws")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
            >
              Login
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}