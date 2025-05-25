
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, PlusCircle, MessageSquareHeart, Palette } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const communitiesData = [
  { id: "c1", name: "Digital Artists United", description: "A hub for digital painters, illustrators, and 3D artists.", members: "12.5K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "digital art group" },
  { id: "c2", name: "Painters' Hub", description: "Sharing traditional painting techniques, tips, and critiques.", members: "8.2K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "oil painting canvas" },
  { id: "c3", name: "AI Art Explorers", description: "For artists using AI tools in their creative process.", members: "20.1K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "ai generated abstract" },
  { id: "c4", name: "Sculpture Network", description: "Connect with sculptors working in various mediums.", members: "5.8K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "clay sculpture tools" },
  { id: "c5", name: "Photography Collective", description: "A space for photographers of all levels and genres.", members: "15K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "vintage camera lens" },
  { id: "c6", name: "Creative Coders Corner", description: "Discussing generative art, creative coding, and interactive installations.", members: "7.5K", imageUrl: "https://placehold.co/400x200.png", dataAiHint: "code on screen abstract" },
];

export default function CommunitiesPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Flux Constellations (Communities)</CardTitle>
          <CardDescription>Discover and join communities of artists. Share your passion, collaborate, and grow together.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-lg relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search for communities..." className="pl-10 h-11" />
            </div>
            <Button variant="gradientPrimary" className="transition-transform hover:scale-105">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Community
            </Button>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="text-accent h-6 w-6"/> Featured Communities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communitiesData.map((community) => (
            <Card key={community.id} className="card-interactive-hover group flex flex-col">
              <CardHeader className="p-0">
                 <div className="relative aspect-[16/9] rounded-t-lg overflow-hidden">
                    <Image 
                        src={community.imageUrl} 
                        alt={community.name} 
                        layout="fill" 
                        objectFit="cover"
                        data-ai-hint={community.dataAiHint}
                        className="transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                 </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{community.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-3 h-16">{community.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t flex justify-between items-center">
                 <div className="text-sm text-muted-foreground flex items-center">
                    <Users className="mr-1.5 h-4 w-4 text-primary" /> {community.members} members
                </div>
                <Button variant="outline" size="sm" className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  Join Community
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
      {communitiesData.length === 0 && (
         <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <MessageSquareHeart className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
                <p>No communities found. Why not start your own?</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
