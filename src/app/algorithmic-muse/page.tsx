
"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2, Sparkles, History, Brain } from "lucide-react"; // Added History, Brain
import { generateMusePrompt, type GenerateMusePromptInput, type GenerateMusePromptOutput } from "@/ai/flows/algorithmic-muse-prompt";
import { getMuseIdeasByUserId, type MuseIdeaData } from "@/actions/museIdeasActions"; // Added import
import { useAppState } from "@/context/AppStateContext"; // Added import
import { formatDistanceToNow } from 'date-fns'; // For formatting timestamps
import { ScrollArea } from "@/components/ui/scroll-area"; // Added import
import { Badge } from "@/components/ui/badge"; // Added import

const formSchema = z.object({
  artistCreativeHistory: z.string().min(30, "Please describe your creative history (min 30 characters).").max(2000, "Creative history is too long (max 2000 characters)."),
  currentMood: z.string().min(3, "Describe your current mood (min 3 characters).").max(200, "Mood description is too long (max 200 characters)."),
  desiredPromptType: z.enum(["visual", "textual"]),
});

type MuseFormValues = z.infer<typeof formSchema>;

export default function AlgorithmicMusePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GenerateMusePromptOutput | null>(null);
  const [pastIdeas, setPastIdeas] = useState<MuseIdeaData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();

  const form = useForm<MuseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artistCreativeHistory: "",
      currentMood: "",
      desiredPromptType: "visual",
    },
  });

  useEffect(() => {
    async function fetchPastIdeas() {
      if (isAuthenticated && currentUser?.uid) {
        setIsLoadingHistory(true);
        const ideas = await getMuseIdeasByUserId(currentUser.uid);
        setPastIdeas(ideas);
        setIsLoadingHistory(false);
      } else if (!isLoadingAuth && !isAuthenticated) {
        setPastIdeas([]);
        setIsLoadingHistory(false);
      }
    }
    if (!isLoadingAuth) {
      fetchPastIdeas();
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  const onSubmit: SubmitHandler<MuseFormValues> = async (data) => {
    if (!isAuthenticated) {
        toast({ title: "Login Required", description: "Please log in to generate and save ideas.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    setGeneratedPrompt(null);
    try {
      const result = await generateMusePrompt(data);
      setGeneratedPrompt(result);
      toast({
        title: "Idea Generated!",
        description: "Your AI Idea Sparker has delivered inspiration. It's also saved to your history.",
      });
      // Refresh history
      if (currentUser?.uid) {
        const ideas = await getMuseIdeasByUserId(currentUser.uid);
        setPastIdeas(ideas);
      }
    } catch (error) {
      console.error("Error generating muse prompt:", error);
      toast({
        title: "Error",
        description: "Failed to generate idea. Please try again.",
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
          <Lightbulb className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">AI Idea Sparker</CardTitle>
          <CardDescription className="text-md">Let AI help ignite your creativity. Share some context and get a unique idea prompt tailored to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="artistCreativeHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Creative History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your past artworks, sketches, projects, common themes, techniques, etc."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>The more detail, the better the idea!</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentMood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Mood or Focus</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., thoughtful, energetic, stuck, curious, exploring nature themes"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desiredPromptType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Idea Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select idea type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visual">Visual Idea</SelectItem>
                        <SelectItem value="textual">Textual Idea</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" disabled={isLoading || isLoadingAuth || !isAuthenticated} className="w-full text-lg py-3 transition-transform hover:scale-105">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Idea...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get New Idea
                  </>
                )}
              </Button>
               {!isAuthenticated && !isLoadingAuth && <p className="text-sm text-destructive text-center">Please log in to generate ideas.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedPrompt && (
        <Card className="mt-8 bg-primary/10 border-primary shadow-xl card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent"/> Your AI Generated Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg whitespace-pre-wrap leading-relaxed">{generatedPrompt.prompt}</p>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && (
        <Card className="mt-8 card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <History className="h-7 w-7 text-primary" />
              Your Past Ideas
            </CardTitle>
            <CardDescription>Review ideas you've previously sparked with the AI.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading history...
              </div>
            ) : pastIdeas.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {pastIdeas.map((idea) => (
                    <Card key={idea.id} className="bg-muted/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={idea.input.desiredPromptType === 'visual' ? 'secondary' : 'outline'}>
                          {idea.input.desiredPromptType.charAt(0).toUpperCase() + idea.input.desiredPromptType.slice(1)} Idea
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {idea.createdAt ? formatDistanceToNow(idea.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                      <p className="font-semibold text-md mb-2 whitespace-pre-wrap">{idea.output.prompt}</p>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-primary">View context</summary>
                        <div className="mt-2 p-2 bg-background/70 rounded-md space-y-1">
                            <p><strong>Mood:</strong> {idea.input.currentMood}</p>
                            <p><strong>History Snippet:</strong> {idea.input.artistCreativeHistory.substring(0,100)}...</p>
                        </div>
                      </details>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 mb-3"/>
                <p>You haven't generated any ideas yet.</p>
                <p>Use the form above to spark some inspiration!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

