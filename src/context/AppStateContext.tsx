
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser 
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, type UserProfileData, saveUserProfile } from '@/actions/userProfile'; 

type AppStateContextType = {
  isLoadingAuth: boolean; 
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  currentUserProfile: UserProfileData | null; 
  loginUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  signupUser: (email: string, password: string) => Promise<FirebaseUser | null>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  logoutUser: () => Promise<void>;
  showWelcome: boolean;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
  refreshUserProfile: () => Promise<void>; 
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

  const fetchAndSetUserProfile = async (user: FirebaseUser | null, isNewUser: boolean = false) => {
    if (user) {
      try {
        let userProfile = await getUserProfile(user.uid);
        
        if (isNewUser && !userProfile) {
          const basicProfile: Partial<UserProfileData> = {
            uid: user.uid,
            email: user.email,
            fullName: user.displayName,
            photoURL: user.photoURL,
            username: user.email?.split('@')[0] || `user_${user.uid.substring(0,6)}`,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            storiesCount: 0,
            moderationStatus: 'approved', 
          };
          await saveUserProfile(user.uid, basicProfile);
          userProfile = await getUserProfile(user.uid); 
        }
        
        setCurrentUserProfile(userProfile);
        return userProfile;
      } catch (error) {
        console.error("Error fetching/creating user profile:", error);
        toast({ title: "Profile Error", description: "Could not load or initialize your profile data.", variant: "destructive" });
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
    const htmlElement = document.documentElement;
    const unsubscribe = onAuthStateChanged(auth, async (user) => { 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowWelcome(false); 
        sessionStorage.setItem('hasSeenWelcome', 'true');
        htmlElement.classList.remove('unauthenticated-theme');
        
        const userProfileData = await fetchAndSetUserProfile(user);

        const needsOnboarding = !userProfileData || (!userProfileData.bio && !userProfileData.fullName); // Simple check

        if (needsOnboarding && !pathname.startsWith('/onboarding')) { 
            router.push('/onboarding');
        } else if (!needsOnboarding && (pathname.startsWith('/auth/') || pathname === '/onboarding')) {
            router.push('/');
        }

      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setCurrentUserProfile(null); 
        htmlElement.classList.add('unauthenticated-theme');
        if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true') {
          setShowWelcome(true);
          if (!pathname.startsWith('/auth/welcome') && !pathname.startsWith('/auth/login') && !pathname.startsWith('/auth/signup') && !pathname.startsWith('/onboarding')) {
             router.push('/auth/welcome');
          }
        } else {
          setShowWelcome(false); 
        }
      }
      setIsLoadingAuth(false);
    });

    if (!isLoadingAuth && !auth.currentUser) {
        htmlElement.classList.add('unauthenticated-theme');
    }
     if (typeof window !== 'undefined' && sessionStorage.getItem('hasSeenWelcome') !== 'true' && !auth.currentUser && !pathname.startsWith('/auth/')) {
        setShowWelcome(true);
        if (!pathname.startsWith('/auth/welcome') && !pathname.startsWith('/onboarding')) router.push('/auth/welcome');
    } else {
      setShowWelcome(false);
    }

    return () => {
        unsubscribe();
        htmlElement.classList.remove('unauthenticated-theme'); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isLoadingAuth]); 

  const loginUser = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true); 
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle profile fetching and redirects
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
      await fetchAndSetUserProfile(userCredential.user, true); // Pass true for isNewUser
      // onAuthStateChanged will handle profile fetching and redirects, including onboarding
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

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setIsLoadingAuth(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await fetchAndSetUserProfile(result.user, true); // Pass true for isNewUser
      // onAuthStateChanged will handle profile fetching and redirects, including onboarding
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let message = "Failed to sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        message = "Google Sign-In popup was closed before completion.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        message = "An account already exists with this email address using a different sign-in method.";
      }
      toast({ title: "Google Sign-In Error", description: message, variant: "destructive" });
      setIsLoadingAuth(false);
      return null;
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('hasSeenWelcome');
      setCurrentUser(null); // Explicitly clear states
      setIsAuthenticated(false);
      setCurrentUserProfile(null);
      router.push('/auth/welcome'); // Redirect to welcome after logout
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
      signInWithGoogle,
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
