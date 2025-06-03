
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BarChart, CheckCircle, Target } from "lucide-react";
import { amplifyFluxPulse, type AmplifyFluxPulseInput, type AmplifyFluxPulseOutput } from "@/ai/flows/amplify-flux-pulse";

const formSchema = z.object({
  artistId: z.string().min(1, "Artist ID is required."),
  fluxSignatureId: z.string().min(1, "Artwork or Series ID to Promote is required."),
  crystallineBloomId: z.string().optional(),
  promotionGoal: z.string().min(10, "Promotion goal must be at least 10 characters.").max(300, "Goal is too long (max 300 characters)."),
});

type AmplifyFormValues = z.infer<typeof formSchema>;

export default function AmplifyFluxPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [amplificationResult, setAmplificationResult] = useState<AmplifyFluxPulseOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AmplifyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artistId: "artist-default-id", 
      fluxSignatureId: "", 
      crystallineBloomId: "",
      promotionGoal: "",
    },
  });

  const onSubmit: SubmitHandler<AmplifyFormValues> = async (data) => {
    setIsLoading(true);
    setAmplificationResult(null);
    try {
      const result = await amplifyFluxPulse(data);
      setAmplificationResult(result);
      toast({
        title: "Boost Plan Ready!",
        description: "AI has suggested strategies to increase your art's visibility.",
      });
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

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Zap className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Boost Your Art</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charis</p>
          <CardDescription className="text-md">Get AI-powered tips to promote your art and reach a wider audience.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="artistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Artist ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., your-unique-artist-id" {...field} />
                    </FormControl>
                    <FormDescription>This is your unique identifier on the platform.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fluxSignatureId" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artwork/Series ID to Promote</FormLabel>
                    <FormControl>
                      <Input placeholder="ID of the art or series you want to boost" {...field} />
                    </FormControl>
                     <FormDescription>The main piece or collection you're focusing on.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crystallineBloomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Artwork ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ID of a single artwork within a series" {...field} />
                    </FormControl>
                    <FormDescription>If promoting a series, you can specify one piece here. Otherwise, leave blank.</FormDescription>
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
                     <FormDescription>Clearly state what you want to achieve with this promotion.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" disabled={isLoading} className="w-full text-lg py-3 transition-transform hover:scale-105">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing & Strategizing...</>
                ) : (
                  <><Target className="mr-2 h-5 w-5" /> Get Boost Strategies</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {amplificationResult && (
        <Card className="mt-8 shadow-xl bg-primary/10 border-primary card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-foreground flex items-center gap-2">
                <BarChart className="h-6 w-6 text-accent" /> Your Boost Strategy
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
        </Card>
      )}
    </div>
  );
}
