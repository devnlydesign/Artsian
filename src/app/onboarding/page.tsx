
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, UserCircle, Palette, Brain, Heart, Link as LinkIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import Link_Next from 'next/link'; // Renamed to avoid conflict with LinkIcon
import { Progress } from "@/components/ui/progress";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  fields?: Array<{ name: string; label: string; type: 'input' | 'textarea'; placeholder: string }>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Let's start with the basics. Tell us about yourself.",
    icon: UserCircle,
    fields: [
      { name: "fullName", label: "Full Name", type: "input", placeholder: "e.g., Ada Lovelace" },
      { name: "username", label: "Username", type: "input", placeholder: "e.g., ada_codes_art" },
      { name: "bio", label: "Bio", type: "textarea", placeholder: "A short description about your artistic journey..." },
    ],
  },
  {
    id: 2,
    title: "Creative Profile",
    description: "Define your artistic identity.",
    icon: Palette,
    fields: [
      { name: "genre", label: "Primary Genre(s)", type: "input", placeholder: "e.g., Digital Art, Sculpture, Photography" },
      { name: "style", label: "Artistic Style(s)", type: "input", placeholder: "e.g., Abstract Expressionism, Surrealism, Minimalist" },
    ],
  },
  {
    id: 3,
    title: "Influences & Goals",
    description: "What drives your creativity?",
    icon: Brain,
    fields: [
      { name: "motivations", label: "Motivations", type: "textarea", placeholder: "What motivates you to create? What themes do you explore?" },
      { name: "inspirations", label: "Inspirations/Influences", type: "textarea", placeholder: "Which artists, movements, or ideas inspire you?" },
    ],
  },
    {
    id: 4,
    title: "Connect (Optional)",
    description: "Link your other creative platforms.",
    icon: LinkIcon,
    fields: [
        { name: "website", label: "Personal Website", type: "input", placeholder: "https://your-portfolio.com" },
        { name: "socialMedia", label: "Social Media (Optional)", type: "input", placeholder: "e.g., Instagram, Behance link" },
    ]
  }
];

const totalSteps = onboardingSteps.length;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { login } = useAppState();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish onboarding
      console.log("Onboarding complete. Data:", formData);
      // In a real app, submit formData to backend here
      login(); // Mock login and redirect
      router.push('/');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepData = onboardingSteps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
             <Link_Next href="/auth/welcome" passHref>
                <Button variant="ghost" size="sm" className={currentStep === 1 ? "invisible": ""}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </Link_Next>
            <div className="text-center flex-grow">
                <CardTitle className="text-2xl md:text-3xl font-bold">{stepData?.icon && React.createElement(stepData.icon, { className: "mx-auto h-10 w-10 md:h-12 md:w-12 text-primary mb-2" })}{stepData?.title}</CardTitle>
                <CardDescription className="text-sm md:text-md text-muted-foreground mt-1">
                {stepData?.description}
                </CardDescription>
            </div>
            <div className={currentStep === 1 ? "w-[88px]" : "w-[88px]"}> {/* Placeholder to balance the header, adjust width as needed */}
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
                  value={formData[field.name] || ""}
                  onChange={handleInputChange}
                  className="text-base"
                />
              ) : (
                <Textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="text-base"
                />
              )}
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1} className="transition-transform hover:scale-105">
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext} className="bg-gradient-primary-accent hover:brightness-110 text-lg py-3 px-6 transition-transform hover:scale-105">
              {currentStep === totalSteps ? "Finish Onboarding" : "Next Step"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
           <div className="text-center mt-6">
                <Button variant="link" asChild>
                     <Link_Next href="/">Skip Onboarding & Go to Dashboard</Link_Next>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
