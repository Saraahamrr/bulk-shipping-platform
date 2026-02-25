// app/ClientLayout.tsx
'use client';

import { ReactNode } from 'react';
import { AppProvider } from './context/AppContext';
import MainLayout from '@/src/components/MainLayout';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <MainLayout>
        {children}
      </MainLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AppProvider>
  );
}