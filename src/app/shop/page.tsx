
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, DollarSign, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '@/actions/stripe';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // Price in dollars
  imageUrl: string;
  category: string; // e.g., "Prints", "Original Artwork", "Merchandise"
  bloomLink?: string; // Link to a Crystalline Bloom
  dataAiHint: string;
}

const shopItems: ShopItem[] = [
  { id: "s1", name: "Cosmic Dance - Limited Edition Print", description: "High-quality giclée print of the 'Cosmic Dance' artwork. Limited to 50 editions, signed and numbered.", price: 150, imageUrl: "https://placehold.co/400x400.png", category: "Prints", bloomLink: "/crystalline-blooms/1", dataAiHint: "galaxy art print" },
  { id: "s2", name: "ARTISAN Signature Tee", description: "Comfortable organic cotton t-shirt with an abstract Flux Signature design. Available in S, M, L, XL.", price: 35, imageUrl: "https://placehold.co/400x400.png", category: "Merchandise", dataAiHint: "violet abstract tshirt" },
  { id: "s3", name: "Ephemeral Streams - Interactive License", description: "License to use the 'Ephemeral Streams' multimedia piece for personal non-commercial projects.", price: 75, imageUrl: "https://placehold.co/400x400.png", category: "Digital Goods", bloomLink: "/crystalline-blooms/4", dataAiHint: "software digital license" },
  { id: "s4", name: "Original Sketch: Cyber Flora Study", description: "One-of-a-kind original pencil sketch from the 'Cybernetic Flora' series. Framed.", price: 450, imageUrl: "https://placehold.co/400x400.png", category: "Original Artwork", bloomLink: "/crystalline-blooms/3", dataAiHint: "framed pencil sketch" },
];

export default function ShopPage() {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (item: ShopItem) => {
    setLoadingItemId(item.id);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        toast({ title: "Error", description: "Stripe.js failed to load.", variant: "destructive" });
        setLoadingItemId(null);
        return;
      }

      const response = await createCheckoutSession({
        itemName: item.name,
        itemDescription: item.description,
        itemImage: item.imageUrl, // Ensure this is an absolute URL or one Stripe can access
        itemPriceInCents: Math.round(item.price * 100), // Convert dollars to cents
        quantity: 1,
        itemId: item.id,
      });

      if ('error' in response || !response.sessionId) {
        toast({ title: "Checkout Error", description: response.error || "Could not create checkout session.", variant: "destructive" });
        setLoadingItemId(null);
        return;
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: response.sessionId,
      });

      if (error) {
        console.error("Stripe redirect error:", error);
        toast({ title: "Redirect Error", description: error.message || "Failed to redirect to Stripe.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Checkout process error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred during checkout.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Artist Shop</CardTitle>
          <CardDescription>Acquire prints, original works, merchandise, and digital goods directly from the artist. Look for the 'Material Origin Link' on Artworks.</CardDescription>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center"><Sparkles className="h-6 w-6 mr-2 text-accent" /> Featured Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopItems.map((item) => (
            <Card key={item.id} className="card-interactive-hover hover:shadow-2xl flex flex-col group">
              <CardHeader className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                   <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint={item.dataAiHint} 
                        className="transition-transform duration-300 group-hover:scale-110"
                    />
                   <Badge variant="secondary" className="absolute top-2 right-2 bg-black/50 text-white backdrop-blur-sm">{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2 h-16">{item.description}</p>
                 <div className="flex items-center text-primary font-semibold text-xl">
                    <DollarSign className="h-5 w-5 mr-1" /> {item.price.toFixed(2)}
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <Button 
                  variant="gradientPrimary" 
                  className="w-full transition-transform hover:scale-105"
                  onClick={() => handleCheckout(item)}
                  disabled={loadingItemId === item.id}
                >
                  {loadingItemId === item.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  {loadingItemId === item.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardFooter>
                {item.bloomLink && (
                    <div className="px-4 pb-3 text-xs text-center">
                        <Link href={item.bloomLink} className="text-accent hover:underline hover:text-primary transition-colors">
                            View related Artwork <ArrowRight className="inline h-3 w-3"/>
                        </Link>
                    </div>
                )}
            </Card>
          ))}
        </div>
      </section>

      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle>Secure Checkout Process</CardTitle>
            <CardDescription>All transactions are processed securely by Stripe. This is a placeholder for the e-commerce integration.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image src="https://placehold.co/300x80.png" alt="Stripe and other payment methods" width={300} height={80} className="mx-auto mb-4" data-ai-hint="stripe logo payment methods" />
            <p className="text-muted-foreground">Your payment details are handled directly and securely by Stripe.</p>
        </CardContent>
      </Card>
    </div>
  );
}
