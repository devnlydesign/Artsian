
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Maximize2, Eye, Gem, Loader2, PlusCircle, FileText } from "lucide-react"; // Added FileText
import Image from "next/image";
import { Badge } from '@/components/ui/badge'; 
import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import { getArtworksByUserId, type ArtworkData, type LayerData } from '@/actions/artworkActions'; // Added LayerData
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function CrystallineBloomsPage() {
  const { currentUser, isAuthenticated, isLoadingAuth } = useAppState();
  const [userArtworks, setUserArtworks] = useState<ArtworkData[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(true);
  const [selectedBloom, setSelectedBloom] = useState<ArtworkData | null>(null);

  useEffect(() => {
    async function fetchArtworks() {
      if (isAuthenticated && currentUser?.uid) {
        setIsLoadingArtworks(true);
        const artworks = await getArtworksByUserId(currentUser.uid);
        setUserArtworks(artworks);
        setIsLoadingArtworks(false);
      } else if (!isLoadingAuth && !isAuthenticated) {
        setUserArtworks([]); 
        setIsLoadingArtworks(false);
      }
    }
    
    if (!isLoadingAuth) { 
        fetchArtworks();
    }
  }, [currentUser, isAuthenticated, isLoadingAuth]);

  if (isLoadingAuth || isLoadingArtworks) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl">My Artworks</CardTitle>
            <CardDescription>Explore your collection of artworks, process videos, sketches, and multimedia creations.</CardDescription>
          </CardHeader>
        </Card>
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Loading your artworks...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="space-y-8 text-center py-10">
         <Card className="shadow-lg max-w-md mx-auto">
          <CardHeader className="text-center">
            <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl">My Artworks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please log in to view and manage your artworks.</p>
            <Button asChild variant="gradientPrimary">
              <Link href="/auth/login?redirect=/crystalline-blooms">Log In to View Artworks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">My Artworks</CardTitle>
          <CardDescription>Explore your collection of artworks, process videos, sketches, and multimedia creations.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
             <Button asChild variant="gradientPrimary" className="transition-transform hover:scale-105">
                <Link href="/crystalline-blooms/new">
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Artwork
                </Link>
            </Button>
        </CardContent>
      </Card>

      {userArtworks.length === 0 && !isLoadingArtworks && (
        <Card className="card-interactive-hover">
            <CardContent className="pt-6 text-center">
                <Gem className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Gallery Awaits</h3>
                <p className="text-muted-foreground mb-4">You haven't added any artworks yet. Start by creating your first piece!</p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userArtworks.map((bloom) => (
          <Dialog key={bloom.id} onOpenChange={(isOpen) => !isOpen && setSelectedBloom(null)}>
            <DialogTrigger asChild>
              <Card 
                className="cursor-pointer card-interactive-hover group flex flex-col"
                onClick={() => setSelectedBloom(bloom)}
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <Image 
                        src={bloom.imageUrl || "https://placehold.co/400x225.png"} 
                        alt={bloom.title} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint={bloom.dataAiHint || "artwork image"}
                        className="transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <CardTitle className="text-xl text-white group-hover:text-primary-foreground transition-colors">{bloom.title}</CardTitle>
                      <Badge variant="secondary" className="w-fit mt-1 bg-opacity-80 backdrop-blur-sm">{bloom.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 h-16">{bloom.description}</p>
                  {bloom.createdAt && (
                     <p className="text-xs text-muted-foreground mt-2">
                        Created {formatDistanceToNow(bloom.createdAt.toDate(), { addSuffix: true })}
                     </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                   <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </CardFooter>
              </Card>
            </DialogTrigger>
            {selectedBloom && selectedBloom.id === bloom.id && (
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedBloom.title}</DialogTitle>
                  <DialogDescription>Type: {selectedBloom.type} {selectedBloom.createdAt && `| Created: ${formatDistanceToNow(selectedBloom.createdAt.toDate(), { addSuffix: true })}`}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="pr-6"> {/* Padding for scrollbar */}
                    <div className="my-4 relative aspect-video rounded-md overflow-hidden bg-muted">
                      <Image 
                        src={selectedBloom.imageUrl || "https://placehold.co/800x450.png"} 
                        alt={selectedBloom.title} 
                        layout="fill" 
                        objectFit="contain"
                        data-ai-hint={selectedBloom.dataAiHint || "artwork image"} 
                      />
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{selectedBloom.description}</p>
                    
                    {selectedBloom.layers && selectedBloom.layers.length > 0 && (
                      <div className="space-y-4 mt-4 border-t pt-4">
                        <h4 className="text-lg font-semibold text-primary flex items-center gap-2">
                          <FileText className="h-5 w-5" /> Content Layers
                        </h4>
                        {selectedBloom.layers.map((layer) => (
                          <div key={layer.id} className="p-3 bg-muted/50 rounded-md">
                            {layer.title && <h5 className="font-semibold text-md mb-1">{layer.title}</h5>}
                            {layer.type === 'text' && layer.content && (
                              <p className="text-sm text-foreground whitespace-pre-wrap">{layer.content}</p>
                            )}
                            {/* Placeholder for other layer types like image, video, audio */}
                            {(layer.type === 'image' || layer.type === 'video' || layer.type === 'audio') && layer.url && (
                               <a href={layer.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                 View {layer.type} layer content
                               </a>
                            )}
                            {layer.description && <p className="text-xs text-muted-foreground mt-1">{layer.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Example of how fullContentUrl was handled previously, can be removed or adapted for specific layer types if needed */}
                    {/* {selectedBloom.fullContentUrl && ( 
                      <Button asChild className="mt-4">
                        <a href={selectedBloom.fullContentUrl} target="_blank" rel="noopener noreferrer">
                          <Maximize2 className="mr-2 h-4 w-4" /> View Full Size
                        </a>
                      </Button>
                    )} */}
                  </div>
                </ScrollArea>
              </DialogContent>
            )}
          </Dialog>
        ))}
      </div>
    </div>
  );
}
