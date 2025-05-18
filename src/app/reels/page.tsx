
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clapperboard, PlayCircle } from "lucide-react";
import Image from "next/image";

export default function ReelsPage() {
  // Placeholder data for reels
  const reelsData = [
    { id: "r1", user: "CreativeProcess", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "video art", views: "1.2M" },
    { id: "r2", user: "ArtTimelapse", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "painting time lapse", views: "870K" },
    { id: "r3", user: "SoundDesignTips", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "music studio", views: "500K" },
    { id: "r4", user: "DigitalSketch", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "tablet drawing", views: "1.5M" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Clapperboard className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Reels</CardTitle>
          <CardDescription>Short-form video content. Process insights, quick tips, and artistic moments.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
        {reelsData.map((reel) => (
          <Card key={reel.id} className="relative group overflow-hidden aspect-[9/16] cursor-pointer hover:shadow-xl transition-shadow">
            <Image
              src={reel.videoThumb}
              alt={`Reel by ${reel.user}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={reel.dataAiHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              <div /> {/* Spacer */}
              <div className="text-white">
                <PlayCircle className="h-10 w-10 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold truncate">{reel.user}</p>
                <p className="text-xs">{reel.views} views</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>More Reels coming soon! This is a placeholder page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
