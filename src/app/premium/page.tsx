
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Star, TrendingUp, Zap, Gift, Rocket } from "lucide-react";
import Link from "next/link";

const basicFeatures = [
  "Create & Share Artworks (Crystalline Blooms)",
  "Personalized Artistic Style (Flux Signature)",
  "Join & Explore Communities",
  "Up to 6 links on your profile",
  "Standard Discovery features",
  "Direct Messaging",
];

const premiumFeatures = [
  "Everything in Basic, plus:",
  "**Exclusive Premium Badge / Checkmark** on Profile",
  "**Unlimited links** on your profile",
  "**Create a custom portfolio website** directly on ARTISAN",
  "**Enhanced Discovery & Visibility** (Amplify Flux Pulse priority)",
  "**Create & Host Broadcasting Channels**",
  "Access to advanced AI tools & insights",
  "Early access to new features",
  "Ad-free experience (if ads are introduced later)",
];

export default function PremiumPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card className="shadow-lg card-interactive-hover text-center">
        <CardHeader>
          <Star className="mx-auto h-16 w-16 text-amber-400 mb-3 animate-pulse" />
          <CardTitle className="text-4xl font-bold text-gradient-primary-accent">ARTISAN Premium</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            Elevate your creative journey and unlock exclusive benefits.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-lg mb-6">
            Supercharge your presence, connect more deeply, and stand out. <br/>
            <span className="font-semibold text-primary">Try Premium free for 3 months!</span>
          </p>
           <Button size="lg" variant="gradientPrimary" className="text-xl py-4 px-8 transition-transform hover:scale-105">
            <Gift className="mr-2 h-6 w-6"/> Start Your 3-Month Free Trial
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Then $9.99/month. Cancel anytime.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="card-interactive-hover">
          <CardHeader>
            <CardTitle className="text-2xl">Basic Plan</CardTitle>
            <CardDescription>Core features to get you started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {basicFeatures.map((feature, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>Currently Active</Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-primary shadow-2xl card-interactive-hover relative overflow-hidden">
            <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold rounded-br-md transform -rotate-12 -translate-x-2 -translate-y-1 shadow-md">
                <Sparkles className="inline h-3 w-3 mr-1" /> Most Popular
            </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-7 w-7 text-primary"/>Premium Plan
            </CardTitle>
            <CardDescription>Unlock the full power of ARTISAN.</CardDescription>
            <p className="text-3xl font-bold text-primary pt-2">$9.99 <span className="text-sm font-normal text-muted-foreground">/ month (after trial)</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <Star className="h-5 w-5 text-amber-400 mr-3 shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              </div>
            ))}
          </CardContent>
          <CardFooter>
             <Button size="lg" variant="gradientPrimary" className="w-full text-lg transition-transform hover:scale-105">
                <Gift className="mr-2 h-5 w-5"/> Start 3-Month Free Trial
            </Button>
          </CardFooter>
        </Card>
      </div>
       <Card className="text-center card-interactive-hover">
            <CardHeader>
                <CardTitle>Ready to Amplify Your Art?</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Join thousands of artists leveraging premium tools to grow their audience and showcase their work like never before.</p>
                <Button variant="link" asChild>
                    <Link href="/contact-sales">Have questions or need a custom plan? Contact Us</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
