
"use client";
import React from 'react';
import { useAppState } from '@/context/AppStateContext';
import { ArtisanLogo } from '@/components/icons/ArtisanLogo';

export const InitialLoading = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAppState();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[1000]">
        <ArtisanLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="mt-4 text-lg text-foreground">Loading ARTISAN...</p>
        <div className="mt-4 w-1/2 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-loading-bar"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Add this to your globals.css or a suitable style file:
/*
@keyframes loading-bar {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}
.animate-loading-bar {
  animation: loading-bar 2s ease-out forwards;
}
*/
