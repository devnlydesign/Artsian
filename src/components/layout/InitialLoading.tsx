
"use client";
import React from 'react';
import { useAppState } from '@/context/AppStateContext';
import { CharisArtHubLogo } from '@/components/icons/CharisArtHubLogo';

export const InitialLoading = ({ children }: { children: React.ReactNode }) => {
  const { isLoadingAuth } = useAppState(); 

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[1000]">
        <CharisArtHubLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="mt-4 text-lg text-foreground">Loading Charis Art Hub...</p>
        <div className="mt-4 w-1/2 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-loading-bar"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
