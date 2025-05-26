
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { createArtwork, type ArtworkData } from '@/actions/artworkActions';
import { Gem, Loader2, PlusCircle } from 'lucide-react';

const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title is too long."),
  type: z.enum(["Artwork", "Process Chronicle", "Sketch", "Multimedia", "Other"]),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000, "Description is too long."),
  imageUrl: z.string().url("Must be a valid URL for the image."),
  dataAiHint: z.string().min(2, "AI hint must be at least 2 characters.").max(50, "AI hint is too long (max 2 words recommended).").optional(),
  fullContentUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  details: z.string().max(2000, "Details are too long.").optional().or(z.literal('')),
  // tags: z.string().optional(), // For simplicity, tags can be a comma-separated string later parsed
});

type ArtworkFormValues = z.infer<typeof artworkFormSchema>;

export default function NewCrystallineBloomPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkFormSchema),
    defaultValues: {
      title: "",
      type: "Artwork",
      description: "",
      imageUrl: "",
      dataAiHint: "",
      fullContentUrl: "",
      details: "",
    },
  });

  const onSubmit: SubmitHandler<ArtworkFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to create an artwork.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const artworkDetailsToSave = {
        title: data.title,
        type: data.type,
        description: data.description,
        imageUrl: data.imageUrl,
        dataAiHint: data.dataAiHint || data.title.toLowerCase().split(" ").slice(0,2).join(" ") || "abstract art", // Default AI hint
        fullContentUrl: data.fullContentUrl || undefined,
        details: data.details || undefined,
      };

      const result = await createArtwork(currentUser.uid, artworkDetailsToSave);

      if (result.success && result.artworkId) {
        toast({
          title: "Artwork Created!",
          description: `'${data.title}' has been added to your collection.`,
        });
        router.push('/crystalline-blooms'); // Redirect to the artworks page
      } else {
        toast({
          title: "Error Creating Artwork",
          description: result.message || "Could not save your artwork. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting artwork:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/crystalline-blooms/new'); // Or a more user-friendly "please login" page
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Artwork</CardTitle>
          <CardDescription>Add a new piece to your ARTISAN collection. Fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Nebula Dreams" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Artwork</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select artwork type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Artwork">Artwork (General)</SelectItem>
                        <SelectItem value="Process Chronicle">Process Chronicle</SelectItem>
                        <SelectItem value="Sketch">Sketch</SelectItem>
                        <SelectItem value="Multimedia">Multimedia</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe your artwork, its meaning, or the techniques used..." rows={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Image URL</FormLabel>
                    <FormControl><Input type="url" placeholder="https://example.com/your-artwork.jpg" {...field} /></FormControl>
                    <FormDescription>Link to the primary visual representation of your artwork.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., galaxy space (max 2 words)" {...field} /></FormControl>
                    <FormDescription>Keywords for AI image search if using placeholders or for alt text generation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullContentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Content URL (Optional)</FormLabel>
                    <FormControl><Input type="url" placeholder="Link to high-res image, video, or interactive content" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Further information, artist statement for this piece, etc." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" disabled={isSubmitting} className="w-full text-lg py-3">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                {isSubmitting ? "Creating Artwork..." : "Add Artwork to Collection"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
