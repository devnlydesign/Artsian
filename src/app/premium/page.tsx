
"use client"; // Required for useState, useEffect, and client-side actions

import React, { useState } from 'react'; // Added useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Star, TrendingUp, Zap, Gift, Rocket, Loader2 } from "lucide-react"; // Added Loader2
import Link from "next/link";
import { useAppState } from '@/context/AppStateContext'; // Added
import { saveUserProfile } from '@/actions/userProfile'; // Added
import { useToast } from '@/hooks/use-toast'; // Added

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
  "**Create a custom portfolio website** directly on ARTISAN",
  "**Enhanced Discovery & Visibility** (Amplify Flux Pulse priority)",
  "**Create & Host Broadcasting Channels**",
  "Access to advanced AI tools & insights",
  "Early access to new features",
  "Ad-free experience (if ads are introduced later)",
];

export default function PremiumPage() {
  const { currentUser, isAuthenticated } = useAppState();
  const { toast } = useToast();
  const [isActivatingPremium, setIsActivatingPremium] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);


  const handleActivateMockPremium = async () => {
    if (!currentUser || !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to activate premium features.", variant: "destructive" });
      return;
    }
    setIsActivatingPremium(true);
    try {
      const result = await saveUserProfile(currentUser.uid, { isPremium: true });
      if (result.success) {
        toast({ title: "Mock Premium Activated!", description: "Premium features are now simulated for your account. Refresh profile to see changes." });
        // Optionally, you could update the AppStateContext or re-fetch profile here if needed immediately
      } else {
        toast({ title: "Activation Failed", description: result.message || "Could not activate mock premium.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsActivatingPremium(false);
    }
  };
  
  const handleStartFreeTrial = async () => {
     if (!currentUser || !isAuthenticated) {
      toast({ title: "Login Required", description: "Please log in to start your free trial.", variant: "destructive" });
      return;
    }
    setIsStartingTrial(true);
    // In a real app, this would redirect to Stripe or a payment flow.
    // For now, we can also just activate the mock premium status.
    try {
      const result = await saveUserProfile(currentUser.uid, { isPremium: true });
      if (result.success) {
        toast({ title: "Free Trial Started!", description: "Your 3-month premium trial is now active! Refresh your profile to see changes." });
      } else {
        toast({ title: "Trial Activation Failed", description: result.message || "Could not start your free trial.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred during trial activation.", variant: "destructive" });
    } finally {
      setIsStartingTrial(false);
    }
  };


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg card-interactive-hover text-center">
        <CardHeader>
          <Star className="mx-auto h-16 w-16 text-amber-400 mb-3 animate-pulse" />
          <CardTitle className="text-4xl font-bold text-gradient-primary-accent">ARTISAN Premium</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            Elevate your creative journey and unlock exclusive benefits.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-lg mb-6">
            Supercharge your presence, connect more deeply, and stand out. <br/>
            <span className="font-semibold text-primary">Try Premium free for 3 months!</span>
          </p>
           <Button 
            size="lg" 
            variant="gradientPrimary" 
            className="text-xl py-4 px-8 transition-transform hover:scale-105"
            onClick={handleStartFreeTrial}
            disabled={isStartingTrial || !isAuthenticated}
            >
            {isStartingTrial ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <Gift className="mr-2 h-6 w-6"/>}
            {isStartingTrial ? "Starting Trial..." : "Start Your 3-Month Free Trial"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Then $9.99/month USD. Cancel anytime.</p>
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
            <Button variant="outline" className="w-full" disabled>Currently Active</Button>
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
            <CardDescription>Unlock the full power of ARTISAN.</CardDescription>
            <p className="text-3xl font-bold text-primary pt-2">$9.99 <span className="text-sm font-normal text-muted-foreground">/ month (after trial)</span></p>
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
             <Button 
                size="lg" 
                variant="gradientPrimary" 
                className="w-full text-lg transition-transform hover:scale-105"
                onClick={handleStartFreeTrial}
                disabled={isStartingTrial || !isAuthenticated}
                >
                {isStartingTrial ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Gift className="mr-2 h-5 w-5"/>}
                {isStartingTrial ? "Processing..." : "Start 3-Month Free Trial"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="text-center card-interactive-hover">
        <CardHeader>
            <CardTitle>Development & Testing</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-2">For testing purposes, you can simulate premium status for your account.</p>
            <Button 
                variant="outline" 
                onClick={handleActivateMockPremium} 
                disabled={isActivatingPremium || !isAuthenticated}
            >
                {isActivatingPremium ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isActivatingPremium ? "Activating..." : "Activate Mock Premium (Dev)"}
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
