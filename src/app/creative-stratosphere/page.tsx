
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Search, TrendingUp } from "lucide-react";
import Image from "next/image";

export default function CreativeStratospherePage() {
  // Placeholder data for trending "Creative Storms"
  const creativeStorms = [
    { id: "1", name: "Neon Dreams Movement", description: "A surge in vibrant, cyberpunk-inspired digital art.", artistsInvolved: 250, trendiness: 95, dataAiHint: "cyberpunk city" },
    { id: "2", title: "Organic AI Collaborations", description: "Artists exploring co-creation with generative AI in natural forms.", artistsInvolved: 180, trendiness: 88, dataAiHint: "ai nature" },
    { id: "3", title: "Minimalist Soundscapes", description: "A rise in ambient music focusing on sparse, evolving textures.", artistsInvolved: 320, trendiness: 85, dataAiHint: "sound waves" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <Globe className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Discover the Network</CardTitle>
          <CardDescription>Explore active artists and creators. Discover trending styles, communities, and "Creative Hotspots" – areas of high creative energy.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
           <div className="w-full max-w-md mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Search artists, styles, or trends..." className="pl-10" />
            </div>
          </div>
          <p className="text-muted-foreground">A dynamic map of the creative network will be shown here.</p>
          <div className="my-8 p-6 border border-dashed border-border rounded-lg bg-muted/20 w-full max-w-3xl text-center">
            <Image src="https://placehold.co/800x400.png" alt="Creative Network Visualization Placeholder" width={800} height={400} className="rounded-md object-cover mx-auto" data-ai-hint="network abstract" />
            <p className="mt-2 text-sm text-muted-foreground">Imagine a dynamic, interactive constellation map here.</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-accent" />
          Trending Creative Hotspots
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creativeStorms.map((storm) => (
            <Card key={storm.id} className="card-interactive-hover">
              <CardHeader>
                <CardTitle className="text-xl">{storm.name || storm.title}</CardTitle>
                <div className="relative w-full h-2 bg-muted rounded-full mt-1">
                  <div className="absolute top-0 left-0 h-2 rounded-full bg-accent" style={{ width: `${storm.trendiness}%` }} />
                </div>
                <CardDescription className="text-xs pt-1">{storm.trendiness}% Trend Intensity</CardDescription>
              </CardHeader>
              <CardContent>
                 <Image src={`https://placehold.co/300x150.png`} alt={storm.name || storm.title || "Creative Hotspot"} width={300} height={150} className="rounded-md object-cover mb-3" data-ai-hint={storm.dataAiHint} />
                <p className="text-sm text-muted-foreground mb-1">{storm.description}</p>
                <p className="text-xs text-primary">{storm.artistsInvolved} artists involved</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">Explore Hotspot</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
