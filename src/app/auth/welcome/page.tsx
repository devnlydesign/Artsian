
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CharisMonogramLogo } from '@/components/icons/CharisMonogramLogo';
import { ArrowRight, LogIn, UserPlus, Compass } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


export default function WelcomePage() {
  const { setShowWelcome } = useAppState();
  const router = useRouter();

  const handleExplore = () => {
    setShowWelcome(false); 
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
    router.push('/creative-stratosphere');
  }

  const handleAuthRedirect = (path: string) => {
     setShowWelcome(false);
     if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
    router.push(path);
  }

  return (
    // Removed welcome-page-theme-override, relying on global .unauthenticated-theme on <html>
    <div className="min-h-screen flex flex-col items-center justify-center p-4"> 
      <Card className="w-full max-w-md shadow-2xl bg-card text-card-foreground">
        <CardHeader className="text-center">
          {/* Added welcome-page-text-primary for specific logo color control if needed, but currentColor should work */}
          <CharisMonogramLogo className="mx-auto h-20 w-20 text-foreground mb-4 welcome-page-text-primary" /> 
          <CardTitle className="text-4xl font-bold text-gradient-primary-accent">Welcome to Charisarthub</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your dynamic platform for creative expression and connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 welcome-page-buttons">
          <Button 
            className="w-full text-lg py-6 transition-transform hover:scale-105 ui-button-primary-themed" 
            onClick={() => handleAuthRedirect('/auth/signup')}>
            <UserPlus className="mr-3 h-6 w-6" /> Create Account
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-lg py-6 transition-transform hover:scale-105 ui-button-outline-themed"
            onClick={() => handleAuthRedirect('/auth/login')}>
            <LogIn className="mr-3 h-6 w-6" /> Log In
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full text-md py-4 text-primary hover:text-primary/80 transition-transform hover:scale-105 ui-button-ghost-themed"
            onClick={handleExplore}>
            <Compass className="mr-2 h-5 w-5" /> Explore as Guest <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        Discover a new realm of creativity.
      </p>
    </div>
  );
}
