
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "system";
  user?: { name: string; avatarUrl: string; dataAiHint: string; };
  content: string;
  timestamp: string;
  isRead: boolean;
}

const notificationsData: NotificationItem[] = [
  { id: "n1", type: "like", user: { name: "Elena Vortex", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "artist portrait" }, content: "liked your Crystalline Bloom 'Cosmic Dance'.", timestamp: "2h ago", isRead: false },
  { id: "n2", type: "comment", user: { name: "Marcus Rune", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "designer face" }, content: "commented: \"Amazing textures!\"", timestamp: "5h ago", isRead: false },
  { id: "n3", type: "follow", user: { name: "Anya Spectra", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "musician profile" }, content: "started following you.", timestamp: "1d ago", isRead: true },
  { id: "n4", type: "system", content: "Your Flux Signature has evolved! Check out the changes.", timestamp: "2d ago", isRead: true },
  { id: "n5", type: "mention", user: { name: "Kai Glitch", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "tech enthusiast" }, content: "mentioned you in a post: \"Inspired by @YourUsername's latest work!\"", timestamp: "3d ago", isRead: true },
];

const getIconForType = (type: NotificationItem["type"]) => {
  switch (type) {
    case "like": return <Heart className="h-5 w-5 text-red-500" />;
    case "comment": return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case "follow": return <UserPlus className="h-5 w-5 text-green-500" />;
    default: return <Bell className="h-5 w-5 text-primary" />;
  }
};

export default function NotificationsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Bell className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Notifications</CardTitle>
          <CardDescription>Stay updated with the latest activity related to your ARTISAN presence.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {notificationsData.length > 0 ? (
            notificationsData.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${!notification.isRead ? 'bg-primary/5' : 'bg-card'}`}
              >
                {notification.user ? (
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={notification.user.avatarUrl} alt={notification.user.name} data-ai-hint={notification.user.dataAiHint}/>
                    <AvatarFallback>{notification.user.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center mt-1">
                     {getIconForType(notification.type)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">
                    {notification.user && <span className="font-semibold">{notification.user.name}</span>} {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                </div>
                 {!notification.isRead && <div className="h-2.5 w-2.5 bg-primary rounded-full self-center"></div>}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No new notifications right now.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
