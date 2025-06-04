
import type {Metadata} from 'next';
import { Roboto } from 'next/font/google'; // Changed from Geist
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { AppStateProvider } from '@/context/AppStateContext';
import { InitialLoading } from '@/components/layout/InitialLoading';
import { ThemeProvider } from "next-themes";

// Setup Roboto for body text
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Include weights you'll use
  variable: '--font-roboto', // CSS variable for Tailwind
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
      <body className={`${roboto.variable} font-sans antialiased`} suppressHydrationWarning={true}> {/* Use roboto variable and font-sans */}
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
