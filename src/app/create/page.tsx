
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusSquare, UploadCloud, Sparkles, PenTool, Music, Film, Gem, Mic2, Video } from "lucide-react"; // Added Mic2, Video
import Link from "next/link";

const creationOptions = [
  { title: "New Artwork", description: "Upload or create a new artwork, sketch, or multimedia piece.", icon: Gem, href: "/crystalline-blooms/new", dataAiHint: "gemstone sparkle" }, 
  { title: "Write a Post", description: "Share an update, thought, or announcement to your feed.", icon: PlusSquare, href: "/posts/new", dataAiHint: "text document" },
  { title: "Post a Reel", description: "Share a short video update or insight.", icon: Film, href: "/reels/new", dataAiHint: "video play button" },
  { title: "Upload Story", description: "Share an ephemeral image or video update.", icon: Video, href: "/stories/new", dataAiHint: "mobile phone story" },
  { title: "Upload Music Track", description: "Share your latest audio creation.", icon: Mic2, href: "/music/new", dataAiHint: "microphone audio" },
  { title: "Start Project Story", description: "Document the creation process of a new project.", icon: PenTool, href: "/genesis-trails/new", dataAiHint: "drawing hand" }, 
  { title: "Generate Creative Soundtrack", description: "Create ambient audio from your work session data.", icon: Music, href: "/process-symphony", dataAiHint: "sound wave abstract" }, 
  { title: "Start Live Stream", description: "Go live and interact with your audience.", icon: Clapperboard, href: "/livestream/new", dataAiHint: "live broadcast icon" },
];

export default function CreatePage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-lg card-interactive-hover">
        <CardHeader className="text-center">
          <PlusSquare className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Create New Content</CardTitle>
           <p className="text-xs text-muted-foreground mt-1">Created by Charisarthub</p>
          <CardDescription>What would you like to bring into existence on Charisarthub today?</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creationOptions.map((option) => (
          <Card key={option.title} className="card-interactive-hover hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <option.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{option.title}</CardTitle>
              </div>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="gradientPrimary" className="w-full transition-transform hover:scale-105">
                <Link href={option.href || "#"}>
                  {option.title.startsWith("Generate") || option.title.startsWith("Start Live") ? option.title.split(" ")[0] : "Start Creating"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="card-interactive-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UploadCloud className="h-6 w-6 text-accent"/> Quick Upload (Not Implemented)</CardTitle>
          <CardDescription>Drag and drop files here to quickly create new Artworks (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/30 hover:border-primary transition-colors cursor-pointer">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Drop files or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports images, videos, audio, and documents.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    
