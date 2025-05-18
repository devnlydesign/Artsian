import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Lock, PlusCircle, Settings } from "lucide-react";
import Image from "next/image";

// Placeholder data for biomes
const biomesData = [
  { id: "1", name: "Inner Circle", description: "A private space for patrons and close collaborators.", members: 12, access: "Paid Tier", privacy: "Invite-Only", dataAiHint: "exclusive community" },
  { id: "2", name: "Sketchbook Collective", description: "A biome for sharing works-in-progress and getting feedback.", members: 45, access: "Free Tier", privacy: "Members-Only", dataAiHint: "collaborative art" },
  { id: "3", name: "Project Avalon HQ", description: "Dedicated biome for the 'Avalon' multimedia project.", members: 7, access: "Project Team", privacy: "Strictly Private", dataAiHint: "team workspace" },
];

export default function BiomesPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">My Private Biomes</CardTitle>
          <CardDescription>Manage your secure, self-contained ecosystems. Control access, share exclusive content, and foster your communities.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Biome
          </Button>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Biomes</h2>
        {biomesData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {biomesData.map((biome) => (
              <Card key={biome.id} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="relative aspect-[16/9] mb-4 rounded-md overflow-hidden">
                    <Image 
                        src={`https://placehold.co/400x225.png`} 
                        alt={biome.name} 
                        layout="fill" 
                        objectFit="cover"
                        data-ai-hint={biome.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <CardTitle className="text-xl text-white">{biome.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>{biome.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4 text-primary" /> {biome.members} Members
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Lock className="mr-2 h-4 w-4 text-primary" /> {biome.access} ({biome.privacy})
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Manage Biome
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>You haven't created any Biomes yet.</p>
              <Button variant="link" className="mt-2">Get started by creating one!</Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
