
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/actions/userProfile'; // Import for profile checking

type AppStateContextType = {
  isLoadingAuth: boolean; 
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  loginUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  signupUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  showWelcome: boolean;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showWelcome, setShowWelcome] = useState(false); 
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => { // Made async
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowWelcome(false); 
        sessionStorage.setItem('hasSeenWelcome', 'true');

        try {
          const userProfile = await getUserProfile(user.uid);
          if (!userProfile) { // New user or onboarding incomplete
            // Allow user to be on signup or onboarding page without redirecting them back to onboarding
            if (pathname !== '/onboarding' && !pathname.startsWith('/auth/signup')) { 
              router.push('/onboarding');
            }
          } else { // Existing user with a profile
            if (pathname.startsWith('/auth/') || pathname === '/onboarding') {
              router.push('/');
            }
          }
        } catch (error) {
          console.error("Error checking user profile during auth state change:", error);
          toast({ title: "Auth Error", description: "Could not verify user profile. Please try again.", variant: "destructive"});
          // Fallback: if profile check fails, and they are on auth pages, send to home.
          if (pathname.startsWith('/auth/') || pathname === '/onboarding') {
            router.push('/');
          }
        }

      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true') {
          setShowWelcome(true);
          // Avoid redirect loop if already on welcome or auth pages.
          if (!pathname.startsWith('/auth/welcome') && !pathname.startsWith('/auth/login') && !pathname.startsWith('/auth/signup')) {
             router.push('/auth/welcome');
          }
        } else {
          setShowWelcome(false); 
        }
      }
      setIsLoadingAuth(false);
    });

    if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true' && !auth.currentUser && !pathname.startsWith('/auth/')) {
        setShowWelcome(true);
        router.push('/auth/welcome');
    }

    return () => unsubscribe();
  }, [router, pathname, toast]);

  const loginUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true); // Indicate loading during login attempt
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting isAuthenticated, currentUser, and navigation
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let message = "Failed to log in. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      }
      toast({ title: "Login Error", description: message, variant: "destructive" });
      setIsLoadingAuth(false); // Reset loading on error
      return null;
    }
    // setIsLoadingAuth(false) is handled by onAuthStateChanged
  };

  const signupUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true); // Indicate loading during signup attempt
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user state and navigation to onboarding
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let message = "Failed to sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password is too weak. It should be at least 6 characters.";
      }
      toast({ title: "Signup Error", description: message, variant: "destructive" });
      setIsLoadingAuth(false); // Reset loading on error
      return null;
    }
    // setIsLoadingAuth(false) is handled by onAuthStateChanged
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('hasSeenWelcome');
      setShowWelcome(true); 
      // onAuthStateChanged will push to /auth/welcome if not already there
    } catch (error) {
      console.error("Firebase logout error:", error);
      toast({ title: "Logout Error", description: "Failed to log out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <AppStateContext.Provider value={{ 
      isLoadingAuth, 
      isAuthenticated, 
      currentUser, 
      loginUser, 
      signupUser, 
      logoutUser, 
      showWelcome, 
      setShowWelcome 
    }}>
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
