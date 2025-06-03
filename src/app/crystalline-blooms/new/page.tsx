
"use client";

import React, { useState, useRef } from 'react';
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
import { createArtwork, type LayerData } from '@/actions/artworkActions'; 
import { Gem, Loader2, PlusCircle, UploadCloud, FileText } from 'lucide-react'; 
import NextImage from "next/image";
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytes, getDownloadURL } from 'firebase/storage';

const artworkFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title is too long."),
  type: z.enum(["Artwork", "Process Chronicle", "Sketch", "Multimedia", "Other"]),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000, "Description is too long."),
  dataAiHint: z.string().min(2, "AI hint must be at least 2 characters.").max(50, "AI hint is too long (max 2 words recommended).").optional(),
  primaryTextContent: z.string().max(5000, "Primary text content is too long.").optional().or(z.literal('')), 
});

type ArtworkFormValues = z.infer<typeof artworkFormSchema>;

export default function NewCrystallineBloomPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [artworkImageFile, setArtworkImageFile] = useState<File | null>(null);
  const [artworkImagePreview, setArtworkImagePreview] = useState<string | null>(null);
  const artworkFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkFormSchema),
    defaultValues: {
      title: "",
      type: "Artwork",
      description: "",
      dataAiHint: "",
      primaryTextContent: "",
    },
  });

  const handleArtworkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setArtworkImageFile(file);
      setArtworkImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ArtworkFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to create an artwork.", variant: "destructive" });
      return;
    }
    if (!artworkImageFile) {
      toast({ title: "Cover Image Required", description: "Please select a cover image for your artwork.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let uploadedImageUrl = "";
    const newLayers: LayerData[] = [];

    try {
      const artworkFilePath = `artworks/${currentUser.uid}/${Date.now()}_${artworkImageFile.name}`;
      const artworkFileRef = storageRefSdk(storage, artworkFilePath);
      await uploadBytes(artworkFileRef, artworkImageFile);
      uploadedImageUrl = await getDownloadURL(artworkFileRef);
      toast({ title: "Cover Image Uploaded", description: "Artwork cover image successfully uploaded." });

      if (data.primaryTextContent && data.primaryTextContent.trim() !== "") {
        newLayers.push({
          id: `text-${Date.now()}`, 
          type: "text",
          content: data.primaryTextContent,
          order: 1,
          title: "Main Content" 
        });
      }

      const artworkDetailsToSave = {
        title: data.title,
        type: data.type,
        description: data.description,
        imageUrl: uploadedImageUrl, 
        dataAiHint: data.dataAiHint || data.title.toLowerCase().split(" ").slice(0,2).join(" ") || "abstract art",
        layers: newLayers,
      };

      const result = await createArtwork(currentUser.uid, artworkDetailsToSave);

      if (result.success && result.artworkId) {
        toast({
          title: "Artwork Created!",
          description: `'${data.title}' has been added to your collection.`,
        });
        router.push('/crystalline-blooms'); 
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
        description: "An unexpected error occurred during upload or save. Please try again.",
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
    router.push('/auth/login?redirect=/crystalline-blooms/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Artwork</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charis</p>
          <CardDescription>Add a new piece to your Charis Art Hub collection. Fill in the details below.</CardDescription>
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
                    <FormControl><Input placeholder="e.g., Nebula Dreams" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <Card 
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-6 cursor-pointer"
                    onClick={() => artworkFileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    {artworkImagePreview ? (
                        <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                           <NextImage src={artworkImagePreview} alt="Artwork Preview" layout="fill" objectFit="contain" />
                        </div>
                    ) : (
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {artworkImageFile ? `Selected: ${artworkImageFile.name}` : "Click or drag to upload cover image"}
                    </p>
                    <Input 
                        id="artworkImageFile" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        ref={artworkFileInputRef}
                        onChange={handleArtworkFileChange} 
                        disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>
                 <FormDescription>This will be the main visual (thumbnail/cover) for your artwork.</FormDescription>
                {!artworkImageFile && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Cover image is required.</p>}
              </FormItem>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Artwork</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                    <FormLabel>General Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe your artwork, its meaning, or the techniques used for the cover..." rows={4} {...field} disabled={isSubmitting}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryTextContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Primary Text Content (Optional Layer)
                    </FormLabel>
                    <FormControl><Textarea placeholder="Enter the main text content for this artwork. This will be stored as a distinct layer." rows={6} {...field} disabled={isSubmitting}/></FormControl>
                    <FormDescription>This content will be displayed as a primary text layer when viewing the artwork details.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Hint for Cover Image (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., galaxy space (max 2 words)" {...field} disabled={isSubmitting}/></FormControl>
                    <FormDescription>Keywords for the cover image, used for search/alt text.</FormDescription>
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
