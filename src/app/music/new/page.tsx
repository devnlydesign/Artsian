
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { Mic2, Loader2, UploadCloud } from 'lucide-react'; 
// import { createMusicTrack } from '@/actions/musicActions'; // Action to be created

export default function NewMusicPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else {
        toast({ title: "Invalid File Type", description: "Please select an audio file.", variant: "destructive" });
        setAudioFile(null);
        if(audioFileInputRef.current) audioFileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!audioFile || !title) {
      toast({ title: "Missing Information", description: "Audio file and title are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    // TODO: Implement createMusicTrack action
    // 1. Upload audioFile to Firebase Storage (e.g., in /music/{userId}/{musicId}/audio/{filename})
    // 2. Get downloadURL for the audio.
    // 3. Call a server action:
    //    const result = await createMusicTrack(currentUser.uid, {
    //      audioUrl: uploadedAudioUrl,
    //      title,
    //      artist: currentUser.displayName || currentUser.email?.split('@')[0] || "Charis Artist",
    //      genre,
    //      // thumbnailUrl: (if you add album art upload)
    //    });
    //    if (result.success) { router.push('/profile'); toast(...); } else { toast(...); }
    toast({ title: "Feature Coming Soon", description: "Music upload functionality is under development." });
    console.log("Submitting music track:", { title, genre, audioFile });
    setIsSubmitting(false);
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
          <Mic2 className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Upload New Music Track</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Share your latest song, beat, or audio creation with the world.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="title">Track Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Ethereal Dreams" disabled={isSubmitting} />
            </div>
            
            <div className="space-y-1">
                <Label htmlFor="audioFile">Audio File</Label>
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
                {!audioFile && isSubmitting && <p className="text-sm font-medium text-destructive">Audio file is required.</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="genre">Genre (Optional)</Label>
              <Input id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g., Ambient, Electronic, Lo-fi" disabled={isSubmitting} />
            </div>
              
            <Button type="submit" variant="gradientPrimary" disabled={isSubmitting || !audioFile || !title} className="w-full text-lg py-3">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic2 className="mr-2 h-5 w-5" />}
              {isSubmitting ? "Uploading Track..." : "Upload Track"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
