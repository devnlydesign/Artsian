
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, UserPlus, Mail, MapPin, Link as LinkIcon, Grid3x3, Clapperboard, Bookmark, Tag } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Placeholder data for user profile
const userProfile = {
  name: "Artist Name",
  username: "artistusername",
  avatarUrl: "https://placehold.co/150x150.png",
  dataAiHintAvatar: "artist self portrait",
  bannerUrl: "https://placehold.co/1000x250.png",
  dataAiHintBanner: "abstract studio",
  bio: "Exploring the intersections of art, technology, and consciousness. Creator of Crystalline Blooms and Flux Signatures on ARTISAN.",
  location: "Digital Realm",
  website: "artistwebsite.com",
  followers: 12345,
  following: 567,
  postsCount: 88,
};

// Placeholder for user's blooms/posts
const userBlooms = [
  { id: "b1", type: "image", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "artwork abstract" },
  { id: "b2", type: "image", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "digital painting" },
  { id: "b3", type: "video", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "short video" },
  { id: "b4", type: "image", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "sculpture photo" },
  { id: "b5", type: "image", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "generative design" },
  { id: "b6", type: "image", thumbnailUrl: "https://placehold.co/300x300.png", dataAiHint: "concept sketch" },
];


export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-lg">
        <div className="relative h-40 md:h-64 bg-muted">
          <Image src={userProfile.bannerUrl} alt="Profile banner" layout="fill" objectFit="cover" data-ai-hint={userProfile.dataAiHintBanner} />
        </div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 space-y-4 md:space-y-0 md:space-x-6 px-6 pb-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-lg">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint={userProfile.dataAiHintAvatar} />
              <AvatarFallback>{userProfile.name.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left pt-4">
              <CardTitle className="text-3xl">{userProfile.name}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">@{userProfile.username}</CardDescription>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm">
                <span><span className="font-semibold">{userProfile.postsCount}</span> posts</span>
                <span><span className="font-semibold">{userProfile.followers.toLocaleString()}</span> followers</span>
                <span><span className="font-semibold">{userProfile.following.toLocaleString()}</span> following</span>
              </div>
            </div>
            <div className="flex gap-2 pt-4 md:pt-0">
              <Button variant="default">Follow</Button> {/* Or "Edit Profile" if it's own profile */}
              <Button variant="outline">Message</Button>
              <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-2">
            <p className="text-sm">{userProfile.bio}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {userProfile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{userProfile.location}</span>}
              {userProfile.website && <a href={`https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary"><LinkIcon className="h-3 w-3"/>{userProfile.website}</a>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="blooms" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:max-w-md mx-auto">
          <TabsTrigger value="blooms"><Grid3x3 className="h-5 w-5 mr-0 md:mr-2" /><span className="hidden md:inline">Blooms</span></TabsTrigger>
          <TabsTrigger value="reels"><Clapperboard className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Reels</span></TabsTrigger>
          <TabsTrigger value="saved"><Bookmark className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Saved</span></TabsTrigger>
          <TabsTrigger value="tagged"><Tag className="h-5 w-5 mr-0 md:mr-2"/><span className="hidden md:inline">Tagged</span></TabsTrigger>
        </TabsList>
        <TabsContent value="blooms">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 mt-4">
            {userBlooms.map(bloom => (
              <div key={bloom.id} className="relative aspect-square bg-muted hover:opacity-80 transition-opacity cursor-pointer">
                <Image src={bloom.thumbnailUrl} alt="User bloom" layout="fill" objectFit="cover" data-ai-hint={bloom.dataAiHint}/>
              </div>
            ))}
             {userBlooms.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">No blooms yet.</p>}
          </div>
        </TabsContent>
        <TabsContent value="reels">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Clapperboard className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>User's Reels will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="saved">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>Saved content will appear here. Only visible to you.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tagged">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-3"/>
              <p>Content where this user is tagged will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
