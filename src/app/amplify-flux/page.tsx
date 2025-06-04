
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BarChart, CheckCircle, Target, TrendingUp, UserCheck } from "lucide-react";
import { amplifyFluxPulse, type AmplifyFluxPulseInput, type AmplifyFluxPulseOutput } from "@/ai/flows/amplify-flux-pulse";
import { useAppState } from "@/context/AppStateContext";
import { amplifyArtwork, removeArtworkAmplification, amplifyUserProfile, removeProfileAmplification } from "@/actions/amplificationActions";
import { getArtworkById } from "@/actions/artworkActions";
import { getUserProfile } from "@/actions/userProfile";

const formSchema = z.object({
  // artistId: z.string().min(1, "Artist ID is required."), // Will be taken from currentUser
  fluxSignatureId: z.string().min(1, "Flux Signature (User Profile) ID is required for AI context."), // This can be user's own ID if focusing on profile
  crystallineBloomId: z.string().optional(), // This will be our artworkId
  promotionGoal: z.string().min(10, "Promotion goal must be at least 10 characters.").max(300, "Goal is too long (max 300 characters)."),
});

type AmplifyFormValues = z.infer<typeof formSchema>;

export default function AmplifyFluxPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAmplification, setIsProcessingAmplification] = useState(false);
  const [amplificationResult, setAmplificationResult] = useState<AmplifyFluxPulseOutput | null>(null);
  const [currentArtworkIsAmplified, setCurrentArtworkIsAmplified] = useState(false);
  const [currentUserProfileIsAmplified, setCurrentUserProfileIsAmplified] = useState(false);
  const [currentCrystallineBloomId, setCurrentCrystallineBloomId] = useState<string | undefined>(undefined);


  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();

  const form = useForm<AmplifyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fluxSignatureId: currentUser?.uid || "", // Prefill with current user's ID for their profile context
      crystallineBloomId: "",
      promotionGoal: "",
    },
  });
  
  useEffect(() => {
    if (currentUser?.uid && !form.getValues("fluxSignatureId")) {
      form.setValue("fluxSignatureId", currentUser.uid);
    }
  }, [currentUser, form]);


  useEffect(() => {
    async function checkAmplificationStatus() {
      if (!currentUser?.uid) return;

      const profile = await getUserProfile(currentUser.uid);
      setCurrentUserProfileIsAmplified(profile?.isProfileAmplified || false);

      const artworkId = form.getValues("crystallineBloomId");
      setCurrentCrystallineBloomId(artworkId);
      if (artworkId) {
        const artwork = await getArtworkById(artworkId);
        if (artwork && artwork.userId === currentUser.uid) {
          setCurrentArtworkIsAmplified(artwork.isAmplified || false);
        } else {
          setCurrentArtworkIsAmplified(false); // Reset if artworkId changes or not found/not owner
        }
      } else {
        setCurrentArtworkIsAmplified(false);
      }
    }
    if (!isLoadingAuth && isAuthenticated) {
        checkAmplificationStatus();
    }
  // Watch for changes in crystallineBloomId to re-check artwork amplification status
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAuthenticated, isLoadingAuth, form.watch("crystallineBloomId")]);


  const onSubmit: SubmitHandler<AmplifyFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Login Required", description: "Please log in to use this feature.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setAmplificationResult(null);
    const inputForAI: AmplifyFluxPulseInput = {
      artistId: currentUser.uid, // Use current user's ID
      fluxSignatureId: data.fluxSignatureId, // This is context for AI (can be own profile ID)
      crystallineBloomId: data.crystallineBloomId,
      promotionGoal: data.promotionGoal,
    };
    try {
      const result = await amplifyFluxPulse(inputForAI);
      setAmplificationResult(result);
      toast({
        title: "Boost Plan Ready!",
        description: "AI has suggested strategies to increase your art's visibility.",
      });
      // After getting suggestions, update status of the specific artwork ID entered.
      if (data.crystallineBloomId) {
        const artwork = await getArtworkById(data.crystallineBloomId);
        if (artwork && artwork.userId === currentUser.uid) {
          setCurrentArtworkIsAmplified(artwork.isAmplified || false);
        }
      }
      setCurrentCrystallineBloomId(data.crystallineBloomId);

    } catch (error) {
      console.error("Error amplifying flux pulse:", error);
      toast({
        title: "Error",
        description: "Failed to generate boost plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmplifyArtwork = async () => {
    if (!currentUser?.uid || !currentCrystallineBloomId) return;
    setIsProcessingAmplification(true);
    const result = await amplifyArtwork(currentUser.uid, currentCrystallineBloomId);
    if (result.success) {
      toast({ title: "Artwork Amplified!", description: result.message });
      setCurrentArtworkIsAmplified(true);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsProcessingAmplification(false);
  };

  const handleRemoveArtworkAmplification = async () => {
    if (!currentUser?.uid || !currentCrystallineBloomId) return;
    setIsProcessingAmplification(true);
    const result = await removeArtworkAmplification(currentUser.uid, currentCrystallineBloomId);
     if (result.success) {
      toast({ title: "Artwork Amplification Removed", description: result.message });
      setCurrentArtworkIsAmplified(false);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsProcessingAmplification(false);
  };
  
  const handleAmplifyProfile = async () => {
    if (!currentUser?.uid) return;
    setIsProcessingAmplification(true);
    const result = await amplifyUserProfile(currentUser.uid);
    if (result.success) {
      toast({ title: "Profile Amplified!", description: result.message });
      setCurrentUserProfileIsAmplified(true);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsProcessingAmplification(false);
  };

  const handleRemoveProfileAmplification = async () => {
    if (!currentUser?.uid) return;
    setIsProcessingAmplification(true);
    const result = await removeProfileAmplification(currentUser.uid);
    if (result.success) {
      toast({ title: "Profile Amplification Removed", description: result.message });
      setCurrentUserProfileIsAmplified(false);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsProcessingAmplification(false);
  };


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Zap className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Boost Your Art</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription className="text-md">Get AI-powered tips to promote your art and reach a wider audience. Then, apply amplification to your chosen artwork or profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fluxSignatureId" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Flux Signature (User Profile ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your User ID (for AI context)" {...field} disabled={true} />
                    </FormControl>
                     <FormDescription>This is your user ID, used by the AI for context. It's pre-filled.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crystallineBloomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Artwork ID to Amplify (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ID of a single artwork to focus on" {...field} />
                    </FormControl>
                    <FormDescription>Enter the ID of an artwork if you want to amplify a specific piece. This also enables artwork-specific amplification actions below.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promotionGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's Your Promotion Goal?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Increase followers, promote my new 'Cosmic Dreams' artwork, drive traffic to my shop."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>Clearly state what you want to achieve with this promotion for the AI.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" disabled={isLoading || isLoadingAuth || !isAuthenticated} className="w-full text-lg py-3 transition-transform hover:scale-105">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing & Strategizing...</>
                ) : (
                  <><Target className="mr-2 h-5 w-5" /> Get AI Boost Suggestions</>
                )}
              </Button>
              {!isAuthenticated && !isLoadingAuth && <p className="text-sm text-destructive text-center">Please log in to use this feature.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {amplificationResult && (
        <Card className="mt-8 shadow-xl bg-primary/10 border-primary card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-foreground flex items-center gap-2">
                <BarChart className="h-6 w-6 text-accent" /> AI Suggested Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Suggested Strategies:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {amplificationResult.suggestedStrategies.map((strategy, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 shrink-0" />
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">Predicted Impact:</h3>
              <p className="text-muted-foreground">{amplificationResult.predictedImpact}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            {currentCrystallineBloomId && (
              currentArtworkIsAmplified ? (
                <Button variant="destructive" onClick={handleRemoveArtworkAmplification} disabled={isProcessingAmplification || !isAuthenticated} className="flex-1">
                  {isProcessingAmplification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4"/>}
                  Remove Artwork Amplification
                </Button>
              ) : (
                <Button variant="gradientPrimary" onClick={handleAmplifyArtwork} disabled={isProcessingAmplification || !isAuthenticated} className="flex-1">
                  {isProcessingAmplification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4"/>}
                  Amplify This Artwork
                </Button>
              )
            )}
             {currentUserProfileIsAmplified ? (
                <Button variant="destructive" onClick={handleRemoveProfileAmplification} disabled={isProcessingAmplification || !isAuthenticated} className="flex-1">
                    {isProcessingAmplification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4"/>}
                    Remove Profile Amplification
                </Button>
             ) : (
                <Button variant="gradientPrimary" onClick={handleAmplifyProfile} disabled={isProcessingAmplification || !isAuthenticated} className="flex-1">
                    {isProcessingAmplification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4"/>}
                    Amplify My Profile
                </Button>
             )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
