
"use client";

import React from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { ArtisanLogo } from '@/components/icons/ArtisanLogo';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAppState(); // Using login for simplicity, replace with actual signup logic
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    console.log("Signup data:", data);
    // Mock signup:
    // In a real app, you would call your backend API here
    // For now, we'll just simulate a successful signup and "log in" the user
    alert("Signup successful! (Mocked)");
    // Instead of direct login, redirect to onboarding
    sessionStorage.setItem('hasSeenWelcome', 'true'); // Mark welcome as seen
    router.push('/onboarding'); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Button variant="ghost" asChild className="absolute top-4 left-4 transition-transform hover:scale-105">
        <Link href="/auth/welcome"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Welcome</Link>
      </Button>
      <Card className="w-full max-w-md shadow-2xl transition-shadow hover:shadow-primary/20">
        <CardHeader className="text-center">
          <ArtisanLogo className="mx-auto h-16 w-16 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-gradient-primary-accent">Create Account</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            Join ARTISAN and unleash your creativity.
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
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="gradientPrimary" className="w-full text-lg py-3 transition-transform hover:scale-105 hover:shadow-lg">
                <UserPlus className="mr-2 h-5 w-5" /> Sign Up & Continue
              </Button>
            </form>
          </Form>
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
