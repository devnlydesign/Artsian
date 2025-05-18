"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Music, Loader2, PlayCircle } from "lucide-react";
import { generateProcessSymphony, type ProcessSymphonyInput, type ProcessSymphonyOutput } from "@/ai/flows/process-symphony-generation";
import { Slider } from "@/components/ui/slider";

const formSchema = z.object({
  typingSpeed: z.number().min(0).max(200),
  brushStrokes: z.number().min(0).max(1000),
  musicalPhrases: z.number().min(0).max(100),
  sessionEnergy: z.enum(["low", "medium", "high"]),
});

type SymphonyFormValues = z.infer<typeof formSchema>;

export default function ProcessSymphonyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSymphony, setGeneratedSymphony] = useState<ProcessSymphonyOutput | null>(null);
  const [audioPlayerKey, setAudioPlayerKey] = useState(0); // To force re-render of audio element
  const { toast } = useToast();

  const form = useForm<SymphonyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      typingSpeed: 60,
      brushStrokes: 50,
      musicalPhrases: 10,
      sessionEnergy: "medium",
    },
  });

  const onSubmit: SubmitHandler<SymphonyFormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedSymphony(null);
    try {
      const result = await generateProcessSymphony(data);
      setGeneratedSymphony(result);
      setAudioPlayerKey(prev => prev + 1); // Update key to re-mount audio player
      toast({
        title: "Process Symphony Generated!",
        description: "Your unique ambient audio track is ready.",
      });
    } catch (error) {
      console.error("Error generating process symphony:", error);
      toast({
        title: "Error",
        description: "Failed to generate symphony. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Client-side state for slider values to display them
  const [typingSpeedValue, setTypingSpeedValue] = useState(form.getValues("typingSpeed"));
  const [brushStrokesValue, setBrushStrokesValue] = useState(form.getValues("brushStrokes"));
  const [musicalPhrasesValue, setMusicalPhrasesValue] = useState(form.getValues("musicalPhrases"));

  useEffect(() => {
    const subscription = form.watch((value) => {
      setTypingSpeedValue(value.typingSpeed ?? 60);
      setBrushStrokesValue(value.brushStrokes ?? 50);
      setMusicalPhrasesValue(value.musicalPhrases ?? 10);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, form]);


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Music className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">AI Process Symphony</CardTitle>
          <CardDescription>Generate a unique ambient audio track based on the rhythm, energy, and style of your work session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="typingSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typing Speed (WPM): {typingSpeedValue}</FormLabel>
                    <FormControl>
                       <Slider
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={200}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brushStrokes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brush Strokes: {brushStrokesValue}</FormLabel>
                    <FormControl>
                       <Slider
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={1000}
                        step={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="musicalPhrases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Musical Phrases Played: {musicalPhrasesValue}</FormLabel>
                    <FormControl>
                       <Slider
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={100}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sessionEnergy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Energy</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select energy level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Symphony...</>
                ) : (
                  <><Music className="mr-2 h-4 w-4" /> Generate Symphony</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedSymphony && generatedSymphony.audioTrackDataUri && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><PlayCircle className="h-6 w-6 text-primary"/> Your Process Symphony</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <audio key={audioPlayerKey} controls src={generatedSymphony.audioTrackDataUri} className="w-full">
              Your browser does not support the audio element.
            </audio>
            <p className="text-sm text-muted-foreground mt-2">This audio is AI-generated and might be experimental.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
