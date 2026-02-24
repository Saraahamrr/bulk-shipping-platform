// frontend/src/pages/_app.tsx
import '@/src/styles/globals.css';
import type { AppProps } from 'next/app';
import { AppProvider } from '@/src/context/AppContext';
import Layout from '@/src/components/layout/Layout';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AppProvider>
  );
}