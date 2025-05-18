
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type AppStateContextType = {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  showWelcome: boolean;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock authentication
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // After loading, if not authenticated, show welcome screen
      // This logic might need adjustment based on actual auth flow
      if (!isAuthenticated && typeof window !== 'undefined' && window.sessionStorage.getItem('hasSeenWelcome') !== 'true') {
        setShowWelcome(true);
        router.push('/auth/welcome');
      } else if (isAuthenticated) {
        // If authenticated, perhaps redirect to home or dashboard
        // router.push('/');
      }
      // If not showing welcome and not authenticated, could redirect to login or explore
      // else if (!isAuthenticated) {
      // router.push('/auth/welcome'); // Default to welcome if no specific state
      // }
    }, 2000); // Simulate 2 seconds loading time

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  const login = () => {
    setIsAuthenticated(true);
    setShowWelcome(false);
    sessionStorage.setItem('hasSeenWelcome', 'true'); // Prevent welcome screen on refresh after login
    router.push('/'); // Redirect to home after login
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('hasSeenWelcome');
    router.push('/auth/welcome'); // Redirect to welcome after logout
  };

  return (
    <AppStateContext.Provider value={{ isLoading, setIsLoading, isAuthenticated, login, logout, showWelcome, setShowWelcome }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
