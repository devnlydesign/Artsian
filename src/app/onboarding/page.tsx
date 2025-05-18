
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UserCircle, Palette, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress"; // Assuming you have this component

export default function OnboardingPage() {
  // This would be a multi-step form in a real application
  const currentStep = 1; // Example step
  const totalSteps = 3; // Example total steps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-md text-muted-foreground text-center mt-1">
            Help us tailor ARTISAN to your creative journey.
          </CardDescription>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full mt-4" />
           <p className="text-xs text-muted-foreground text-center mt-1">Step {currentStep} of {totalSteps}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder for onboarding steps */}
          {currentStep === 1 && (
            <div className="text-center space-y-4">
              <UserCircle className="mx-auto h-16 w-16 text-primary" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p className="text-muted-foreground">
                Tell us a bit about yourself. (Placeholder for form fields like name, username, bio)
              </p>
              <Button className="w-full md:w-1/2 mx-auto">Next Step</Button>
            </div>
          )}
          {currentStep === 2 && (
             <div className="text-center space-y-4">
              <Palette className="mx-auto h-16 w-16 text-primary" />
              <h3 className="text-xl font-semibold">Creative Interests</h3>
              <p className="text-muted-foreground">
                What are your primary creative fields? (Placeholder for interests selection)
              </p>
              <Button className="w-full md:w-1/2 mx-auto">Next Step</Button>
            </div>
          )}
           {currentStep === 3 && (
             <div className="text-center space-y-4">
              <LinkIcon className="mx-auto h-16 w-16 text-primary" />
              <h3 className="text-xl font-semibold">Connect Accounts</h3>
              <p className="text-muted-foreground">
                Link your other creative platforms. (Placeholder for social links)
              </p>
              <Button className="w-full md:w-1/2 mx-auto">Finish Onboarding</Button>
            </div>
          )}

          <div className="text-center mt-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <h2 className="text-2xl font-semibold">Onboarding Placeholder</h2>
            <p className="text-muted-foreground mt-2">
              This is where a multi-step onboarding process, similar to Instagram's, would guide the user.
            </p>
            <p className="text-muted-foreground mt-1">
              For now, you can imagine fields for profile picture, bio, interests, etc.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Go to Dashboard (Skip Onboarding)</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
