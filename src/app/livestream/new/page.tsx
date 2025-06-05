
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { Clapperboard, Loader2, Video, Mic, Settings } from 'lucide-react'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Placeholder for actual live streaming integration

export default function NewLiveStreamPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [isStartingStream, setIsStartingStream] = useState(false);

  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request Camera/Mic permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        setHasMicPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Important: Stop tracks when component unmounts or permissions are no longer needed
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to start a live stream.',
        });
        setHasCameraPermission(false);
        setHasMicPermission(false);
      }
    };
    if (isAuthenticated) {
      getPermissions();
    }
  }, [isAuthenticated, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!streamTitle) {
      toast({ title: "Missing Information", description: "Stream title is required.", variant: "destructive" });
      return;
    }
    if (!hasCameraPermission || !hasMicPermission) {
      toast({ title: "Permissions Required", description: "Camera and Microphone access are needed to start streaming.", variant: "destructive" });
      return;
    }

    setIsStartingStream(true);
    // TODO: Integrate with a live streaming service (Agora, Mux, Twilio, etc.)
    // 1. Call your backend to get stream keys/tokens for the chosen service.
    // 2. Initialize the streaming SDK with these keys.
    // 3. Start publishing the stream from videoRef.current.srcObject.
    // 4. Create a 'livestream' document in Firestore with status 'live', stream URLs, etc.
    //    (e.g., via a server action that also interacts with the streaming service API)
    toast({ title: "Live Stream (Conceptual)", description: "Live streaming setup initiated. This is a placeholder." });
    console.log("Starting live stream:", { title: streamTitle, description: streamDescription });
    // In a real app, you'd navigate to a "streaming control room" page or update UI here.
    setIsStartingStream(false);
  };

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/livestream/new');
    return <div className="flex justify-center items-center min-h-screen"><p>Redirecting to login...</p></div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Clapperboard className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Start a New Live Stream</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>Go live, share your process, and connect with your audience in real-time.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
                <Label>Camera & Microphone Preview</Label>
                <div className="aspect-video w-full bg-black rounded-md overflow-hidden relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    {(!hasCameraPermission || !hasMicPermission) && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                            <Settings className="h-8 w-8 mb-2"/>
                            <p className="text-center">Camera/Mic access needed. Please enable permissions in your browser.</p>
                         </div>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className={`flex items-center gap-1 ${hasCameraPermission ? 'text-green-500' : 'text-destructive'}`}>
                        <Video className="h-4 w-4"/> Camera: {hasCameraPermission ? "Allowed" : "Denied"}
                    </span>
                    <span className={`flex items-center gap-1 ${hasMicPermission ? 'text-green-500' : 'text-destructive'}`}>
                        <Mic className="h-4 w-4"/> Microphone: {hasMicPermission ? "Allowed" : "Denied"}
                    </span>
                </div>
            </div>


            <div className="space-y-1">
              <Label htmlFor="streamTitle">Stream Title</Label>
              <Input id="streamTitle" value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} placeholder="e.g., Live Painting Session: Cosmic Dreams" disabled={isStartingStream} />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="streamDescription">Description (Optional)</Label>
              <Textarea id="streamDescription" value={streamDescription} onChange={(e) => setStreamDescription(e.target.value)} placeholder="What will you be streaming about?" rows={3} disabled={isStartingStream} />
            </div>
            
             <Alert variant="default">
              <Clapperboard className="h-4 w-4" />
              <AlertTitle>Live Streaming - Conceptual</AlertTitle>
              <AlertDescription>
                This UI provides basic setup. Full live streaming requires integration with a dedicated streaming service (e.g., Mux, Agora, Twilio Video, or custom RTMP server). This button simulates starting the process.
              </AlertDescription>
            </Alert>
              
            <Button type="submit" variant="gradientPrimary" disabled={isStartingStream || !hasCameraPermission || !hasMicPermission || !streamTitle} className="w-full text-lg py-3">
              {isStartingStream ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Clapperboard className="mr-2 h-5 w-5" />}
              {isStartingStream ? "Starting Stream..." : "Go Live!"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
