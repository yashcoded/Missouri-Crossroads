// RootLayout.tsx
import './globals.css';
// import { Inter } from "next/font/google";
import Navbar from './lib/components/navbar';
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';

// const inter = Inter({ subsets: ["latin"] });

import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Missouri Crossroads',
  description:
    "Interactive map and location management for Missouri's historical locations",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MO Crossroads',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // Allow zooming for accessibility
  themeColor: '#000000',
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA meta tags - manifest link is added automatically by Next.js metadata API */}
        <meta name="application-name" content="MO Crossroads" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MO Crossroads" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <Navbar />
        <NextAppDirEmotionCacheProvider options={{ key: 'css' }}>
          {children}
        </NextAppDirEmotionCacheProvider>
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;
