
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { createReel } from '@/actions/reelActions'; 
import { Clapperboard, Loader2, PlusCircle, UploadCloud } from 'lucide-react'; 
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage'; // Added UploadTaskSnapshot
import { Progress } from "@/components/ui/progress"; // Added Progress

const reelFormSchema = z.object({
  caption: z.string().max(500, "Caption is too long.").optional(),
  dataAiHintVideo: z.string().max(50, "AI hint is too long (max 2 words recommended).").optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []),
});

type ReelFormValues = z.infer<typeof reelFormSchema>;

export default function NewReelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [reelVideoPreview, setReelVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const reelFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReelFormValues>({
    resolver: zodResolver(reelFormSchema),
    defaultValues: {
      caption: "",
      dataAiHintVideo: "",
      tags: [],
    },
  });

  const handleReelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setReelVideoFile(file);
        setReelVideoPreview(URL.createObjectURL(file)); 
        setUploadProgress(0); // Reset progress
      } else {
        toast({ title: "Invalid File Type", description: "Please select a video file.", variant: "destructive" });
        setReelVideoFile(null);
        setReelVideoPreview(null);
        if(reelFileInputRef.current) reelFileInputRef.current.value = "";
      }
    }
  };

  const onSubmit: SubmitHandler<ReelFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a reel.", variant: "destructive" });
      return;
    }
    if (!reelVideoFile) {
      toast({ title: "Video File Required", description: "Please select a video file for your reel.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    let uploadedOriginalVideoUrl = "";

    try {
      const videoFilePath = `reels/${currentUser.uid}/original_${Date.now()}_${reelVideoFile.name}`;
      const videoFileRef = storageRefSdk(storage, videoFilePath);
      const uploadTask = uploadBytesResumable(videoFileRef, reelVideoFile);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload failed:", error);
            setUploadProgress(null);
            reject(error);
          },
          async () => {
            uploadedOriginalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            toast({ title: "Video Uploaded", description: "Reel video successfully uploaded." });
            resolve();
          }
        );
      });
      
      const displayVideoUrl = uploadedOriginalVideoUrl;
      const videoThumbnailUrl = null; 

      const reelDetailsToSave = {
        videoUrl: displayVideoUrl, 
        videoUrlOriginal: uploadedOriginalVideoUrl,
        videoThumbnailUrl: videoThumbnailUrl, 
        caption: data.caption,
        dataAiHintVideo: data.dataAiHintVideo || data.caption?.substring(0,50) || "short video",
        tags: data.tags,
      };

      const result = await createReel(
        currentUser.uid,
        currentUser.displayName,
        currentUser.photoURL,
        reelDetailsToSave
      );

      if (result.success && result.reelId) {
        toast({ title: "Reel Created!", description: `Your reel has been posted.` });
        router.push('/reels'); 
      } else {
        toast({ title: "Error Creating Reel", description: result.message || "Could not save your reel.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting reel:", error);
      toast({ title: "Submission Error", description: "An unexpected error occurred during upload or save.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/reels/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Clapperboard className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Reel</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Share a short video moment, process, or insight with your followers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormItem>
                <FormLabel>Video File</FormLabel>
                <Card 
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-6 cursor-pointer"
                    onClick={() => reelFileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    {reelVideoPreview ? (
                        <div className="relative w-full aspect-video mb-4 rounded-md overflow-hidden bg-black">
                           <video src={reelVideoPreview} controls className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {reelVideoFile ? `Selected: ${reelVideoFile.name}` : "Click or drag to upload video"}
                    </p>
                    <Input 
                        id="reelVideoFile" 
                        type="file" 
                        className="hidden" 
                        accept="video/*" 
                        ref={reelFileInputRef}
                        onChange={handleReelFileChange} 
                        disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>
                <FormDescription>Upload your short video file (MP4, MOV, etc.).</FormDescription>
                {!reelVideoFile && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Video file is required.</p>}
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
              </FormItem>

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Write a caption for your reel..." rows={3} {...field} disabled={isSubmitting}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., art, process, creative, digitalart" {...field} onChange={e => field.onChange(e.target.value)} disabled={isSubmitting}/></FormControl>
                    <FormDescription>Comma-separated tags to help people discover your reel.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataAiHintVideo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Hint for Video (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., painting timelapse (max 2 words)" {...field} disabled={isSubmitting}/></FormControl>
                    <FormDescription>Keywords for the video, used for search/alt text if applicable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" variant="gradientPrimary" disabled={isSubmitting || !reelVideoFile || (uploadProgress !== null && uploadProgress < 100) } className="w-full text-lg py-3">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                {isSubmitting ? (uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%...` : "Posting Reel...") : "Post Reel"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
