
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart2, Palette, Smile, Loader2, Edit3 } from "lucide-react";
import Image from "next/image";
import { useAppState } from '@/context/AppStateContext';
import { getUserProfile, saveUserProfile, type UserProfileData, type FluxSignature, type FluxEvolutionPoint } from '@/actions/userProfile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const defaultFluxSignature: FluxSignature = {
  style: "Not yet defined",
  activityLevel: "Moderate",
  currentMood: "Neutral",
  dominantColors: ["#cccccc", "#aaaaaa", "#888888", "#666666"],
  keywords: ["evolving", "creative"],
  visualRepresentation: "https://placehold.co/800x400.png",
  dataAiHintVisual: "abstract generative art",
};

const defaultEvolutionPoints: FluxEvolutionPoint[] = [
  { date: new Date().toISOString().split('T')[0], change: "Flux Signature initiated." },
];

export default function FluxSignaturePage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      if (isAuthenticated && currentUser?.uid) {
        setIsLoadingProfile(true);
        const data = await getUserProfile(currentUser.uid);
        setProfileData(data);
        setIsLoadingProfile(false);
      } else if (!isLoadingAuth) {
        setIsLoadingProfile(false); 
      }
    }
    if (!isLoadingAuth) {
        fetchProfile();
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  const handleMockUpdateSignature = async () => {
    if (!currentUser?.uid || !profileData) return;

    setIsUpdating(true);
    const currentSignature = profileData.fluxSignature || { ...defaultFluxSignature };
    const currentEvolutionPoints = profileData.fluxEvolutionPoints || [...defaultEvolutionPoints];

    const newKeywords = [...(currentSignature.keywords || []), `Update-${Math.floor(Math.random() * 100)}`];
    const newDominantColors = [...(currentSignature.dominantColors || []), `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`].slice(-4);


    const updatedSignature: FluxSignature = {
      ...currentSignature,
      style: "Evolving Digital Abstract",
      keywords: newKeywords,
      dominantColors: newDominantColors,
      currentMood: ["Inspired", "Focused", "Playful"][Math.floor(Math.random() * 3)],
    };

    const newEvolutionPoint: FluxEvolutionPoint = {
      date: new Date().toISOString().split('T')[0],
      change: `Keywords updated. Mood shifted to ${updatedSignature.currentMood}.`,
    };
    const updatedEvolutionPoints = [...currentEvolutionPoints, newEvolutionPoint];

    const result = await saveUserProfile(currentUser.uid, {
      fluxSignature: updatedSignature,
      fluxEvolutionPoints: updatedEvolutionPoints,
    });

    if (result.success) {
      toast({ title: "Signature Updated!", description: "Your Flux Signature has been mock updated." });
      const data = await getUserProfile(currentUser.uid);
      setProfileData(data);
    } else {
      toast({ title: "Error", description: result.message || "Could not update signature.", variant: "destructive" });
    }
    setIsUpdating(false);
  };

  if (isLoadingAuth || isLoadingProfile) {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your artistic essence...</p>
      </div>
    );
  }

  if (!isAuthenticated || !profileData) {
    return (
      <div className="space-y-8 text-center py-10">
        <Palette className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold">View Your Artistic Style</h1>
        <p className="text-muted-foreground">Please log in to see and shape your Flux Signature.</p>
        <Button asChild variant="gradientPrimary" className="mt-4">
          <a href="/auth/login">Log In</a>
        </Button>
      </div>
    );
  }
  
  const fluxSignature = profileData.fluxSignature || defaultFluxSignature;
  const fluxEvolutionPoints = profileData.fluxEvolutionPoints && profileData.fluxEvolutionPoints.length > 0 
                              ? profileData.fluxEvolutionPoints 
                              : defaultEvolutionPoints;


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden card-interactive-hover">
        <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 md:p-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Palette className="h-10 w-10 md:h-12 md:w-12" />
            <div>
              <CardTitle className="text-3xl md:text-4xl">My Artistic Style</CardTitle>
               <p className="text-xs text-primary-foreground/70 mt-0.5">Created by Charis</p>
              <CardDescription className="text-primary-foreground/80 text-md md:text-lg">A dynamic look at your unique creative fingerprint.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Your Current Signature</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <span className="font-medium">Main Styles:</span>
                  <span>{fluxSignature.style}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="font-medium">Activity Level:</span>
                  <Badge variant="secondary" className="text-sm">{fluxSignature.activityLevel || 'Moderate'}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Smile className="h-5 w-5 text-primary" />
                  <span className="font-medium">Current Mood:</span>
                  <Badge variant="outline" className="border-accent text-accent text-sm">{fluxSignature.currentMood || 'Neutral'}</Badge>
                </div>
                 <div className="flex items-start gap-3">
                  <Palette className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <span className="font-medium">Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(fluxSignature.keywords && fluxSignature.keywords.length > 0) ? fluxSignature.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
                      )) : <span className="text-sm text-muted-foreground">No keywords defined.</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-md md:text-lg font-semibold mb-2">Dominant Colors:</h4>
                <div className="flex gap-2 flex-wrap">
                  {(fluxSignature.dominantColors && fluxSignature.dominantColors.length > 0) ? fluxSignature.dominantColors.map((color, index) => (
                    <div key={index} className="h-8 w-8 rounded-full shadow-md border border-border" style={{ backgroundColor: color }} title={color} />
                  )) : <p className="text-sm text-muted-foreground">Colors not defined.</p>}
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
               <Image 
                src={fluxSignature.visualRepresentation || "https://placehold.co/800x400.png"} 
                alt="Visual Representation of Artistic Style" 
                layout="fill"
                objectFit="cover"
                data-ai-hint={fluxSignature.dataAiHintVisual || "abstract digital art"} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-3 left-3 md:bottom-4 md:left-4 text-white text-md md:text-lg font-semibold">Style Snapshot</p>
            </div>
          </div>
           <div className="mt-8 text-center">
            <Button onClick={handleMockUpdateSignature} disabled={isUpdating} variant="gradientPrimary">
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
              {isUpdating ? "Updating..." : "Mock Update Signature"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              (Dev only: Simulates an update to your signature for testing)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <BarChart2 className="h-6 w-6 text-primary" />
            Your Style Journey
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Track how your artistic style has changed over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {fluxEvolutionPoints.length > 0 ? (
            <ul className="space-y-4">
              {fluxEvolutionPoints.slice().reverse().map((point, index) => ( 
                <li key={index} className="border-l-2 border-primary pl-4 py-2 relative hover:bg-muted/30 rounded-r-md transition-colors">
                  <div className="absolute -left-[0.30rem] top-3.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-semibold text-xs text-muted-foreground">{new Date(point.date).toLocaleDateString()}</p>
                  <p className="text-sm">{point.change}</p>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-muted-foreground text-center py-4">No style evolution points recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
