
"use client";
import React from 'react';
import { useAppState } from '@/context/AppStateContext';
import { CharisMonogramLogo } from '@/components/icons/CharisMonogramLogo'; // Updated import

export const InitialLoading = ({ children }: { children: React.ReactNode }) => {
  const { isLoadingAuth } = useAppState(); 

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[1000]">
        <CharisMonogramLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="mt-4 text-lg text-foreground">Loading Charisarthub...</p>
        <div className="mt-4 w-1/2 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-loading-bar"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
