
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart2, Palette, Sparkles, Smile } from "lucide-react";
import Image from "next/image";

export default function FluxSignaturePage() {
  // Placeholder data - in a real app, this would be dynamic and AI-generated/updated
  const fluxSignature = {
    style: "Abstract Expressionism, Digital Surrealism",
    activityLevel: "High",
    currentMood: "Inspired",
    evolutionPoints: [
      { date: "2024-07-01", change: "Shift towards warmer color palettes" },
      { date: "2024-06-15", change: "Increased focus on textural elements" },
      { date: "2024-05-20", change: "Exploration of generative art techniques" },
    ],
    visualRepresentation: "https://placehold.co/800x400.png",
    dominantColors: ["#9400D3", "#C71585", "#FF69B4", "#4B0082"], // Purple, Magenta, Pink, Indigo
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-8">
          <div className="flex items-center gap-4">
            <Sparkles className="h-12 w-12" />
            <div>
              <CardTitle className="text-4xl">Your Artistic Style</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">A dynamic look at your unique creative fingerprint.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Current Vibe</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-primary" />
                  <span className="font-medium">Main Styles:</span>
                  <span>{fluxSignature.style}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  <span className="font-medium">Activity Level:</span>
                  <Badge variant="secondary">{fluxSignature.activityLevel}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Smile className="h-6 w-6 text-primary" />
                  <span className="font-medium">Current Mood:</span>
                  <Badge variant="outline" className="border-accent text-accent">{fluxSignature.currentMood}</Badge>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Dominant Colors:</h4>
                <div className="flex gap-2">
                  {fluxSignature.dominantColors.map((color, index) => (
                    <div key={index} className="h-8 w-8 rounded-full shadow-md" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
               <Image 
                src={fluxSignature.visualRepresentation} 
                alt="Visual Representation of Artistic Style" 
                layout="fill"
                objectFit="cover"
                data-ai-hint="abstract generative art" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-4 left-4 text-white text-lg font-semibold">Visual Essence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Style Evolution
          </CardTitle>
          <CardDescription>Track how your artistic style has changed over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {fluxSignature.evolutionPoints.map((point, index) => (
              <li key={index} className="border-l-2 border-primary pl-4 py-2 relative">
                <div className="absolute -left-[0.30rem] top-3 h-2 w-2 rounded-full bg-primary" />
                <p className="font-semibold text-sm text-muted-foreground">{point.date}</p>
                <p>{point.change}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    