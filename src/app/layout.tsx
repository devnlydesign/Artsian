
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AppStateProvider } from '@/context/AppStateContext';
import { InitialLoading } from '@/components/layout/InitialLoading';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ARTISAN',
  description: 'A dynamic platform for creative expression and connection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <AppStateProvider>
          <InitialLoading>
            <AppLayout>
              {children}
            </AppLayout>
          </InitialLoading>
        </AppStateProvider>
        <Toaster />
      </body>
    </html>
  );
}
