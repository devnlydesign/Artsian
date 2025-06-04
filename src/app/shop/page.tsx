
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, DollarSign, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '@/actions/stripe';
import { getAllShopItems, type ShopItemData } from '@/actions/shopActions'; 
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/context/AppStateContext'; 

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function ShopPage() {
  const [shopItems, setShopItems] = useState<ShopItemData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAppState(); 

  useEffect(() => {
    async function fetchShopItems() {
      setIsLoadingItems(true);
      try {
        const items = await getAllShopItems();
        setShopItems(items);
      } catch (error) {
        console.error("Error fetching shop items:", error);
        toast({ title: "Error", description: "Could not load shop items.", variant: "destructive" });
      } finally {
        setIsLoadingItems(false);
      }
    }
    fetchShopItems();
  }, [toast]);

  const handleCheckout = async (item: ShopItemData) => {
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
        itemImage: item.imageUrl, 
        itemPriceInCents: item.priceInCents, 
        quantity: 1,
        itemId: item.id,
        userId: currentUser?.uid, 
        crystallineBloomId: item.crystallineBloomId,
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
      
      if (loadingItemId === item.id) { 
        setTimeout(() => {
            setLoadingItemId(null);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Artist Shop</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Acquire prints, original works, merchandise, and digital goods directly from artists. Look for the 'Material Origin Link' on Artworks.</CardDescription>
           <Button asChild variant="outline" className="mt-4 mx-auto w-fit">
            <Link href="/my-shop/manage">Manage My Shop Items</Link>
          </Button>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center"><Sparkles className="h-6 w-6 mr-2 text-accent" /> All Items</h2>
        {isLoadingItems ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading Shop Items...</p>
          </div>
        ) : shopItems.length === 0 ? (
           <Card className="text-center py-10">
            <CardContent>
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">The shop is currently empty. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shopItems.map((item) => (
              <Card key={item.id} className="card-interactive-hover hover:shadow-2xl flex flex-col group">
                <CardHeader className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image 
                          src={item.imageUrl || "https://placehold.co/400x400.png"} 
                          alt={item.name} 
                          layout="fill" 
                          objectFit="cover" 
                          data-ai-hint={item.dataAiHint || "shop item product image"} 
                          className="transition-transform duration-300 group-hover:scale-110"
                      />
                    {item.category && <Badge variant="secondary" className="absolute top-2 right-2 bg-black/50 text-white backdrop-blur-sm">{item.category}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-2 h-16">{item.description}</p>
                  {item.artistName && <p className="text-xs text-muted-foreground mb-1">Sold by: {item.artistName}</p>}
                  <div className="flex items-center text-primary font-semibold text-xl">
                      <DollarSign className="h-5 w-5 mr-1" /> {(item.priceInCents / 100).toFixed(2)}
                  </div>
                  {item.stock !== null && <p className="text-xs text-muted-foreground mt-1">{item.isDigital ? "Digital Item" : `Stock: ${item.stock}`}</p>}
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <Button 
                    variant="gradientPrimary" 
                    className="w-full transition-transform hover:scale-105"
                    onClick={() => handleCheckout(item)}
                    disabled={loadingItemId === item.id || (item.stock !== null && !item.isDigital && item.stock <= 0)}
                  >
                    {loadingItemId === item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    {loadingItemId === item.id ? 'Processing...' : (item.stock !== null && !item.isDigital && item.stock <= 0 ? 'Out of Stock' : 'Buy Now')}
                  </Button>
                </CardFooter>
                  {item.crystallineBloomId && (
                      <div className="px-4 pb-3 text-xs text-center">
                          <Link href={`/crystalline-blooms/${item.crystallineBloomId}`} className="text-accent hover:underline hover:text-primary transition-colors">
                              View related Artwork <ArrowRight className="inline h-3 w-3"/>
                          </Link>
                      </div>
                  )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle>Secure Checkout Process</CardTitle>
            <CardDescription>All transactions are processed securely by Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image src="https://placehold.co/300x80.png" alt="Stripe and other payment methods" width={300} height={80} className="mx-auto mb-4" data-ai-hint="stripe logo payment methods" />
            <p className="text-muted-foreground">Your payment details are handled directly and securely by Stripe.</p>
        </CardContent>
      </Card>
    </div>
  );
}
