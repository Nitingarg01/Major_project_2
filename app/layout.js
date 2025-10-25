'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
