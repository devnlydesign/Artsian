
"use client"; 

import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Star, TrendingUp, Zap, Gift, Rocket, Loader2 } from "lucide-react"; 
import Link from "next/link";
import { useAppState } from '@/context/AppStateContext'; 
import { saveUserProfile, getUserProfile, type UserProfileData } from '@/actions/userProfile'; 
import { useToast } from '@/hooks/use-toast'; 
import { loadStripe } from '@stripe/stripe-js';
import { createPremiumAppSubscriptionCheckoutSession } from '@/actions/stripe';
import { useSearchParams } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");


const basicFeatures = [
  "Create & Share Artworks (Crystalline Blooms)",
  "Personalized Artistic Style (Flux Signature)",
  "Join & Explore Communities",
  "Up to 6 links on your profile",
  "Standard Discovery features",
  "Direct Messaging",
];

const premiumFeatures = [
  "Everything in Basic, plus:",
  "**Exclusive Premium Badge / Checkmark** on Profile",
  "**Unlimited links** on your profile",
  "**Create a custom portfolio website** directly on Charisarthub",
  "**Enhanced Discovery & Visibility** (e.g., priority in Amplify Flux Pulse)",
  "**Create & Host Broadcasting Channels**",
  "Access to advanced AI tools & insights (e.g., deeper Energy Flow Patterns)",
  "Early access to new features",
  "Ad-free experience (if ads are introduced later)",
];

export default function PremiumPage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isActivatingMockPremium, setIsActivatingMockPremium] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (currentUser?.uid) {
        const data = await getUserProfile(currentUser.uid);
        setUserProfile(data);
      }
    }
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    const premiumStatus = searchParams.get('premium_status');
    const sessionId = searchParams.get('session_id');

    if (premiumStatus === 'success' && sessionId) {
      toast({
        title: "Payment Successful!",
        description: "Your premium subscription is being processed. Please refresh in a moment to see changes.",
        duration: 7000,
      });
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname); 
      }
    } else if (premiumStatus === 'cancel') {
      toast({
        title: "Subscription Cancelled",
        description: "Your attempt to subscribe to premium was cancelled.",
        variant: "default",
        duration: 7000,
      });
       if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname); 
      }
    }
  }, [searchParams, toast]);


  const handleActivateMockPremium = async () => {
    if (!currentUser || !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to activate premium features.", variant: "destructive" });
      return;
    }
    setIsActivatingMockPremium(true);
    try {
      const result = await saveUserProfile(currentUser.uid, { isPremium: true });
      if (result.success) {
        toast({ title: "Mock Premium Activated!", description: "Premium features are now simulated for your account. Refresh profile to see changes." });
        const updatedProfile = await getUserProfile(currentUser.uid); 
        setUserProfile(updatedProfile);
      } else {
        toast({ title: "Activation Failed", description: result.message || "Could not activate mock premium.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsActivatingMockPremium(false);
    }
  };
  
  const handleSubscribeToPremium = async () => {
     if (!currentUser || !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to subscribe.", variant: "destructive" });
      return;
    }
    setIsProcessingSubscription(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        toast({ title: "Error", description: "Stripe.js failed to load.", variant: "destructive" });
        setIsProcessingSubscription(false);
        return;
      }

      const result = await createPremiumAppSubscriptionCheckoutSession(
        currentUser.uid, 
        currentUser.email, 
        currentUser.displayName
      );

      if ('error' in result || !result.sessionId) {
        toast({ title: "Subscription Error", description: result.error || "Could not create subscription session.", variant: "destructive" });
        setIsProcessingSubscription(false);
        return;
      }
      
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: result.sessionId });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        toast({ title: "Redirect Error", description: stripeError.message || "Failed to redirect to Stripe.", variant: "destructive" });
      }
      
    } catch (error) {
      console.error("Error starting premium subscription:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Subscription Error", description: message, variant: "destructive" });
    } 
    if (!isProcessingSubscription) setIsProcessingSubscription(false); 
  };

  const isAlreadyPremium = userProfile?.isPremium || false;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg card-interactive-hover text-center">
        <CardHeader>
          <Star className="mx-auto h-16 w-16 text-amber-400 mb-3 animate-pulse" />
          <CardTitle className="text-4xl font-bold text-gradient-primary-accent">Charisarthub Premium</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            Elevate your creative journey and unlock exclusive benefits.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-lg mb-6">
            Supercharge your presence, connect more deeply, and stand out. <br/>
            {isAlreadyPremium ? (
                <span className="font-semibold text-green-500">You are currently a Premium Member!</span>
            ) : (
                <span className="font-semibold text-primary">Try Premium free for 3 months! (Via Stripe Test Mode)</span>
            )}
          </p>
          {!isAlreadyPremium && (
            <Button 
                size="lg" 
                variant="gradientPrimary" 
                className="text-xl py-4 px-8 transition-transform hover:scale-105"
                onClick={handleSubscribeToPremium}
                disabled={isProcessingSubscription || !isAuthenticated || isLoadingAuth}
            >
                {isProcessingSubscription ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <Gift className="mr-2 h-6 w-6"/>}
                {isProcessingSubscription ? "Processing..." : "Subscribe to Premium"}
            </Button>
          )}
          {!isAlreadyPremium && <p className="text-xs text-muted-foreground mt-2">Test with Stripe. Real Price ID needs setup. Webhook required for activation.</p>}
          {isAlreadyPremium && <p className="text-xs text-muted-foreground mt-2">Manage your subscription via Stripe (external link placeholder).</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl">Basic Plan</CardTitle>
            <CardDescription>Core features to get you started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {basicFeatures.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={!isAlreadyPremium}>
                {isAlreadyPremium ? "Your Current Plan (Free Tier)" : "Currently Active"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-primary shadow-2xl card-interactive-hover relative overflow-hidden">
            <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold rounded-br-md transform -rotate-12 -translate-x-2 -translate-y-1 shadow-md">
                <Sparkles className="inline h-3 w-3 mr-1" /> Most Popular
            </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-7 w-7 text-primary"/>Premium Plan
            </CardTitle>
            <CardDescription>Unlock the full power of Charisarthub.</CardDescription>
            <p className="text-3xl font-bold text-primary pt-2">$9.99 <span className="text-sm font-normal text-muted-foreground">/ month (Placeholder Price)</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <Star className="h-5 w-5 text-amber-400 mr-3 shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {!isAlreadyPremium && (
                 <Button 
                    size="lg" 
                    variant="gradientPrimary" 
                    className="w-full text-lg transition-transform hover:scale-105"
                    onClick={handleSubscribeToPremium}
                    disabled={isProcessingSubscription || !isAuthenticated || isLoadingAuth}
                    >
                    {isProcessingSubscription ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Gift className="mr-2 h-5 w-5"/>}
                    {isProcessingSubscription ? "Processing..." : "Go Premium with Stripe"}
                </Button>
            )}
            {isAlreadyPremium && (
                 <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full text-lg"
                    disabled
                    >
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500"/> Currently Premium
                </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <Card className="text-center card-interactive-hover">
        <CardHeader>
            <CardTitle>Development & Testing</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-2">For testing purposes, you can simulate premium status for your account (requires manual profile refresh to see UI changes).</p>
            <Button 
                variant="outline" 
                onClick={handleActivateMockPremium} 
                disabled={isActivatingMockPremium || !isAuthenticated || isAlreadyPremium}
            >
                {isActivatingMockPremium ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isActivatingMockPremium ? "Activating..." : (isAlreadyPremium ? "Mock Premium is Active" : "Activate Mock Premium (Dev)")}
            </Button>
            {!isAuthenticated && <p className="text-xs text-destructive mt-1">Log in to test premium features.</p>}
        </CardContent>
         <CardFooter className="flex-col items-center">
             <p className="text-muted-foreground mb-4">Join thousands of artists leveraging premium tools to grow their audience and showcase their work like never before.</p>
            <Button variant="link" asChild>
                <Link href="/contact-sales">Have questions or need a custom plan? Contact Us</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
