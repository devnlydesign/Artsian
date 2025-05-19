
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Maximize2, Eye, Gem } from "lucide-react";
import Image from "next/image";
import { Badge } from '@/components/ui/badge'; // Ensure Badge is imported

interface Bloom {
  id: string;
  title: string;
  type: "Artwork" | "Process Chronicle" | "Sketch" | "Multimedia";
  thumbnailUrl: string;
  description: string;
  fullContentUrl?: string; // For high-fidelity view
  details?: string; // More detailed description or content
  dataAiHint: string;
}

const bloomsData: Bloom[] = [
  { id: "1", title: "Cosmic Dance", type: "Artwork", thumbnailUrl: "https://placehold.co/400x300.png", description: "An exploration of nebulae and stellar formations.", fullContentUrl: "https://placehold.co/1200x900.png", details: "Created using generative algorithms and digital painting techniques. This piece aims to capture the chaotic beauty of the universe.", dataAiHint: "galaxy space" },
  { id: "2", title: "The Making of Echoes", type: "Process Chronicle", thumbnailUrl: "https://placehold.co/400x300.png", description: "Behind the scenes of the 'Echoes' sound installation.", details: "This chronicle includes initial sketches, audio experiments, and reflections on the creative process. It documents the journey from concept to final installation.", dataAiHint: "studio desk" },
  { id: "3", title: "Cybernetic Flora", type: "Sketch", thumbnailUrl: "https://placehold.co/400x300.png", description: "Initial concepts for a series on futuristic botany.", details: "A collection of pencil and digital sketches exploring the fusion of organic and technological forms in plant life.", dataAiHint: "futuristic plant" },
  { id: "4", title: "Ephemeral Streams", type: "Multimedia", thumbnailUrl: "https://placehold.co/400x300.png", description: "An interactive audio-visual experience.", fullContentUrl: "https://placehold.co/800x450.png", details: "This piece combines ambient soundscapes with procedurally generated visuals that respond to user interaction (simulated here).", dataAiHint: "abstract video" },
];

export default function CrystallineBloomsPage() {
  const [selectedBloom, setSelectedBloom] = useState<Bloom | null>(null);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Gem className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">My Artworks</CardTitle>
          <CardDescription>Explore your collection of artworks, process videos, sketches, and multimedia creations.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bloomsData.map((bloom) => (
          <Dialog key={bloom.id} onOpenChange={(isOpen) => !isOpen && setSelectedBloom(null)}>
            <DialogTrigger asChild>
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-primary group"
                onClick={() => setSelectedBloom(bloom)}
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <Image src={bloom.thumbnailUrl} alt={bloom.title} layout="fill" objectFit="cover" data-ai-hint={bloom.dataAiHint} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <CardTitle className="text-xl text-white group-hover:text-primary-foreground transition-colors">{bloom.title}</CardTitle>
                      <Badge variant="secondary" className="w-fit mt-1 bg-opacity-80 backdrop-blur-sm">{bloom.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{bloom.description}</p>
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
                  <DialogDescription>Type: {selectedBloom.type}</DialogDescription>
                </DialogHeader>
                <div className="my-4 relative aspect-video rounded-md overflow-hidden">
                  <Image 
                    src={selectedBloom.fullContentUrl || selectedBloom.thumbnailUrl} 
                    alt={selectedBloom.title} 
                    layout="fill" 
                    objectFit="contain"
                    data-ai-hint={selectedBloom.dataAiHint} 
                  />
                </div>
                <p className="text-sm text-foreground">{selectedBloom.details || selectedBloom.description}</p>
                {selectedBloom.fullContentUrl && (
                  <Button asChild className="mt-4">
                    <a href={selectedBloom.fullContentUrl} target="_blank" rel="noopener noreferrer">
                      <Maximize2 className="mr-2 h-4 w-4" /> View Full Size
                    </a>
                  </Button>
                )}
              </DialogContent>
            )}
          </Dialog>
        ))}
      </div>
    </div>
  );
}

    