
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Edit, Trash2, UserPlus, Users, Palette } from "lucide-react";
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Post {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
    username: string;
    dataAiHintAvatar: string;
  };
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  dataAiHintImage: string;
}

const placeholderPosts: Post[] = [
  {
    id: "1",
    author: { name: "Cosmic Creator", username: "cosmicart", avatarUrl: "https://placehold.co/40x40.png", dataAiHintAvatar: "artist portrait" },
    imageUrl: "https://placehold.co/600x750.png",
    caption: "Exploring new dimensions in my latest piece 'Nebula Dreams'. What do you see? ✨ #digitalart #space #abstract",
    likes: 1203,
    comments: 88,
    timestamp: "2 hours ago",
    dataAiHintImage: "galaxy abstract"
  },
  {
    id: "2",
    author: { name: "Studio Vibes", username: "studiolife", avatarUrl: "https://placehold.co/40x40.png", dataAiHintAvatar: "designer profile" },
    imageUrl: "https://placehold.co/600x600.png",
    caption: "Weekend experiments with generative patterns. Sometimes the process is the art. #genart #creativecoding #wip",
    likes: 756,
    comments: 42,
    timestamp: "1 day ago",
    dataAiHintImage: "geometric pattern"
  },
  {
    id: "3",
    author: { name: "AI Muse", username: "aimuseofficial", avatarUrl: "https://placehold.co/40x40.png", dataAiHintAvatar: "robot face" },
    imageUrl: "https://placehold.co/600x400.png",
    caption: "Generated this piece using my Algorithmic Muse tool! Prompt: 'A forest made of crystal'. Try it yourself on ARTISAN! #aiart #algorithmicmuse #artisanplatform",
    likes: 2345,
    comments: 150,
    timestamp: "3 days ago",
    dataAiHintImage: "crystal forest"
  },
];

const stories = [
    { id: "s1", name: "Your Story", avatar: "https://placehold.co/64x64.png", dataAiHint: "plus icon", isOwn: true },
    { id: "s2", name: "Elena V.", avatar: "https://placehold.co/64x64.png", dataAiHint: "artist avatar" },
    { id: "s3", name: "Marcus R.", avatar: "https://placehold.co/64x64.png", dataAiHint: "designer face" },
    { id: "s4", name: "Anya S.", avatar: "https://placehold.co/64x64.png", dataAiHint: "musician avatar" },
    { id: "s5", name: "Kai G.", avatar: "https://placehold.co/64x64.png", dataAiHint: "tech person" },
    { id: "s6", name: "ArtFeed", avatar: "https://placehold.co/64x64.png", dataAiHint: "gallery icon" },
    { id: "s7", name: "InspoHub", avatar: "https://placehold.co/64x64.png", dataAiHint: "lightbulb idea" },
];

const suggestions = [
    { id: "u1", name: "Future Artist", avatar: "https://placehold.co/40x40.png", dataAiHint: "futuristic avatar", bio: "Exploring digital frontiers." },
    { id: "u2", name: "PixelPerfect", avatar: "https://placehold.co/40x40.png", dataAiHint: "pixel art", bio: "Lover of all things 8-bit." },
    { id: "u3", name: "SoundSculptor", avatar: "https://placehold.co/40x40.png", dataAiHint: "sound wave", bio: "Crafting sonic landscapes." },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 py-6">
      {/* Main Feed Content (Left/Center for larger screens) */}
      <div className="lg:col-span-2 space-y-8">
        {/* Stories Bar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex space-x-3 p-4 overflow-x-auto">
              {stories.map(story => (
                <div key={story.id} className="flex flex-col items-center w-20 shrink-0">
                  <div className={`relative rounded-full p-0.5 border-2 ${story.isOwn ? 'border-transparent' : 'border-pink-500'}`}>
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={story.avatar} alt={story.name} data-ai-hint={story.dataAiHint} />
                      <AvatarFallback>{story.name.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    {story.isOwn && <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-card"><UserPlus className="h-3 w-3"/></div>}
                  </div>
                  <p className="text-xs mt-1 truncate w-full text-center">{story.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {placeholderPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint={post.author.dataAiHintAvatar} />
                  <AvatarFallback>{post.author.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">{post.author.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full aspect-[4/5] bg-muted"> {/* Common Instagram aspect ratio */}
                <Image
                  src={post.imageUrl}
                  alt={`Post by ${post.author.name}`}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={post.dataAiHintImage}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start p-3 space-y-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="hover:text-red-500 transition-colors">
                    <Heart className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Send className="h-6 w-6" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon">
                  <Bookmark className="h-6 w-6" />
                </Button>
              </div>
              <p className="font-semibold text-sm">{post.likes.toLocaleString()} likes</p>
              <p className="text-sm">
                <span className="font-semibold">{post.author.username}</span> {post.caption}
              </p>
              <Link href="#" className="text-xs text-muted-foreground hover:underline">
                View all {post.comments.toLocaleString()} comments
              </Link>
              <p className="text-xs text-muted-foreground uppercase">{post.timestamp}</p>
               <div className="w-full pt-2 border-t border-border">
                <form className="flex items-center gap-2">
                  <Input type="text" placeholder="Add a comment..." className="flex-1 h-9 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0" />
                  <Button variant="ghost" type="submit" size="sm" className="text-primary hover:text-primary/80">Post</Button>
                </form>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Sidebar (Right for larger screens) */}
      <aside className="lg:col-span-1 space-y-6 sticky top-20 h-fit hidden lg:block"> {/* Sticky position for desktop sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Suggested for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map(sugg => (
              <div key={sugg.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={sugg.avatar} alt={sugg.name} data-ai-hint={sugg.dataAiHint} />
                    <AvatarFallback>{sugg.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{sugg.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{sugg.bio}</p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">Follow</Button>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">See All Suggestions</Button>
          </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                 <Button variant="ghost" className="w-full justify-start" asChild><Link href="/algorithmic-muse">Algorithmic Muse</Link></Button>
                 <Button variant="ghost" className="w-full justify-start" asChild><Link href="/process-symphony">Process Symphony</Link></Button>
                 <Button variant="ghost" className="w-full justify-start" asChild><Link href="/create">Create New Bloom</Link></Button>
            </CardContent>
        </Card>
        <div className="text-xs text-muted-foreground space-x-2">
            <span>About</span>
            <span>Help</span>
            <span>Press</span>
            <span>API</span>
            <span>Jobs</span>
            <span>Privacy</span>
            <span>Terms</span>
        </div>
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} ARTISAN Platform</p>
      </aside>
    </div>
  );
}
