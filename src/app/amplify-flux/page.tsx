
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
import { Zap, Loader2, BarChart, CheckCircle } from "lucide-react";
import { amplifyFluxPulse, type AmplifyFluxPulseInput, type AmplifyFluxPulseOutput } from "@/ai/flows/amplify-flux-pulse";

const formSchema = z.object({
  artistId: z.string().min(1, "Artist ID is required."),
  fluxSignatureId: z.string().min(1, "Flux Signature ID is required."),
  crystallineBloomId: z.string().optional(),
  promotionGoal: z.string().min(10, "Promotion goal must be at least 10 characters."),
});

type AmplifyFormValues = z.infer<typeof formSchema>;

export default function AmplifyFluxPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [amplificationResult, setAmplificationResult] = useState<AmplifyFluxPulseOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AmplifyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artistId: "artist-default-id", // Placeholder
      fluxSignatureId: "fluxsig-default-id", // Placeholder
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
        title: "Flux Amplification Plan Ready!",
        description: "AI has suggested strategies to boost your visibility.",
      });
    } catch (error) {
      console.error("Error amplifying flux pulse:", error);
      toast({
        title: "Error",
        description: "Failed to generate amplification plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Zap className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Amplify Flux Pulse</CardTitle>
          <CardDescription>Strategically increase the visibility and intensity of your Flux Signature or Crystalline Blooms with AI guidance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="artistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Your unique artist identifier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fluxSignatureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flux Signature ID</FormLabel>
                    <FormControl>
                      <Input placeholder="The ID of your Flux Signature" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crystallineBloomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crystalline Bloom ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ID of a specific artwork to promote" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank to focus on your overall Flux Signature.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promotionGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion Goal</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Increase followers by 20%, promote my new 'Cosmic Dreams' artwork, drive traffic to my shop."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" disabled={isLoading} className="w-full transition-transform hover:scale-105">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing & Strategizing...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" /> Amplify My Flux</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {amplificationResult && (
        <Card className="mt-8 shadow-lg bg-primary/5 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <BarChart className="h-6 w-6" /> Amplification Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Suggested Strategies:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {amplificationResult.suggestedStrategies.map((strategy, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
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

