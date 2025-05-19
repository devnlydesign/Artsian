
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { personalizeApp, type PersonalizeAppInput, type PersonalizeAppOutput } from "@/ai/flows/personalization-assistant-flow";

const formSchema = z.object({
  userRequest: z.string().min(10, "Please describe your desired adjustment in at least 10 characters."),
});

type AssistantFormValues = z.infer<typeof formSchema>;

export default function PersonalAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<PersonalizeAppOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AssistantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userRequest: "",
    },
  });

  const onSubmit: SubmitHandler<AssistantFormValues> = async (data) => {
    setIsLoading(true);
    setAssistantResponse(null);
    try {
      const result = await personalizeApp(data);
      setAssistantResponse(result);
      toast({
        title: "Assistant Responded!",
        description: "Your AI assistant has provided some suggestions.",
      });
    } catch (error) {
      console.error("Error getting assistant response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the assistant. Please try again.",
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
          <Bot className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Your Personal AI Assistant</CardTitle>
          <CardDescription>Need help tailoring ARTISAN? Describe what you'd like to change, and I'll provide suggestions!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What would you like to adjust or create?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I want a darker theme with blue accents', 'Suggest a layout for my profile page', 'Give me ideas for a fantasy art style'"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" disabled={isLoading} className="w-full transition-transform hover:scale-105">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask Assistant
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {assistantResponse && (
        <Card className="mt-8 bg-accent/20 border-accent shadow-lg card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl text-accent-foreground flex items-center gap-2">
                 <Bot className="h-6 w-6"/> Assistant's Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-md whitespace-pre-wrap">{assistantResponse.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
