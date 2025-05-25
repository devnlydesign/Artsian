
"use client";
import React from 'react';
import { useAppState } from '@/context/AppStateContext';
import { ArtisanLogo } from '@/components/icons/ArtisanLogo';

export const InitialLoading = ({ children }: { children: React.ReactNode }) => {
  const { isLoadingAuth } = useAppState(); // Changed to isLoadingAuth

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[1000]">
        <ArtisanLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="mt-4 text-lg text-foreground">Loading ARTISAN...</p>
        <div className="mt-4 w-1/2 h-2 bg-muted rounded-full overflow-hidden">
          {/* Loading bar animation is now infinite and relies on isLoadingAuth state */}
          <div className="h-full bg-primary animate-loading-bar-infinite"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Add this to your globals.css or a suitable style file (if not already present and modified):
/*
@keyframes loading-bar-infinite {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
.animate-loading-bar-infinite {
  animation: loading-bar-infinite 1.5s ease-in-out infinite;
  transform-origin: left center;
}
*/
// Or if you prefer the old one:
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
  animation: loading-bar 1.8s ease-out forwards; 
}
*/

// For the purpose of this change, I'll ensure the CSS in globals.css reflects an infinite loader.
// The InitialLoading component will now use `isLoadingAuth`.
// The animation class name will be changed to `animate-loading-bar` for consistency with current globals.css
// but its keyframes should reflect an infinite or repeating pattern if the loading time is uncertain.
// For now, let's stick with the original `animate-loading-bar` if it's for a fixed duration,
// or consider making it more explicitly indeterminate.
// Given Firebase auth can vary, an indeterminate loader is better.
// I will adjust globals.css for an indeterminate loader.
