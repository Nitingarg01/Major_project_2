'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
