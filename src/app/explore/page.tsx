
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, Image as ImageIcon, Users, Palette } from "lucide-react";
import NextImage from "next/image"; // Renamed to avoid conflict with ImageIcon
import Link from "next/link"; // Added missing import

// Placeholder data for explore content
const exploreItems = [
  { id: "e1", type: "image", src: "https://placehold.co/400x400.png", alt: "Abstract digital art", dataAiHint: "abstract digital art" },
  { id: "e2", type: "image", src: "https://placehold.co/400x600.png", alt: "Surreal landscape photography", dataAiHint: "surreal landscape" },
  { id: "e3", type: "video", src: "https://placehold.co/400x400.png", alt: "Generative art loop", dataAiHint: "generative art loop" },
  { id: "e4", type: "image", src: "https://placehold.co/600x400.png", alt: "Detailed character illustration", dataAiHint: "character illustration" },
  { id: "e5", type: "image", src: "https://placehold.co/400x400.png", alt: "Minimalist sculpture", dataAiHint: "minimalist sculpture" },
  { id: "e6", type: "image", src: "https://placehold.co/400x500.png", alt: "Vibrant street art", dataAiHint: "street art vibrant" },
  { id: "e7", type: "image", src: "https://placehold.co/500x400.png", alt: "Concept art environment", dataAiHint: "concept art environment" },
  { id: "e8", type: "video", src: "https://placehold.co/400x400.png", alt: "Art process timelapse", dataAiHint: "art timelapse video" },
  { id: "e9", type: "image", src: "https://placehold.co/400x400.png", alt: "Artisan community highlight", dataAiHint: "community event photo" },
  { id: "e10", type: "image", src: "https://placehold.co/400x300.png", alt: "Featured new artist", dataAiHint: "new artist spotlight" },
  { id: "e11", type: "image", src: "https://placehold.co/300x400.png", alt: "Trending art style", dataAiHint: "trending art style" },
  { id: "e12", type: "image", src: "https://placehold.co/400x400.png", alt: "AI generated artwork", dataAiHint: "ai generated art" },
];

export default function ExplorePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover sticky top-[calc(var(--header-height,4rem)+1rem)] z-10 bg-background/80 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Explore Art & Creators</CardTitle>
          </div>
          <CardDescription>Discover new artworks, talented artists, and vibrant communities on ARTISAN.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search for art, artists, styles, or communities..." className="pl-10 h-11" />
            </div>
        </CardContent>
      </Card>

      <div className="masonry-grid">
        {exploreItems.map((item) => (
          <div key={item.id} className="masonry-item mb-4 card-interactive-hover rounded-lg overflow-hidden shadow-md">
            <NextImage 
              src={item.src} 
              alt={item.alt} 
              width={400} // Base width, aspect ratio will determine height
              height={item.id === 'e2' ? 600 : item.id === 'e4' ? 267 : item.id === 'e6' ? 500 : item.id === 'e7' ? 300 : item.id === 'e10' ? 300 : item.id === 'e11' ? 533 : 400} // Varied heights
              className="object-cover w-full h-auto" 
              data-ai-hint={item.dataAiHint}
            />
            {/* Overlay for item type or interaction could go here */}
          </div>
        ))}
      </div>
      <style jsx global>{`
        .masonry-grid {
          column-count: 2; /* default for small screens */
          column-gap: 1rem;
        }
        .masonry-item {
          break-inside: avoid;
          /* Add any specific item styling here */
        }
        @media (min-width: 640px) { /* sm */
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) { /* lg */
          .masonry-grid {
            column-count: 4;
          }
        }
         @media (min-width: 1280px) { /* xl */
          .masonry-grid {
            column-count: 5;
          }
        }
      `}</style>

      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-accent"/> Explore Communities</CardTitle>
            <CardDescription>Find your tribe. Connect with artists sharing your interests.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Placeholder for community links or cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["Digital Artists United", "Painters' Hub", "AI Art Explorers", "Sculpture Network"].map(name => (
                    <Button key={name} variant="secondary" className="h-auto py-3 transition-transform hover:scale-105" asChild>
                        <Link href="/communities">{name}</Link>
                    </Button>
                ))}
            </div>
        </CardContent>
         <CardFooter>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/communities">View All Communities <Compass className="ml-2 h-4 w-4"/></Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
