
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserCircle, Palette, Brain, Link as LinkIconProp, Paintbrush, ArrowLeft, ArrowRight, Loader2, CheckSquare, Mail, Sparkles } from 'lucide-react';
import Link_Next from 'next/link';
import { Progress } from "@/components/ui/progress";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { saveUserProfile, type UserProfileData, type UserProfileThemeSettings } from '@/actions/userProfile';
import { personalizeApp } from '@/ai/flows/personalization-assistant-flow';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  fields?: Array<{ name: keyof UserProfileData; label: string; type: 'input' | 'textarea'; placeholder: string }>;
  isFinalStep?: boolean;
  isThemeStep?: boolean;
}

interface ThemeTemplate {
  name: string;
  description: string;
  light: { [key: string]: string };
  dark: { [key: string]: string };
}

const themeVariables = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground",
  "--muted", "--muted-foreground", "--accent", "--accent-foreground",
  "--destructive", "--destructive-foreground", "--border", "--input", "--ring"
];

const themeTemplates: ThemeTemplate[] = [
  {
    name: "Charis Default (Violet Bliss)",
    description: "The standard vibrant and creative Charis Art Hub theme.",
    light: {
      "--background": "278 50% 95%", "--foreground": "282 30% 20%", "--card": "278 50% 98%",
      "--primary": "282 100% 41%", "--primary-foreground": "0 0% 100%", "--accent": "322 79% 43%",
      "--secondary": "282 60% 85%", "--muted": "278 40% 90%", "--border": "278 30% 85%", "--input": "278 30% 88%", "--ring": "282 100% 41%",
    },
    dark: {
      "--background": "220 20% 7%", "--foreground": "220 15% 88%", "--card": "220 20% 10%",
      "--primary": "200 100% 50%", "--primary-foreground": "0 0% 100%", "--accent": "280 80% 60%",
      "--secondary": "220 15% 20%", "--muted": "220 15% 15%", "--border": "220 15% 18%", "--input": "220 15% 16%", "--ring": "200 100% 55%",
    }
  },
  {
    name: "Midnight Clear (B&W Dark)",
    description: "A crisp, high-contrast black and white dark theme.",
    light: { // Fallback light for Midnight Clear
      "--background": "0 0% 100%", "--foreground": "0 0% 0%", "--card": "0 0% 98%",
      "--primary": "0 0% 20%", "--primary-foreground": "0 0% 100%", "--accent": "0 0% 30%",
      "--secondary": "0 0% 90%", "--muted": "0 0% 95%", "--border": "0 0% 85%", "--input": "0 0% 88%", "--ring": "0 0% 20%",
    },
    dark: {
      "--background": "0 0% 8%", "--foreground": "0 0% 95%", "--card": "0 0% 12%",
      "--primary": "0 0% 85%", "--primary-foreground": "0 0% 0%", "--accent": "0 0% 75%",
      "--secondary": "0 0% 20%", "--muted": "0 0% 15%", "--border": "0 0% 25%", "--input": "0 0% 18%", "--ring": "0 0% 85%",
    }
  },
   {
    name: "Daylight Minimal (B&W Light)",
    description: "A clean and focused black and white light theme.",
    light: {
      "--background": "0 0% 100%", "--foreground": "0 0% 8%", "--card": "0 0% 98%",
      "--primary": "0 0% 15%", "--primary-foreground": "0 0% 100%", "--accent": "0 0% 25%",
      "--secondary": "0 0% 90%", "--muted": "0 0% 95%", "--border": "0 0% 85%", "--input": "0 0% 88%", "--ring": "0 0% 15%",
    },
    dark: { // Fallback dark for Daylight Minimal
      "--background": "0 0% 8%", "--foreground": "0 0% 95%", "--card": "0 0% 12%",
      "--primary": "0 0% 85%", "--primary-foreground": "0 0% 0%", "--accent": "0 0% 75%",
      "--secondary": "0 0% 20%", "--muted": "0 0% 15%", "--border": "0 0% 25%", "--input": "0 0% 18%", "--ring": "0 0% 85%",
    }
  },
];


const onboardingSteps: OnboardingStep[] = [
  {
    id: 1, title: "Your Basic Info", description: "Let's start with the basics. Tell us about yourself.", icon: UserCircle,
    fields: [
      { name: "fullName", label: "Your Full Name", type: "input", placeholder: "e.g., Alex River" },
      { name: "username", label: "Choose a Username", type: "input", placeholder: "e.g., alex_creates_art" },
      { name: "bio", label: "Your Bio", type: "textarea", placeholder: "A short description about your art journey..." },
    ],
  },
  {
    id: 2, title: "Your Art Style", description: "Define your artistic identity.", icon: Palette,
    fields: [
      { name: "genre", label: "What kind of art do you mainly create? (Genres)", type: "input", placeholder: "e.g., Digital Painting, Sculpture, Photography" },
      { name: "style", label: "Describe your artistic style(s)", type: "input", placeholder: "e.g., Abstract, Surreal, Minimalist" },
    ],
  },
  {
    id: 3, title: "Your Inspiration", description: "What drives your creativity?", icon: Brain,
    fields: [
      { name: "motivations", label: "What motivates you to create art?", type: "textarea", placeholder: "What themes do you explore? What's your passion?" },
      { name: "inspirations", label: "Who or what inspires you?", type: "textarea", placeholder: "Any artists, movements, or ideas that influence your work?" },
    ],
  },
  {
    id: 4, title: "Theme Customization", description: "Personalize the look and feel of Charis Art Hub.", icon: Paintbrush, isThemeStep: true,
  },
  {
    id: 5, title: "Connect Your World (Optional)", description: "Link your other creative platforms or website.", icon: LinkIconProp,
    fields: [
        { name: "website", label: "Your Personal Website/Portfolio", type: "input", placeholder: "https://your-portfolio.com" },
        { name: "socialMedia", label: "Main Social Media (Optional)", type: "input", placeholder: "e.g., Instagram, Behance link" },
    ]
  },
  {
    id: 6, title: "Stay Updated!", description: "Get the latest news, tips, and community highlights from Charis Art Hub.", icon: Mail, isFinalStep: true,
  }
];

const totalSteps = onboardingSteps.length;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const [selectedThemeTemplate, setSelectedThemeTemplate] = useState<ThemeTemplate | null>(themeTemplates[0]);
  const [aiPersona, setAiPersona] = useState("");
  const [aiGeneratedColors, setAiGeneratedColors] = useState<UserProfileThemeSettings['customColors'] | null>(null);
  const [isGeneratingAiTheme, setIsGeneratingAiTheme] = useState(false);

  const { isAuthenticated, isLoadingAuth, currentUser } = useAppState();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please sign up or log in to continue onboarding.", variant: "destructive" });
      router.push('/auth/welcome');
    }
    if (currentUser && !formData.email) {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [isLoadingAuth, isAuthenticated, router, toast, currentUser, formData.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as keyof UserProfileData]: value }));
  };

  const handleCheckboxChange = (name: keyof UserProfileData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const parseCssVariables = (cssString: string): { [key: string]: string } => {
    const variables: { [key: string]: string } = {};
    const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(cssString)) !== null) {
      variables[match[1].trim()] = match[2].trim();
    }
    return variables;
  };

  const handleGenerateAiTheme = async () => {
    if (!aiPersona.trim()) {
      toast({ title: "Input Required", description: "Please describe your desired vibe for the AI.", variant: "destructive" });
      return;
    }
    setIsGeneratingAiTheme(true);
    setAiGeneratedColors(null);
    try {
      const result = await personalizeApp({ userRequest: `Generate a theme based on this vibe: ${aiPersona}. Provide HSL values for both light and dark modes for all standard variables.` });
      
      const lightModeRegex = /:root\s*{([^}]+)}/s;
      const darkModeRegex = /\.dark\s*{([^}]+)}/s;

      const lightMatch = result.suggestion.match(lightModeRegex);
      const darkMatch = result.suggestion.match(darkModeRegex);

      const lightColors = lightMatch ? parseCssVariables(lightMatch[1]) : {};
      const darkColors = darkMatch ? parseCssVariables(darkMatch[1]) : {};
      
      if (Object.keys(lightColors).length > 0 || Object.keys(darkColors).length > 0) {
        setAiGeneratedColors({ light: lightColors, dark: darkColors });
        toast({ title: "AI Theme Generated!", description: "Review the suggested colors below." });
      } else {
        toast({ title: "Parsing Error", description: "Could not extract theme colors from AI response. Try rephrasing your vibe.", variant: "destructive" });
      }

    } catch (error) {
      console.error("Error generating AI theme:", error);
      toast({ title: "AI Error", description: "Failed to generate theme. Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingAiTheme(false);
    }
  };
  
  const handleApplyTheme = (colors: UserProfileThemeSettings['customColors']) => {
    if (colors) {
      setFormData(prev => ({
        ...prev,
        themeSettings: {
          baseMode: prev.themeSettings?.baseMode || 'system',
          customColors: colors
        }
      }));
      setSelectedThemeTemplate(null); // Clear template selection if applying custom/AI theme
      toast({ title: "Theme Applied", description: "This theme will be saved when you finish onboarding." });
    }
  };


  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else { // Final step - Finish Onboarding
      if (!currentUser || !currentUser.uid) {
        toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive"});
        setIsSubmitting(false);
        router.push('/auth/login');
        return;
      }
      setIsSubmitting(true);
      
      let themeToSave: UserProfileThemeSettings | undefined = formData.themeSettings;
      if (!themeToSave && selectedThemeTemplate) {
        themeToSave = {
          baseMode: 'system', // Default or derive from template
          customColors: { light: selectedThemeTemplate.light, dark: selectedThemeTemplate.dark }
        };
      } else if (!themeToSave) { // If no theme selected at all, use Charis Default
         const defaultTemplate = themeTemplates[0];
         themeToSave = {
            baseMode: 'system',
            customColors: { light: defaultTemplate.light, dark: defaultTemplate.dark }
        };
      }
      
      const profileDataToSave: Partial<UserProfileData> = {
        ...formData, // Contains all other form data
        themeSettings: themeToSave,
        emailOptIn: formData.emailOptIn ?? false,
      };
      // Ensure essential fields from currentUser are merged if not in formData
      profileDataToSave.uid = currentUser.uid;
      if (!profileDataToSave.email) profileDataToSave.email = currentUser.email;
      
      const result = await saveUserProfile(currentUser.uid, profileDataToSave);

      if (result.success) {
        toast({ title: "Onboarding Complete!", description: "Welcome to Charis Art Hub! You're all set to explore." });
        router.push('/');
      } else {
        toast({ title: "Onboarding Error", description: result.message || "Could not save your profile. Please try again.", variant: "destructive" });
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
    return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Loading...</p></div>;
  }
  if (!isAuthenticated) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
             <Link_Next href="/" passHref>
                <Button variant="ghost" size="sm" className={currentStep === 1 ? "invisible": ""}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </Link_Next>
            <div className="text-center flex-grow">
                {stepData?.icon && React.createElement(stepData.icon, { className: "mx-auto h-10 w-10 md:h-12 md:w-12 text-primary mb-2" })}
                <CardTitle className="text-2xl md:text-3xl font-bold">{stepData?.title}</CardTitle>
                <CardDescription className="text-sm md:text-md text-muted-foreground mt-1">{stepData?.description}</CardDescription>
            </div>
            <div className={cn("w-[88px]", currentStep === totalSteps ? "invisible" : "")}></div>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full mt-4" />
          <p className="text-xs text-muted-foreground text-center mt-1">Step {currentStep} of {totalSteps}</p>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6 pb-4 md:pb-6">
          {stepData?.fields?.map(field => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === 'input' ? (
                <Input id={field.name} name={field.name} placeholder={field.placeholder} value={(formData[field.name] as string) || ""} onChange={handleInputChange} className="text-base" disabled={isSubmitting}/>
              ) : (
                <Textarea id={field.name} name={field.name} placeholder={field.placeholder} value={(formData[field.name] as string) || ""} onChange={handleInputChange} rows={3} className="text-base" disabled={isSubmitting}/>
              )}
            </div>
          ))}

          {stepData?.isThemeStep && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Choose a Theme Template</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themeTemplates.map(template => (
                    <Card key={template.name} 
                          className={cn("cursor-pointer hover:shadow-lg", selectedThemeTemplate?.name === template.name ? "ring-2 ring-primary shadow-lg" : "border-border")}
                          onClick={() => { setSelectedThemeTemplate(template); setAiGeneratedColors(null); handleApplyTheme({light: template.light, dark: template.dark});}}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex space-x-1 p-2 pt-0">
                        {['--background', '--foreground', '--primary', '--accent'].map(v => (
                            <div key={v} title={`${v} (Light)`} className="h-5 w-5 rounded-full border" style={{ backgroundColor: `hsl(${template.light[v]})` }}></div>
                        ))}
                        <div className="border-l mx-1 h-5"></div>
                         {['--background', '--foreground', '--primary', '--accent'].map(v => (
                            <div key={v + 'dark'} title={`${v} (Dark)`} className="h-5 w-5 rounded-full border" style={{ backgroundColor: `hsl(${template.dark[v]})` }}></div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Create with AI</h3>
                <div className="space-y-2">
                  <Label htmlFor="aiPersona">Describe your desired vibe/persona</Label>
                  <Textarea id="aiPersona" placeholder="e.g., 'minimalist and calm', 'energetic and futuristic', 'dark and mysterious with neon highlights'" value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} rows={2} disabled={isGeneratingAiTheme}/>
                  <Button onClick={handleGenerateAiTheme} disabled={isGeneratingAiTheme || !aiPersona.trim()} className="w-full sm:w-auto">
                    {isGeneratingAiTheme ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                    {isGeneratingAiTheme ? "Generating..." : "Generate AI Theme"}
                  </Button>
                </div>
                {aiGeneratedColors && (
                  <Card className="mt-4 p-3 bg-muted/50">
                    <h4 className="text-sm font-semibold mb-2">AI Suggested Colors:</h4>
                    <div className="space-y-1 text-xs">
                        <p className="font-medium">Light Mode:</p>
                        <div className="flex flex-wrap gap-1">
                           {Object.entries(aiGeneratedColors.light).map(([key, value]) => <Badge key={`l-${key}`} variant="outline">{key}: {value}</Badge>)}
                        </div>
                         <p className="font-medium mt-1">Dark Mode:</p>
                         <div className="flex flex-wrap gap-1">
                           {Object.entries(aiGeneratedColors.dark).map(([key, value]) => <Badge key={`d-${key}`} variant="outline">{key}: {value}</Badge>)}
                        </div>
                    </div>
                    <Button size="sm" onClick={() => handleApplyTheme(aiGeneratedColors)} className="mt-3 w-full">Apply AI Theme</Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {stepData?.isFinalStep && (
            <Card className="bg-muted/30 p-4">
                <CardTitle className="text-lg mb-2">Stay in the Loop!</CardTitle>
                 <div className="items-top flex space-x-2">
                    <Checkbox id="emailOptIn" name="emailOptIn" checked={!!formData.emailOptIn} onCheckedChange={(checked) => handleCheckboxChange("emailOptIn", !!checked)} disabled={isSubmitting}/>
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor="emailOptIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Yes, I'd like to receive email updates, news, and special offers from Charis Art Hub.
                        </label>
                        <p className="text-xs text-muted-foreground">You can unsubscribe at any time.</p>
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
              {!isSubmitting && currentStep !== totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
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
