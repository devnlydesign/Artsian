
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, PlusCircle, MessageSquareHeart, Palette, Loader2, ArrowRight } from "lucide-react"; // Added ArrowRight
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from '@/context/AppStateContext';
import Link from 'next/link'; // Import Next.js Link
import { 
  createCommunity, 
  getAllPublicCommunities, 
  joinCommunity, 
  leaveCommunity, 
  getUserCommunityMemberships,
  type CommunityData
} from '@/actions/communityActions';
import { cn } from '@/lib/utils';

const createCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters.").max(50, "Name too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(300, "Description too long."),
  imageUrl: z.string().url("Must be a valid URL (e.g., https://placehold.co/400x200.png)").optional().or(z.literal('')),
  dataAiHint: z.string().max(50, "AI hint too long (max 2 words recommended).").optional().or(z.literal('')),
});

type CreateCommunityFormValues = z.infer<typeof createCommunitySchema>;

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState<string | null>(null);
  const [userMemberships, setUserMemberships] = useState<string[]>([]); 
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();

  const form = useForm<CreateCommunityFormValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "https://placehold.co/400x200.png",
      dataAiHint: "community group abstract",
    },
  });

  async function fetchCommunitiesAndMemberships() {
    setIsLoading(true);
    try {
      const fetchedCommunities = await getAllPublicCommunities();
      setCommunities(fetchedCommunities);
      if (currentUser?.uid) {
        const memberships = await getUserCommunityMemberships(currentUser.uid);
        setUserMemberships(memberships.map(m => m.communityId));
      } else {
        setUserMemberships([]);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch communities.", variant: "destructive" });
      console.error("Error fetching communities:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoadingAuth) {
        fetchCommunitiesAndMemberships();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLoadingAuth]);


  const handleCreateCommunity: SubmitHandler<CreateCommunityFormValues> = async (data) => {
    if (!currentUser?.uid || !currentUser.displayName) {
      toast({ title: "Login Required", description: "Please log in to create a community.", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createCommunity(
        currentUser.uid,
        currentUser.displayName || "Anonymous Artist",
        data.name,
        data.description,
        data.imageUrl || "https://placehold.co/400x200.png",
        data.dataAiHint || data.name.toLowerCase().split(" ").slice(0,2).join(" ") || "community group"
      );
      if (result.success && result.communityId) {
        toast({ title: "Community Created!", description: `'${data.name}' is now live.` });
        form.reset();
        setIsCreateDialogOpen(false);
        await fetchCommunitiesAndMemberships(); 
      } else {
        toast({ title: "Creation Failed", description: result.message || "Could not create community.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLeave = async (communityId: string, communityName: string, isMember: boolean) => {
    if (!currentUser?.uid) {
      toast({ title: "Login Required", description: "Please log in to join or leave communities.", variant: "destructive" });
      return;
    }
    setIsJoiningOrLeaving(communityId);
    try {
      let result;
      if (isMember) {
        result = await leaveCommunity(currentUser.uid, communityId);
        toast({ title: "Left Community", description: `You have left '${communityName}'.` });
      } else {
        result = await joinCommunity(currentUser.uid, communityId);
        toast({ title: "Joined Community!", description: `Welcome to '${communityName}'!` });
      }

      if (result.success) {
        await fetchCommunitiesAndMemberships(); 
      } else {
        toast({ title: "Action Failed", description: result.message || "Could not update membership.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error joining/leaving community:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsJoiningOrLeaving(null);
    }
  };

  if (isLoadingAuth || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading communities...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Communities</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Discover and join communities of artists. Share your passion, collaborate, and grow together.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-lg relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search for communities..." className="pl-10 h-11" />
            </div>
            {isAuthenticated && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradientPrimary" className="transition-transform hover:scale-105">
                    <PlusCircle className="mr-2 h-5 w-5" /> Create New Community
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Community</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new community. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Community Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Digital Painters Hub" {...field} /></FormControl>
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
                          <FormControl><Textarea placeholder="What is this community about?" {...field} rows={3} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <FormControl><Input type="url" placeholder="https://placehold.co/400x200.png" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataAiHint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Hint for Image (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g., abstract art group" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" variant="gradientPrimary" disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isCreating ? "Creating..." : "Save Community"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            )}
            {!isAuthenticated && <p className="text-sm text-muted-foreground">Log in to create communities.</p>}
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="text-accent h-6 w-6"/> All Communities
        </h2>
        {communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => {
              const isMember = userMemberships.includes(community.id);
              return (
                <Card key={community.id} className="card-interactive-hover group flex flex-col">
                  <Link href={`/communities/${community.id}`} legacyBehavior passHref>
                    <a className="flex flex-col flex-1 cursor-pointer">
                      <CardHeader className="p-0">
                        <div className="relative aspect-[16/9] rounded-t-lg overflow-hidden">
                            <Image 
                                src={community.imageUrl || "https://placehold.co/400x200.png"} 
                                alt={community.name} 
                                layout="fill" 
                                objectFit="cover"
                                data-ai-hint={community.dataAiHint || community.name.toLowerCase().split(" ").slice(0,2).join(" ") || "community group"}
                                className="transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 flex-1">
                        <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{community.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-3 h-16">{community.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-1">Created by: {community.creatorName}</p>
                      </CardContent>
                    </a>
                  </Link>
                  <CardFooter className="p-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground flex items-center">
                        <Users className="mr-1.5 h-4 w-4 text-primary" /> {community.memberCount || 0} members
                    </div>
                    {isAuthenticated ? (
                    <Button 
                        variant={isMember ? "outline" : "default"} 
                        size="sm" 
                        className={cn("transition-colors", isMember ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" : "group-hover:bg-accent group-hover:text-accent-foreground")}
                        onClick={() => handleJoinLeave(community.id, community.name, isMember)}
                        disabled={isJoiningOrLeaving === community.id}
                    >
                      {isJoiningOrLeaving === community.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isMember ? null : <ArrowRight className="mr-2 h-4 w-4"/>)}
                      {isJoiningOrLeaving === community.id ? (isMember ? 'Leaving...' : 'Joining...') : (isMember ? 'Leave' : 'Join')}
                    </Button>
                    ) : (
                      <Button asChild size="sm"><Link href="/auth/login">Join</Link></Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                  <MessageSquareHeart className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                  <p>No communities found yet. Why not start your own?</p>
              </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
    
