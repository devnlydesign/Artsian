
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArtisanLogo } from '@/components/icons/ArtisanLogo';
import { ArrowRight, LogIn, UserPlus, Compass } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';


export default function WelcomePage() {
  const { setShowWelcome } = useAppState();
  const router = useRouter();

  const handleExplore = () => {
    setShowWelcome(false); // Ensure welcome doesn't re-appear if they navigate back
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <ArtisanLogo className="mx-auto h-20 w-20 text-primary mb-4" />
          <CardTitle className="text-4xl font-bold">Welcome to ARTISAN</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your dynamic platform for creative expression and connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            className="w-full text-lg py-6 transition-transform hover:scale-105" 
            onClick={() => handleAuthRedirect('/auth/signup')}>
            <UserPlus className="mr-3 h-6 w-6" /> Create Account
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-lg py-6 transition-transform hover:scale-105"
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
            className="w-full text-md py-4 text-primary hover:text-primary/80 transition-transform hover:scale-105"
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
