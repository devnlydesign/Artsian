
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, TrendingUp, RotateCcw, Users, Palette, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { searchUsersByNameOrUsername, searchArtworksByTitle } from '@/actions/searchActions';
import type { UserProfileData } from '@/actions/userProfile';
import type { ArtworkData } from '@/actions/artworkActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userResults, setUserResults] = useState<UserProfileData[]>([]);
  const [artworkResults, setArtworkResults] = useState<ArtworkData[]>([]);

  const searchCategories = [
    { name: "Trending Artists", dataAiHint: "popular artist spotlight" },
    { name: "Digital Painting", dataAiHint: "digital art tools" },
    { name: "Generative Art", dataAiHint: "algorithmic abstract art" },
    { name: "Photography", dataAiHint: "vintage camera lens" },
    { name: "Sculpture", dataAiHint: "modern stone sculpture" },
    { name: "Music Production", dataAiHint: "audio mixing console" },
    { name: "AI Art", dataAiHint: "ai robot painting" },
    { name: "Illustration", dataAiHint: "fantasy character illustration" },
  ];

  const recentSearches = ["abstract art", "surrealism", "violet color palette"];
  const trendingTopics = ["#NeoSurrealism", "#AICollaborations", "FluxSignatures2024"];

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!searchTerm.trim()) {
      setUserResults([]);
      setArtworkResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const [users, artworks] = await Promise.all([
        searchUsersByNameOrUsername(searchTerm),
        searchArtworksByTitle(searchTerm)
      ]);
      setUserResults(users);
      setArtworkResults(artworks);
    } catch (error) {
      console.error("Search error:", error);
      // Optionally show a toast message
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transition-shadow hover:shadow-xl card-interactive-hover">
        <CardHeader>
          <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search artists, artworks, genres..."
              className="w-full pl-12 text-lg h-14 rounded-lg shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
             {/* Hidden submit button for form submission on enter */}
            <button type="submit" hidden disabled={isSearching} />
          </form>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl mb-1 text-center text-gradient-primary-accent">Discover & Explore</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5 text-center">Created by Charis Mul</p>
           <p className="text-muted-foreground text-center mb-6 mt-2">
            Find inspiration, connect with creators, or explore new creative avenues within the Charis Art Hub ecosystem.
          </p>
        </CardContent>
      </Card>
      
      <Alert variant="default" className="bg-primary/10 border-primary/30">
          <SearchIcon className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">Basic Search Implemented</AlertTitle>
          <AlertDescription>
            The current search performs a basic "starts-with" lookup for users and artworks.
            For more advanced features like full-text search, typo tolerance, and relevance ranking,
            integration with a dedicated search service (e.g., Algolia, Typesense) is recommended.
          </AlertDescription>
        </Alert>

      {isSearching && (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Searching...</p>
        </div>
      )}

      {!isSearching && (searchTerm && userResults.length === 0 && artworkResults.length === 0) && (
         <Card className="text-center py-10">
          <CardContent>
            <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No results found for "{searchTerm}". Try a different query.</p>
          </CardContent>
        </Card>
      )}

      {!isSearching && userResults.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center"><Users className="h-5 w-5 mr-2 text-primary"/> User Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userResults.map(user => (
              <Card key={user.uid} className="card-interactive-hover">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL || undefined} alt={user.fullName || user.username} data-ai-hint="user avatar"/>
                    <AvatarFallback>{(user.fullName || user.username || "U").substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link href={`/profile/${user.uid}`} className="hover:underline"><CardTitle className="text-lg">{user.fullName || user.username}</CardTitle></Link>
                    {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{user.bio || "An artist on Charis Art Hub."}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!isSearching && artworkResults.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center"><Palette className="h-5 w-5 mr-2 text-primary"/> Artwork Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artworkResults.map(artwork => (
              <Card key={artwork.id} className="card-interactive-hover group">
                <Link href={`/crystalline-blooms#${artwork.id}`}> {/* Placeholder link */}
                  <CardHeader className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <Image src={artwork.imageUrl || "https://placehold.co/300x300.png"} alt={artwork.title} layout="fill" objectFit="cover" data-ai-hint={artwork.dataAiHint || "artwork image"} className="transition-transform duration-300 group-hover:scale-105"/>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2">
                    <p className="text-sm font-medium truncate group-hover:text-primary">{artwork.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{artwork.type}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}


      {!searchTerm && !isSearching && (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center"><RotateCcw className="h-5 w-5 mr-2 text-primary"/> Recent Searches</h2>
            {recentSearches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                        <Button key={index} variant="outline" size="sm" className="transition-transform hover:scale-105 hover:border-primary" onClick={() => { setSearchTerm(term); handleSearch(); }}>
                            {term}
                        </Button>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No recent searches.</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-primary"/> Trending Now</h2>
            {trendingTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {trendingTopics.map((topic, index) => (
                        <Button key={index} variant="secondary" size="sm" className="transition-transform hover:scale-105 hover:shadow-md" onClick={() => { setSearchTerm(topic); handleSearch(); }}>
                            {topic}
                        </Button>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">Nothing trending at the moment.</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {searchCategories.map((category) => (
                <Card key={category.name} className="hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer aspect-square flex flex-col justify-between group overflow-hidden card-interactive-hover" onClick={() => { setSearchTerm(category.name); handleSearch(); }}>
                  <CardContent className="p-0 flex-1 flex items-center justify-center relative">
                    <Image
                      src={`https://placehold.co/200x200.png`}
                      alt={category.name}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint={category.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </CardContent>
                  <CardFooter className="p-3 border-t bg-card/80 backdrop-blur-sm">
                    <p className="text-sm font-medium text-center w-full truncate text-card-foreground group-hover:text-primary transition-colors">{category.name}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
