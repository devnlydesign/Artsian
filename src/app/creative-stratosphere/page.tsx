
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, Users, Palette, Sparkles, Loader2 } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { getPublicFluxSignatures, type StratosphereItemData } from '@/actions/stratosphereActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function CreativeStratospherePage() {
  const [stratosphereItems, setStratosphereItems] = useState<StratosphereItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const items = await getPublicFluxSignatures();
      setStratosphereItems(items);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover sticky top-[calc(var(--header-height,4rem)+1rem)] z-10 bg-background/80 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl text-gradient-primary-accent">Creative Stratosphere</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground ml-10">Created by Charis</p>
          <CardDescription className="ml-10 mt-1">Discover the vibrant pulse of Charis Art Hub. Explore active Flux Signatures and trending creative energies.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search the Stratosphere (artists, styles...)" className="pl-10 h-11" />
            </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading the Stratosphere...</p>
        </div>
      ) : stratosphereItems.length === 0 ? (
        <Card className="text-center py-10 card-interactive-hover">
            <Palette className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl">The Stratosphere is Quiet</CardTitle>
            <CardDescription className="mt-2">No public Flux Signatures found at the moment. Be the first to shine!</CardDescription>
        </Card>
      ) : (
        <div className="masonry-grid">
          {stratosphereItems.map((item) => (
            <Link key={item.userId} href={`/profile/${item.userId}`} legacyBehavior passHref>
              <a className="masonry-item mb-4 block card-interactive-hover rounded-lg overflow-hidden shadow-md group">
                <Card className="h-full flex flex-col">
                  <div className="relative w-full aspect-[16/9] bg-muted">
                    <NextImage
                      src={item.fluxSignature.visualRepresentation || "https://placehold.co/800x400.png"}
                      alt={`${item.fullName || item.username}'s Flux Signature Visual`}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={item.fluxSignature.dataAiHintVisual || "abstract art"}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <CardContent className="p-3 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.photoURL} alt={item.fullName || item.username} data-ai-hint="artist avatar" />
                        <AvatarFallback>{(item.fullName || item.username || "A").substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.fullName || item.username}</p>
                        {item.username && <p className="text-xs text-muted-foreground truncate">@{item.username}</p>}
                      </div>
                    </div>
                    {item.fluxSignature.keywords && item.fluxSignature.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.fluxSignature.keywords.slice(0,3).map(keyword => (
                          <Badge key={keyword} variant="secondary" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.fluxSignature.style || "Evolving Artist"}</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
      <style jsx global>{`
        .masonry-grid {
          column-count: 1; 
          column-gap: 1rem;
        }
        .masonry-item {
          break-inside: avoid;
        }
        @media (min-width: 640px) { 
          .masonry-grid {
            column-count: 2;
          }
        }
        @media (min-width: 1024px) { 
          .masonry-grid {
            column-count: 3;
          }
        }
         @media (min-width: 1280px) { 
          .masonry-grid {
            column-count: 4;
          }
        }
      `}</style>

      <Card className="card-interactive-hover">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> Trending Creative Storms</CardTitle>
            <CardDescription>Hotspots of creative energy and collaboration. (Feature coming soon)</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
            <p>This section will highlight trending themes, artists, and collaborations based on platform activity.</p>
        </CardContent>
         <CardFooter>
            <Button variant="outline" className="w-full" disabled>
                View All Creative Storms <Compass className="ml-2 h-4 w-4"/>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
