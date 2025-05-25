
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

type AppStateContextType = {
  isLoadingAuth: boolean; // Renamed from isLoading
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
  const [showWelcome, setShowWelcome] = useState(false); // Initial state to false
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowWelcome(false); // User is authenticated, don't show welcome
        sessionStorage.setItem('hasSeenWelcome', 'true');
        // If user is authenticated and on an auth page, redirect to home
        if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
          router.push('/');
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        // If user is not authenticated and hasn't seen welcome, show it
        if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true') {
          setShowWelcome(true);
          if (!pathname.startsWith('/auth/welcome')) { // Avoid loop if already there
             router.push('/auth/welcome');
          }
        } else {
          setShowWelcome(false); // User logged out or chose guest, don't force welcome
        }
      }
      setIsLoadingAuth(false);
    });

    // Initial check for welcome screen visibility, independent of auth state change
    // This ensures if a user lands on the site for the first time, welcome is shown
     if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true' && !auth.currentUser) {
        setShowWelcome(true);
        if (!pathname.startsWith('/auth')) router.push('/auth/welcome');
    }


    return () => unsubscribe();
  }, [router, pathname]); // pathname ensures redirection logic re-evaluates on route change

  const loginUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting isAuthenticated and currentUser
      sessionStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
      router.push('/'); // Navigate to home on successful login
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let message = "Failed to log in. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      }
      toast({ title: "Login Error", description: message, variant: "destructive" });
      return null;
    }
  };

  const signupUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting isAuthenticated and currentUser
      // User is now signed up and logged in via Firebase
      sessionStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
      // Navigation to onboarding will happen in the SignupPage component
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
      return null;
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting isAuthenticated to false
      sessionStorage.removeItem('hasSeenWelcome'); // Allow welcome screen to show again
      setShowWelcome(true);
      router.push('/auth/welcome'); // Navigate to welcome page on logout
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
