"use client";
import React from "react";
import Image from "next/image";

const WelcomePage: React.FC = () => {
  return (
    <div className="relative flex justify-center items-center min-h-[90vh] h-[90vh] overflow-hidden">
      {/* Centered Background Image */}
      <div className="absolute inset-0 flex justify-center items-center">
        <Image
          src="/splash.png"
          alt="Background Image"
          fill
          style={{ objectFit: "cover" }}
          className="z-[-1]"
        />
      </div>

      {/* Centered "Missouri Crossroads" Text */}
      <div className="text-center px-4">
        <h1 className="text-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold" style={{ 
          textShadow: "2px 2px 4px rgba(255, 255, 255, 0.8)" 
        }}>
          Missouri Crossroads
        </h1>
      </div>
    </div>
  );
};

export default WelcomePage;
