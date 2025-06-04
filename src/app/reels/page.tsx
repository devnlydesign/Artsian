
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clapperboard, PlayCircle, UploadCloud } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ReelsPage() {
  const reelsData = [
    { id: "r1", user: "CreativeProcess", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "art process video", views: "1.2M" },
    { id: "r2", user: "ArtTimelapse", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "painting time lapse video", views: "870K" },
    { id: "r3", user: "SoundDesignTips", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "music studio tutorial", views: "500K" },
    { id: "r4", user: "DigitalSketch", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "digital drawing tablet", views: "1.5M" },
    { id: "r5", user: "GenerativeArt", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "code animation art", views: "950K" },
    { id: "r6", user: "CraftCorner", videoThumb: "https://placehold.co/270x480.png", dataAiHint: "handmade craft video", views: "320K" },

  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transition-shadow hover:shadow-xl card-interactive-hover">
        <CardHeader className="text-center">
          <Clapperboard className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl text-gradient-primary-accent">Reels</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Created by Charis Mul</p>
          <CardDescription>Short-form video content. Process insights, quick tips, and artistic moments.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button asChild variant="gradientPrimary" className="transition-transform hover:scale-105">
                <Link href="/create"> 
                    <UploadCloud className="mr-2 h-5 w-5" /> Upload Reel
                </Link>
            </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
        {reelsData.map((reel) => (
          <Card key={reel.id} className="relative group overflow-hidden aspect-[9/16] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105">
            <Image
              src={reel.videoThumb}
              alt={`Reel by ${reel.user}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={reel.dataAiHint}
              className="group-hover:brightness-75 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              <div /> 
              <div className="text-white">
                <PlayCircle className="h-10 w-10 mx-auto mb-2 opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300" />
                <p className="text-sm font-semibold truncate">{reel.user}</p>
                <p className="text-xs">{reel.views} views</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {reelsData.length === 0 && (
         <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No Reels available yet. Be the first to create one!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
