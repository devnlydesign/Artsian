
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ShopSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      // Here you would typically:
      // 1. Verify the session_id with your backend to prevent CSRF and confirm payment.
      // 2. Fulfill the order (e.g., grant access to digital content, update database).
      // For this placeholder, we'll just show a success toast.
      toast({
        title: "Payment Successful!",
        description: "Thank you for your purchase. Your order is being processed.",
        variant: "default", 
      });
      console.log("Stripe Checkout Session ID:", sessionId);
    } else {
       toast({
        title: "Order Information Missing",
        description: "Could not retrieve order details. Please contact support if you completed a payment.",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">Payment Successful!</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            Thank you for your purchase. Your transaction was completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your order details should arrive in your email shortly.
            {sessionId && <span className="block text-xs mt-2">Order Ref (Session ID): {sessionId.substring(0,15)}...</span>}
          </p>
          <Button asChild variant="gradientPrimary" className="w-full text-lg py-3 transition-transform hover:scale-105">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" /> Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full transition-transform hover:scale-105">
            <Link href="/shop">
              Continue Shopping
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
