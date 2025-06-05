
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, UserPlus, Users, Palette, Sparkles, Loader2, Image as ImageIcon, UploadCloud } from "lucide-react"; // Added ImageIcon
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ContentCard } from '@/components/content/ContentCard';
import { useAppState } from '@/context/AppStateContext';
import type { PostData } from '@/models/contentTypes';
import { getPublicPosts, createPost } from '@/actions/postActions'; // Import createPost
import { db, storage } from '@/lib/firebase'; // Import db for onSnapshot
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"; // For image upload


const placeholderPosts: PostData[] = [
  // ... (keeping existing placeholders for initial visual if needed, will be replaced by live data)
  {
    id: "ph1",
    userId: "userCosmic",
    author: { name: "Cosmic Creator", username: "cosmicart", avatarUrl: "https://placehold.co/40x40.png?text=CC", dataAiHintAvatar: "female artist portrait" },
    contentUrl: "https://placehold.co/600x750.png",
    contentType: 'post',
    caption: "Exploring new dimensions in my latest piece 'Nebula Dreams'. What do you see? ✨ #digitalart #space #abstract",
    likesCount: 1203,
    commentsCount: 88,
    createdAt: Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    dataAiHintImage: "nebula dreams abstract",
    isPublic: true,
  },
  {
    id: "ph2",
    userId: "userStudio",
    author: { name: "Studio Vibes", username: "studiolife", avatarUrl: "https://placehold.co/40x40.png?text=SV", dataAiHintAvatar: "male designer profile" },
    contentUrl: "https://placehold.co/600x600.png",
    contentType: 'post',
    caption: "Weekend experiments with generative patterns. Sometimes the process is the art. #genart #creativecoding #wip",
    likesCount: 756,
    commentsCount: 42,
    createdAt: Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    dataAiHintImage: "generative patterns code",
    isPublic: true,
  },
];

const stories = [
    { id: "s1", name: "Your Story", avatar: "https://placehold.co/64x64.png", dataAiHint: "user plus icon", isOwn: true },
    { id: "s2", name: "Elena V.", avatar: "https://placehold.co/64x64.png", dataAiHint: "female artist avatar" },
    { id: "s3", name: "Marcus R.", avatar: "https://placehold.co/64x64.png", dataAiHint: "male designer avatar" },
];

const suggestions = [
    { id: "u1", name: "Future Artist", avatar: "https://placehold.co/40x40.png", dataAiHint: "futuristic person avatar", bio: "Exploring digital frontiers." },
    { id: "u2", name: "PixelPerfect", avatar: "https://placehold.co/40x40.png", dataAiHint: "pixel character avatar", bio: "Lover of all things 8-bit." },
];

const StoriesBar = () => (
  <Card className="overflow-hidden transition-shadow hover:shadow-md mb-6 md:mb-8">
    <CardContent className="p-0">
      <div className="flex space-x-3 p-4 overflow-x-auto">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center w-20 shrink-0 cursor-pointer group">
            <div className={`relative rounded-full p-0.5 border-2 group-hover:scale-105 transition-transform ${story.isOwn ? 'border-transparent' : 'border-accent'}`}>
              <Avatar className="h-16 w-16">
                <NextImage src={story.avatar} alt={story.name} width={64} height={64} className="rounded-full" data-ai-hint={story.dataAiHint} />
              </Avatar>
              {story.isOwn && <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-card"><UserPlus className="h-3 w-3"/></div>}
            </div>
            <p className="text-xs mt-1 truncate w-full text-center group-hover:text-primary transition-colors">{story.name}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const { currentUser } = useAppState();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to create a post.", variant: "default" });
      return;
    }
    if (!caption.trim() && !imageFile) {
      toast({ title: "Empty Post", description: "Please write something or add an image.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let contentUrl: string | undefined = undefined;
    let dataAiHintImage: string | undefined = undefined;

    try {
      if (imageFile) {
        const imagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
        const imageStorageRef = storageRef(storage, imagePath);
        await uploadBytes(imageStorageRef, imageFile);
        contentUrl = await getDownloadURL(imageStorageRef);
        dataAiHintImage = "user uploaded post image"; // Generic hint
      }

      const authorDetails = {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || "Charis User",
        avatarUrl: currentUser.photoURL,
        username: currentUser.email?.split('@')[0] || currentUser.uid.substring(0,8), // Or fetch from user profile
        dataAiHintAvatar: "user avatar",
      };
      
      const result = await createPost(currentUser.uid, {
        contentType: imageFile ? 'image' : 'text',
        caption: caption.trim() || null,
        contentUrl: contentUrl,
        dataAiHintImage: dataAiHintImage,
        isPublic: true, // Default to public
      }, authorDetails);

      if (result.success) {
        toast({ title: "Post Created!", description: "Your post is now live." });
        setCaption("");
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        onPostCreated(); // Callback to refresh feed or optimistic update
      } else {
        toast({ title: "Error", description: result.message || "Could not create post.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 md:mb-8 card-interactive-hover">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "User"} />
            <AvatarFallback>{currentUser?.displayName?.substring(0,1) || "U"}</AvatarFallback>
          </Avatar>
          Create Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder={`What's on your mind, ${currentUser?.displayName || 'artist'}?`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          {imagePreview && (
            <div className="mt-2 relative w-full max-w-xs h-40 rounded border bg-muted">
              <NextImage src={imagePreview} alt="Image preview" layout="fill" objectFit="contain" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
              <ImageIcon className="mr-2 h-4 w-4" /> {imageFile ? "Change Image" : "Add Image"}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <Button type="submit" disabled={isSubmitting || (!caption.trim() && !imageFile)} variant="gradientPrimary">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


export default function HomePage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [feedPosts, setFeedPosts] = useState<PostData[]>(placeholderPosts); // Start with placeholders
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingFeed(true);
    const postsRef = collection(db, 'posts');
    const q = query(
        postsRef,
        where("isPublic", "==", true),
        where("moderationStatus", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(20) // Fetch initial 20 public posts
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const publicPosts: PostData[] = [];
        querySnapshot.forEach((doc) => {
            publicPosts.push({ id: doc.id, ...doc.data() } as PostData);
        });
        setFeedPosts(publicPosts.length > 0 ? publicPosts : []); // Clear placeholders if live data comes
        setIsLoadingFeed(false);
    }, (error) => {
        console.error("Error fetching public posts in real-time: ", error);
        toast({title: "Feed Error", description: "Could not load live feed updates.", variant: "destructive"});
        setFeedPosts(placeholderPosts); // Fallback to placeholders on error
        setIsLoadingFeed(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [toast]);


  const handlePostCreated = () => {
    // The onSnapshot listener should automatically update the feed.
    // If more immediate optimistic update is needed, that logic would go here.
    // For now, relying on the listener.
  };


  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 py-0 md:py-6"> 
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        <StoriesBar />

        {isAuthenticated && <CreatePostForm onPostCreated={handlePostCreated} />}

        {isLoadingAuth || isLoadingFeed ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading feed...</p>
          </div>
        ) : feedPosts.length === 0 ? (
             <Card className="text-center py-10 card-interactive-hover">
                <CardContent>
                    <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">No public posts found yet. Be the first to create one!</p>
                </CardContent>
            </Card>
        ) : (
          feedPosts.map((post) => (
            <ContentCard key={post.id} content={post} currentUser={currentUser} />
          ))
        )}
        {!isAuthenticated && !isLoadingFeed && (
            <Card className="mt-6 text-center p-4 bg-primary/10 border-primary/30">
                <CardDescription>
                    You are viewing public posts. <Link href="/auth/login" className="text-primary font-semibold hover:underline">Log in</Link> or <Link href="/auth/signup" className="text-primary font-semibold hover:underline">sign up</Link> to create posts and see a personalized feed!
                </CardDescription>
            </Card>
        )}
      </div>

      <aside className="lg:col-span-1 space-y-6 sticky top-20 h-fit hidden lg:block">
        <Card className="card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Suggested for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map(sugg => (
              <div key={sugg.id} className="flex items-center justify-between hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <NextImage src={sugg.avatar} alt={sugg.name} width={40} height={40} className="rounded-full" data-ai-hint={sugg.dataAiHint}/>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm hover:underline cursor-pointer">{sugg.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{sugg.bio}</p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto" asChild>
                    <Link href={isAuthenticated ? `/profile/${sugg.id}` : "/auth/login"}>Follow</Link>
                </Button>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full hover:border-primary">See All Suggestions</Button>
          </CardFooter>
        </Card>
        <Card className="card-interactive-hover">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/algorithmic-muse">AI Idea Sparker</Link></Button>
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/process-symphony">Creative Soundtracks</Link></Button>
                 <Button variant="ghost" className="w-full justify-start hover:text-accent" asChild><Link href="/crystalline-blooms/new">Create New Artwork</Link></Button>
            </CardContent>
        </Card>
        <div className="text-xs text-muted-foreground space-x-2">
            <Link href="#" className="hover:underline">About</Link>
            <Link href="#" className="hover:underline">Help</Link>
            <Link href="#" className="hover:underline">Privacy</Link>
            <Link href="#" className="hover:underline">Terms</Link>
        </div>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Charisarthub</p>
      </aside>
    </div>
  );
}

    