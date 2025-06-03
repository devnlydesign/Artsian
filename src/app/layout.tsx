
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AppStateProvider } from '@/context/AppStateContext';
import { InitialLoading } from '@/components/layout/InitialLoading';
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Charis Art Hub',
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppStateProvider>
            <InitialLoading>
              <AppLayout>
                {children}
              </AppLayout>
            </InitialLoading>
          </AppStateProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
