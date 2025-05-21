
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart2, Palette, Smile } from "lucide-react"; // Removed Sparkles as Palette is more direct
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
    dominantColors: ["#23D2FF", "#8A2BE2", "#C71585", "#4A00E0"], // Example: Cyan, BlueViolet, MediumVioletRed, ElectricPurple
    dataAiHintVisual: "abstract generative art",
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden card-interactive-hover">
        <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 md:p-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Palette className="h-10 w-10 md:h-12 md:w-12" />
            <div>
              <CardTitle className="text-3xl md:text-4xl">My Artistic Style</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-md md:text-lg">A dynamic look at your unique creative fingerprint.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Your Current Style</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <span className="font-medium">Main Styles:</span>
                  <span>{fluxSignature.style}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="font-medium">Activity Level:</span>
                  <Badge variant="secondary" className="text-sm">{fluxSignature.activityLevel}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Smile className="h-5 w-5 text-primary" />
                  <span className="font-medium">Current Mood:</span>
                  <Badge variant="outline" className="border-accent text-accent text-sm">{fluxSignature.currentMood}</Badge>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-md md:text-lg font-semibold mb-2">Dominant Colors:</h4>
                <div className="flex gap-2 flex-wrap">
                  {fluxSignature.dominantColors.map((color, index) => (
                    <div key={index} className="h-8 w-8 rounded-full shadow-md border border-border" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
               <Image 
                src={fluxSignature.visualRepresentation} 
                alt="Visual Representation of Artistic Style" 
                layout="fill"
                objectFit="cover"
                data-ai-hint={fluxSignature.dataAiHintVisual} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-3 left-3 md:bottom-4 md:left-4 text-white text-md md:text-lg font-semibold">Style Snapshot</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <BarChart2 className="h-6 w-6 text-primary" />
            Your Style Journey
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Track how your artistic style has changed over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {fluxSignature.evolutionPoints.length > 0 ? (
            <ul className="space-y-4">
              {fluxSignature.evolutionPoints.map((point, index) => (
                <li key={index} className="border-l-2 border-primary pl-4 py-2 relative hover:bg-muted/30 rounded-r-md transition-colors">
                  <div className="absolute -left-[0.30rem] top-3.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-semibold text-xs text-muted-foreground">{point.date}</p>
                  <p className="text-sm">{point.change}</p>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-muted-foreground text-center py-4">No style evolution points recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
