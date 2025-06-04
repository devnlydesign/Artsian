
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
import { getUserProfile, type UserProfileData } from '@/actions/userProfile'; // Import for profile checking

type AppStateContextType = {
  isLoadingAuth: boolean; 
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  currentUserProfile: UserProfileData | null; // Added to store fetched profile data
  loginUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  signupUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  showWelcome: boolean;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
  refreshUserProfile: () => Promise<void>; // Added to allow manual profile refresh
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfileData | null>(null);
  const [showWelcome, setShowWelcome] = useState(false); 
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const fetchAndSetUserProfile = async (user: FirebaseUser | null) => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.uid);
        setCurrentUserProfile(userProfile);
        return userProfile;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({ title: "Profile Error", description: "Could not load your profile data.", variant: "destructive" });
        setCurrentUserProfile(null);
        return null;
      }
    } else {
      setCurrentUserProfile(null);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchAndSetUserProfile(currentUser);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => { 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowWelcome(false); 
        sessionStorage.setItem('hasSeenWelcome', 'true');

        const userProfileData = await fetchAndSetUserProfile(user);

        if (!userProfileData) { 
          if (pathname !== '/onboarding' && !pathname.startsWith('/auth/signup')) { 
            router.push('/onboarding');
          }
        } else { 
          if (pathname.startsWith('/auth/') || pathname === '/onboarding') {
            router.push('/');
          }
        }

      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCurrentUserProfile(null); // Clear profile on logout
        if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true') {
          setShowWelcome(true);
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
        if (!pathname.startsWith('/auth/welcome')) router.push('/auth/welcome');
    } else {
      setShowWelcome(false);
    }


    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Removed router and toast to prevent re-runs from their changes

  const loginUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true); 
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest (fetching profile, navigation)
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let message = "Failed to log in. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      }
      toast({ title: "Login Error", description: message, variant: "destructive" });
      setIsLoadingAuth(false); 
      return null;
    }
  };

  const signupUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true); 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest (navigation to onboarding)
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
      setIsLoadingAuth(false); 
      return null;
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('hasSeenWelcome');
      // onAuthStateChanged will handle setting showWelcome and navigation
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
      currentUserProfile,
      loginUser, 
      signupUser, 
      logoutUser, 
      showWelcome, 
      setShowWelcome,
      refreshUserProfile
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
