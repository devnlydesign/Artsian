
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from "@/components/ui/form"; // Renamed FormDescription
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Users, Lock, PlusCircle, Settings, Loader2, ArrowRight, DollarSign } from "lucide-react";
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from '@/context/AppStateContext';
import Link from 'next/link';
import { 
  createBiome, 
  getAllBiomes, 
  joinBiome, 
  leaveBiome, 
  getUserBiomeMemberships,
  type BiomeData 
} from '@/actions/biomeActions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");


const createBiomeSchema = z.object({
  name: z.string().min(3, "Biome name must be at least 3 characters.").max(50, "Name too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(300, "Description too long."),
  accessType: z.enum(['free', 'paid']),
  stripePriceId: z.string().optional().refine((val, ctx) => {
    if (ctx.parent.accessType === 'paid' && (!val || val.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stripe Price ID is required for paid biomes.",
      });
      return false;
    }
    if (val && !val.startsWith('price_')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid Stripe Price ID format. It should start with 'price_'.",
        });
        return false;
    }
    return true;
  }, { message: "Stripe Price ID is required for paid biomes." }),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  dataAiHint: z.string().max(50, "AI hint too long.").optional().or(z.literal('')),
});

type CreateBiomeFormValues = z.infer<typeof createBiomeSchema>;

export default function BiomesPage() {
  const [biomes, setBiomes] = useState<BiomeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState<string | null>(null);
  const [userMemberships, setUserMemberships] = useState<string[]>([]); 
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();

  const form = useForm<CreateBiomeFormValues>({
    resolver: zodResolver(createBiomeSchema),
    defaultValues: {
      name: "",
      description: "",
      accessType: "free",
      stripePriceId: "",
      imageUrl: "https://placehold.co/400x200.png",
      dataAiHint: "private community abstract",
    },
  });

  async function fetchBiomesAndMemberships() {
    setIsLoading(true);
    try {
      const fetchedBiomes = await getAllBiomes();
      setBiomes(fetchedBiomes);
      if (currentUser?.uid) {
        const memberships = await getUserBiomeMemberships(currentUser.uid);
        setUserMemberships(memberships.filter(m => m.status === 'active').map(m => m.biomeId));
      } else {
        setUserMemberships([]);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch private spaces.", variant: "destructive" });
      console.error("Error fetching biomes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoadingAuth) {
        fetchBiomesAndMemberships();
    }
    // Check for Stripe session status in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('biome_join_success')) {
        const biomeIdParam = urlParams.get('biome_join_success');
        // Ensure biomes array is populated before finding biome name
        if (biomes.length > 0 && biomeIdParam) {
            const biomeName = biomes.find(b => b.id === biomeIdParam)?.name || "the biome";
            toast({
                title: "Payment Successful!",
                description: `Your subscription for ${biomeName} is being processed. Membership will update shortly.`,
                duration: 7000,
            });
        } else if (biomeIdParam) {
             toast({
                title: "Payment Successful!",
                description: `Your subscription for the biome is being processed. Membership will update shortly.`,
                duration: 7000,
            });
        }
        // Remove query params from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchBiomesAndMemberships(); // Re-fetch to update status, though webhook is prime source
    } else if (urlParams.get('biome_join_cancel')) {
        toast({
            title: "Payment Cancelled",
            description: "Your attempt to join the paid biome was cancelled.",
            variant: "default",
            duration: 7000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLoadingAuth]); 


  const handleCreateBiome: SubmitHandler<CreateBiomeFormValues> = async (data) => {
    if (!currentUser?.uid || !currentUser.displayName) {
      toast({ title: "Login Required", description: "Please log in to create a private space.", variant: "destructive" });
      return;
    }
    if (data.accessType === 'paid' && (!data.stripePriceId || !data.stripePriceId.startsWith('price_'))) {
      form.setError("stripePriceId", { type: "manual", message: "Valid Stripe Price ID (starting with 'price_') is required for paid biomes."});
      return;
    }

    setIsCreating(true);
    try {
      const result = await createBiome(
        currentUser.uid,
        currentUser.displayName || "Charis Artist",
        data.name,
        data.description,
        data.accessType,
        data.imageUrl || "https://placehold.co/400x200.png",
        data.dataAiHint || data.name.toLowerCase().split(" ").slice(0,2).join(" ") || "private space",
        data.stripePriceId
      );
      if (result.success && result.biomeId) {
        toast({ title: "Private Space Created!", description: `'${data.name}' is now active.` });
        form.reset();
        setIsCreateDialogOpen(false);
        await fetchBiomesAndMemberships(); 
      } else {
        toast({ title: "Creation Failed", description: result.message || "Could not create space.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating biome:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLeave = async (biome: BiomeData, isMember: boolean) => {
    if (!currentUser?.uid) {
      toast({ title: "Login Required", description: "Please log in to join or leave spaces.", variant: "destructive" });
      return;
    }
    setIsJoiningOrLeaving(biome.id);
    try {
      let result;
      if (isMember) {
        result = await leaveBiome(currentUser.uid, biome.id);
        if (result.success) {
            toast({ title: "Left Space", description: `You have left '${biome.name}'.` });
        } else {
            toast({ title: "Failed to Leave", description: result.message || "Could not leave space.", variant: "destructive" });
        }
      } else { // Attempting to join
        if (biome.accessType === 'paid') {
          if (!biome.stripePriceId) {
             toast({ title: "Configuration Error", description: "This paid biome is not configured for payments.", variant: "destructive" });
             setIsJoiningOrLeaving(null);
             return;
          }
          result = await joinBiome(currentUser.uid, currentUser.email, currentUser.displayName, biome.id);
          if (result.success && result.sessionId) {
            const stripe = await stripePromise;
            if (stripe) {
              const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
              if (stripeError) {
                console.error("Stripe redirect error:", stripeError);
                toast({ title: "Stripe Error", description: stripeError.message || "Failed to redirect to Stripe.", variant: "destructive" });
              }
            } else {
                 toast({ title: "Stripe Error", description: "Stripe.js failed to load.", variant: "destructive" });
            }
          } else if (!result.success) {
            toast({ title: "Failed to Join", description: result.message || "Could not initiate join process for paid biome.", variant: "destructive" });
          }
        } else { // Free biome
            result = await joinBiome(currentUser.uid, currentUser.email, currentUser.displayName, biome.id);
            if (result.success) {
                toast({ title: "Joined Space!", description: `Welcome to '${biome.name}'!` });
            } else {
                toast({ title: "Failed to Join", description: result.message || "Could not join space.", variant: "destructive" });
            }
        }
      }

      if (result?.success && (biome.accessType === 'free' || isMember)) { 
        await fetchBiomesAndMemberships(); 
      } else if (result?.success === false) { 
         await fetchBiomesAndMemberships();
      }
    } catch (error) {
      console.error("Error joining/leaving biome:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsJoiningOrLeaving(null);
    }
  };

  if (isLoadingAuth || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your private spaces...</p>
        </div>
    );
  } 
    return (
      <div className="space-y-8">
        <Card className="shadow-lg card-interactive-hover">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl text-gradient-primary-accent">My Private Spaces (Biomes)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
            <CardDescription>Manage your secure spaces. Control access, share exclusive content, and build your communities.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isAuthenticated ? (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradientPrimary" className="transition-transform hover:scale-105">
                      <PlusCircle className="mr-2 h-5 w-5" /> Create New Private Space
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create a New Private Space</DialogTitle>
                    <DialogDescription>
                      Fill in the details for your new exclusive space.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateBiome)} className="space-y-4 py-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Space Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Inner Circle" {...field} /></FormControl>
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
                            <FormControl><Textarea placeholder="What is this space for?" {...field} rows={3} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Type</FormLabel>
                             <Select onValueChange={(value) => {field.onChange(value); form.setValue('stripePriceId', ''); form.clearErrors('stripePriceId');}} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select access type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="paid">Paid (Subscription)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("accessType") === "paid" && (
                           <FormField
                              control={form.control}
                              name="stripePriceId"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Stripe Price ID</FormLabel>
                                  <FormControl><Input placeholder="price_xxxx (from Stripe Dashboard)" {...field} /></FormControl>
                                  <ShadFormDescription className="text-xs">Get this from your Stripe Product. This enables subscription via Stripe.</ShadFormDescription>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                      )}
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
                            <FormControl><Input placeholder="e.g., exclusive community" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {form.reset(); setIsCreateDialogOpen(false);}}>Cancel</Button>
                        <Button type="submit" variant="gradientPrimary" disabled={isCreating}>
                          {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isCreating ? "Creating..." : "Create Space"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-sm text-muted-foreground">Log in to create private spaces.</p>
            )}
          </CardContent>
        </Card>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Spaces</h2>
          {biomes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {biomes.map((biome) => {
                const isMember = userMemberships.includes(biome.id);
                const isOwner = biome.creatorId === currentUser?.uid;
                return (
                <Card key={biome.id} className="card-interactive-hover group flex flex-col">
                    <a className="flex flex-col flex-1 cursor-pointer" 
                       onClick={() => toast({title: "Biome Detail Page", description: "Navigation to individual biome pages with posts and member lists coming soon!"})}> {/* Placeholder action */}
                      <CardHeader className="p-0">
                        <div className="relative aspect-[16/9] rounded-t-lg overflow-hidden">
                            <Image 
                                src={biome.imageUrl || "https://placehold.co/400x200.png"} 
                                alt={biome.name} 
                                layout="fill" 
                                objectFit="cover"
                                data-ai-hint={biome.dataAiHint || biome.name.toLowerCase().split(" ").slice(0,2).join(" ") || "private space"}
                                className="transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            {isOwner && <Badge variant="secondary" className="absolute top-2 left-2">Owner</Badge>}
                             {biome.accessType === 'paid' && <Badge variant="destructive" className="absolute top-2 right-2"><DollarSign className="h-3 w-3 mr-1"/>Paid</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 flex-1">
                        <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{biome.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-3 h-16">{biome.description}</CardDescription>
                      </CardContent>
                    </a>
                  <CardFooter className="p-4 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground flex items-center">
                        <Users className="mr-1.5 h-4 w-4 text-primary" /> {biome.memberCount || 0} members
                    </div>
                    {isAuthenticated && !isOwner && (
                    <Button 
                        variant={isMember ? "outline" : (biome.accessType === 'paid' ? "secondary" : "default")}
                        size="sm" 
                        className={cn("transition-colors", 
                          isMember ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" : 
                          (biome.accessType === 'paid' ? "border-green-500 text-green-600 hover:bg-green-500/10" : "group-hover:bg-accent group-hover:text-accent-foreground")
                        )}
                        onClick={() => handleJoinLeave(biome, isMember)}
                        disabled={isJoiningOrLeaving === biome.id}
                    >
                      {isJoiningOrLeaving === biome.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isMember ? null : (biome.accessType === 'paid' ? <DollarSign className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4"/>))}
                      {isJoiningOrLeaving === biome.id ? (isMember ? 'Leaving...' : 'Processing...') : (isMember ? 'Leave' : (biome.accessType === 'paid' ? 'Join (Paid)' : 'Join'))}
                    </Button>
                    )}
                    {!isAuthenticated && (
                      <Button asChild size="sm" variant={biome.accessType === 'paid' ? "secondary" : "default"}>
                          <Link href="/auth/login">{biome.accessType === 'paid' ? 'Join (Paid)' : 'Join'}</Link>
                      </Button>
                    )}
                    {isOwner && (
                       <Button variant="outline" size="sm" className="group-hover:bg-accent group-hover:text-accent-foreground" onClick={() => toast({title: "Manage Biome", description:"Biome management page coming soon!"})}>
                          <Settings className="mr-2 h-4 w-4" /> Manage
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
              })}
            </div>
          ) : (
            <Card className="card-interactive-hover">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto h-12 w-12 mb-3"/>
                <p>You haven't created or joined any Private Spaces yet.</p>
                {isAuthenticated && <Button variant="link" className="mt-2" onClick={() => setIsCreateDialogOpen(true)}>Get started by creating one!</Button>}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    );
  }
