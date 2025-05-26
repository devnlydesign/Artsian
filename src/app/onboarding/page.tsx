
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserCircle, Palette, Brain, Link as LinkIconProp, ArrowLeft, ArrowRight, Loader2, CheckSquare, Mail } from 'lucide-react';
import Link_Next from 'next/link';
import { Progress } from "@/components/ui/progress";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { saveUserProfile, type UserProfileData } from '@/actions/userProfile';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  fields?: Array<{ name: keyof UserProfileData; label: string; type: 'input' | 'textarea'; placeholder: string }>;
  isFinalStep?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Your Basic Info",
    description: "Let's start with the basics. Tell us about yourself.",
    icon: UserCircle,
    fields: [
      { name: "fullName", label: "Your Full Name", type: "input", placeholder: "e.g., Alex River" },
      { name: "username", label: "Choose a Username", type: "input", placeholder: "e.g., alex_creates_art" },
      { name: "bio", label: "Your Bio", type: "textarea", placeholder: "A short description about your art journey..." },
    ],
  },
  {
    id: 2,
    title: "Your Art Style",
    description: "Define your artistic identity.",
    icon: Palette,
    fields: [
      { name: "genre", label: "What kind of art do you mainly create? (Genres)", type: "input", placeholder: "e.g., Digital Painting, Sculpture, Photography" },
      { name: "style", label: "Describe your artistic style(s)", type: "input", placeholder: "e.g., Abstract, Surreal, Minimalist" },
    ],
  },
  {
    id: 3,
    title: "Your Inspiration",
    description: "What drives your creativity?",
    icon: Brain,
    fields: [
      { name: "motivations", label: "What motivates you to create art?", type: "textarea", placeholder: "What themes do you explore? What's your passion?" },
      { name: "inspirations", label: "Who or what inspires you?", type: "textarea", placeholder: "Any artists, movements, or ideas that influence your work?" },
    ],
  },
  {
    id: 4,
    title: "Connect Your World (Optional)",
    description: "Link your other creative platforms or website.",
    icon: LinkIconProp,
    fields: [
        { name: "website", label: "Your Personal Website/Portfolio", type: "input", placeholder: "https://your-portfolio.com" },
        { name: "socialMedia", label: "Main Social Media (Optional)", type: "input", placeholder: "e.g., Instagram, Behance link" },
    ]
  },
  {
    id: 5,
    title: "Stay Updated!",
    description: "Get the latest news, tips, and community highlights from ARTISAN.",
    icon: Mail,
    isFinalStep: true,
  }
];

const totalSteps = onboardingSteps.length;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const { isAuthenticated, isLoadingAuth, currentUser } = useAppState();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign up or log in to continue onboarding.",
        variant: "destructive",
      });
      router.push('/auth/welcome');
    }
  }, [isLoadingAuth, isAuthenticated, router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as keyof UserProfileData]: value }));
  };

  const handleCheckboxChange = (name: keyof UserProfileData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (!currentUser || !currentUser.uid) {
        toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive"});
        setIsSubmitting(false);
        router.push('/auth/login');
        return;
      }
      setIsSubmitting(true);
      
      const profileDataToSave: UserProfileData = {
        uid: currentUser.uid,
        email: currentUser.email,
        fullName: formData.fullName || "",
        username: formData.username || "",
        bio: formData.bio || "",
        genre: formData.genre || "",
        style: formData.style || "",
        motivations: formData.motivations || "",
        inspirations: formData.inspirations || "",
        website: formData.website || "",
        socialMedia: formData.socialMedia || "",
        emailOptIn: formData.emailOptIn ?? false,
        isPremium: false, // Default to false on initial onboarding
      };
      
      const result = await saveUserProfile(currentUser.uid, profileDataToSave);

      if (result.success) {
        toast({
          title: "Onboarding Complete!",
          description: "Welcome to ARTISAN! You're all set to explore.",
        });
        router.push('/');
      } else {
        toast({
          title: "Onboarding Error",
          description: result.message || "Could not save your profile. Please try again.",
          variant: "destructive",
        });
      }
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepData = onboardingSteps.find(step => step.id === currentStep);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
             <Link_Next href="/auth/signup" passHref>
                <Button variant="ghost" size="sm" className={currentStep === 1 ? "invisible": ""}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </Link_Next>
            <div className="text-center flex-grow">
                {stepData?.icon && React.createElement(stepData.icon, { className: "mx-auto h-10 w-10 md:h-12 md:w-12 text-primary mb-2" })}
                <CardTitle className="text-2xl md:text-3xl font-bold">{stepData?.title}</CardTitle>
                <CardDescription className="text-sm md:text-md text-muted-foreground mt-1">
                {stepData?.description}
                </CardDescription>
            </div>
            <div className={currentStep === 1 ? "w-[88px]" : "w-[88px]"}> {/* Placeholder */}
            </div>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full mt-4" />
          <p className="text-xs text-muted-foreground text-center mt-1">Step {currentStep} of {totalSteps}</p>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6 pb-4 md:pb-6">
          {stepData?.fields?.map(field => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'input' ? (
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={(formData[field.name] as string) || ""}
                  onChange={handleInputChange}
                  className="text-base"
                  disabled={isSubmitting}
                />
              ) : (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={(formData[field.name] as string) || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="text-base"
                  disabled={isSubmitting}
                />
              )}
            </div>
          ))}

          {stepData?.isFinalStep && (
            <Card className="bg-muted/30 p-4">
                <CardTitle className="text-lg mb-2">Stay in the Loop!</CardTitle>
                 <div className="items-top flex space-x-2">
                    <Checkbox 
                        id="emailOptIn" 
                        name="emailOptIn" 
                        checked={!!formData.emailOptIn}
                        onCheckedChange={(checked) => handleCheckboxChange("emailOptIn", !!checked)}
                        disabled={isSubmitting}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                        htmlFor="emailOptIn"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        Yes, I'd like to receive email updates, news, and special offers from ARTISAN.
                        </label>
                        <p className="text-xs text-muted-foreground">
                        Emails will be sent from devnlydesign@gmail.com. You can unsubscribe at any time.
                        </p>
                    </div>
                </div>
            </Card>
          )}
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isSubmitting} className="transition-transform hover:scale-105">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext} className="bg-gradient-primary-accent hover:brightness-110 text-lg py-3 px-6 transition-transform hover:scale-105" disabled={isSubmitting}>
              {isSubmitting && currentStep === totalSteps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentStep === totalSteps ? (isSubmitting ? "Finishing..." : "Finish Onboarding") : "Next Step"} 
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
           <div className="text-center mt-6">
                <Button variant="link" asChild disabled={isSubmitting}>
                     <Link_Next href="/">Skip Onboarding & Go to Dashboard</Link_Next>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
