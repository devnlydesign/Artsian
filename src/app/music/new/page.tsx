
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
import { createMusicTrack } from '@/actions/musicActions'; 
import { Mic2, Loader2, UploadCloud, Music } from 'lucide-react'; 
import { storage } from '@/lib/firebase';
import { ref as storageRefSdk, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { Progress } from "@/components/ui/progress";

const musicFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(100, "Title is too long."),
  artist: z.string().min(1, "Artist name is required.").max(100, "Artist name is too long."),
  genre: z.string().max(50, "Genre is too long.").optional(),
  // thumbnailUrl: z.string().url("Must be a valid URL for album art.").optional().or(z.literal('')),
});

type MusicFormValues = z.infer<typeof musicFormSchema>;

export default function NewMusicPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  // const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  // const [albumArtPreview, setAlbumArtPreview] = useState<string | null>(null);
  // const albumArtInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<MusicFormValues>({
    resolver: zodResolver(musicFormSchema),
    defaultValues: {
      title: "",
      artist: currentUser?.displayName || "",
      genre: "",
    },
  });
  
  useEffect(() => {
    if(currentUser && !form.getValues("artist")) {
        form.setValue("artist", currentUser.displayName || currentUser.email?.split('@')[0] || "");
    }
  }, [currentUser, form]);

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setUploadProgress(0); 
      } else {
        toast({ title: "Invalid File Type", description: "Please select an audio file.", variant: "destructive" });
        setAudioFile(null);
        if(audioFileInputRef.current) audioFileInputRef.current.value = "";
      }
    }
  };

  const onSubmit: SubmitHandler<MusicFormValues> = async (data) => {
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!audioFile) {
      toast({ title: "Audio File Required", description: "Please select an audio file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    let uploadedAudioUrl = "";
    // let uploadedThumbnailUrl: string | undefined = undefined;

    try {
      // Upload audio file
      const audioFilePath = `music/${currentUser.uid}/audio/${Date.now()}_${audioFile.name}`;
      const audioFileRef = storageRefSdk(storage, audioFilePath);
      const audioUploadTask = uploadBytesResumable(audioFileRef, audioFile);

      await new Promise<void>((resolve, reject) => {
        audioUploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Audio upload failed:", error);
            reject(error);
          },
          async () => {
            uploadedAudioUrl = await getDownloadURL(audioUploadTask.snapshot.ref);
            resolve();
          }
        );
      });
      toast({ title: "Audio Uploaded", description: "Music track successfully uploaded." });

      // TODO: Add Album Art Upload if needed
      // if (albumArtFile) { ... }

      const musicDetailsToSave = {
        audioUrl: uploadedAudioUrl,
        title: data.title,
        artist: data.artist,
        genre: data.genre || undefined,
        // thumbnailUrl: uploadedThumbnailUrl,
      };

      const result = await createMusicTrack(currentUser.uid, musicDetailsToSave);

      if (result.success && result.musicId) {
        toast({ title: "Music Track Created!", description: `Your track "${data.title}" has been added.` });
        router.push('/'); // Or to a music page or profile
      } else {
        toast({ title: "Error Creating Track", description: result.message || "Could not save your music track.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting music track:", error);
      toast({ title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/music/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Music className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Upload New Music Track</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Share your latest song, beat, or audio creation with the world.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Track Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Ethereal Dreams" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl><Input placeholder="Your artist name" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Audio File</FormLabel>
                <Card 
                    className="border-2 border-dashed border-border hover:border-primary transition-colors p-6 cursor-pointer"
                    onClick={() => audioFileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {audioFile ? `Selected: ${audioFile.name}` : "Click or drag to upload audio (MP3, WAV, etc.)"}
                    </p>
                    <Input 
                        id="audioFile" 
                        type="file" 
                        className="hidden" 
                        accept="audio/*" 
                        ref={audioFileInputRef}
                        onChange={handleAudioFileChange} 
                        disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>
                {!audioFile && form.formState.isSubmitted && <p className="text-sm font-medium text-destructive">Audio file is required.</p>}
                {uploadProgress !== null && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
              </FormItem>
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Ambient, Electronic, Lo-fi" {...field} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* TODO: Add Album Art Upload Field here if desired */}
              <Button type="submit" variant="gradientPrimary" disabled={isSubmitting || !audioFile || (uploadProgress !== null && uploadProgress < 100)} className="w-full text-lg py-3">
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic2 className="mr-2 h-5 w-5" />}
                {isSubmitting ? (uploadProgress !== null ? `Uploading ${Math.round(uploadProgress)}%...` : "Processing...") : "Upload Track"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
