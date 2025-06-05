
"use client";

import React, { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { createStory } from '@/actions/storyActions'; 
import { Video, Loader2, PlusCircle, UploadCloud, Image as ImageIconLucide } from 'lucide-react'; 
import NextImage from "next/image";
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytes, getDownloadURL } from 'firebase/storage';

const storyFormSchema = z.object({
  // caption: z.string().max(200, "Caption is too long.").optional(), // Stories usually don't have long captions
  mediaType: z.enum(["image", "video"]),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export default function NewStoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [storyMediaFile, setStoryMediaFile] = useState<File | null>(null);
  const [storyMediaPreview, setStoryMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      mediaType: "image",
    },
  });
  
  const handleStoryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setStoryMediaFile(file);
        setMediaType('image');
        form.setValue('mediaType', 'image');
        setStoryMediaPreview(URL.createObjectURL(file));
      } else if (file.type.startsWith('video/')) {
        setStoryMediaFile(file);
        setMediaType('video');
        form.setValue('mediaType', 'video');
        setStoryMediaPreview(URL.createObjectURL(file));
      } else {
        toast({ title: "Invalid File Type", description: "Please select an image or video file.", variant: "destructive" });
        setStoryMediaFile(null);
        setStoryMediaPreview(null);
        setMediaType(null);
        if(storyFileInputRef.current) storyFileInputRef.current.value = "";
      }
    }
  };

  const onSubmit: SubmitHandler<StoryFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a story.", variant: "destructive" });
      return;
    }
    if (!storyMediaFile || !mediaType) {
      toast({ title: "Media File Required", description: "Please select an image or video file for your story.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let uploadedMediaUrl = "";

    try {
      const mediaFilePath = `stories/${currentUser.uid}/${Date.now()}_${storyMediaFile.name}`;
      const mediaFileRef = storageRefSdk(storage, mediaFilePath);
      await uploadBytes(mediaFileRef, storyMediaFile);
      uploadedMediaUrl = await getDownloadURL(mediaFileRef);
      toast({ title: "Media Uploaded", description: "Story media successfully uploaded." });

      const storyDetailsToSave = {
        mediaUrl: uploadedMediaUrl,
        mediaType: mediaType,
        // Add other fields like linkUrl or textOverlays if needed in future
      };

      const result = await createStory(currentUser.uid, storyDetailsToSave);

      if (result.success && result.storyId) {
        toast({
          title: "Story Posted!",
          description: `Your story is now live for 24 hours.`,
        });
        router.push('/'); 
      } else {
        toast({
          title: "Error Posting Story",
          description: result.message || "Could not save your story. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting story:", error);
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
    router.push('/auth/login?redirect=/stories/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Video className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Story</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Share an ephemeral moment with your followers. Stories last for 24 hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel>Story Media (Image or Video)</FormLabel>
                <Card 
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-6 cursor-pointer"
                    onClick={() => storyFileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    {storyMediaPreview ? (
                        <div className="relative w-full aspect-[9/16] mb-4 rounded-md overflow-hidden bg-black">
                           {mediaType === 'image' && <NextImage src={storyMediaPreview} alt="Story Preview" layout="fill" objectFit="contain" />}
                           {mediaType === 'video' && <video src={storyMediaPreview} className="w-full h-full object-contain" muted autoPlay loop />}
                        </div>
                    ) : (
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {storyMediaFile ? `Selected: ${storyMediaFile.name}` : "Click or drag to upload image/video"}
                    </p>
                    <Input 
                        id="storyMediaFile" 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*" 
                        ref={storyFileInputRef}
                        onChange={handleStoryFileChange} 
                        disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>
                <FormDescription>Upload your story content (image or short video).</FormDescription>
                {!storyMediaFile && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Story media is required.</p>}
              </FormItem>
              
              <Button type="submit" variant="gradientPrimary" disabled={isSubmitting || !storyMediaFile} className="w-full text-lg py-3">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                {isSubmitting ? "Posting Story..." : "Post Story"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
