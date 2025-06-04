
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { CharisMonogramLogo } from '@/components/icons/CharisMonogramLogo';
import { GoogleIcon } from '@/components/icons/GoogleIcon'; // Added
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { Separator } from '@/components/ui/separator'; // Added

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signupUser, signInWithGoogle } = useAppState(); // Added signInWithGoogle
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Added

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    await signupUser(data.email, data.password);
    setIsLoading(false); // This will be set by onAuthStateChanged in context if successful
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    setIsGoogleLoading(false); // This will be set by onAuthStateChanged
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Button variant="ghost" asChild className="absolute top-4 left-4 transition-transform hover:scale-105">
        <Link href="/auth/welcome"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Welcome</Link>
      </Button>
      <Card className="w-full max-w-md shadow-2xl transition-shadow hover:shadow-primary/20">
        <CardHeader className="text-center">
          <CharisMonogramLogo className="mx-auto h-16 w-16 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">Create Account</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            Join Charisarthub and unleash your creativity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="•••••••• (min. 6 characters)" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" className="w-full text-lg py-3 transition-transform hover:scale-105 hover:shadow-lg" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
              </Button>
            </form>
          </Form>

          <div className="my-6 flex items-center">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs text-muted-foreground uppercase">Or</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full text-md py-3 transition-transform hover:scale-105 hover:shadow-sm" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
            {isGoogleLoading ? 'Signing Up...' : 'Sign Up with Google'}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    