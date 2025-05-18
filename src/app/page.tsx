import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Gem, GitFork, Lightbulb, Music, Sparkles, Zap } from "lucide-react";
import Image from "next/image";

const quickAccessItems = [
  { title: "My Flux Signature", description: "View and manage your unique artistic identity.", href: "/flux-signature", icon: Sparkles },
  { title: "Crystalline Blooms", description: "Explore your artworks and creative projects.", href: "/crystalline-blooms", icon: Gem },
  { title: "Algorithmic Muse", description: "Get AI-powered creative prompts.", href: "/algorithmic-muse", icon: Lightbulb },
  { title: "Amplify Flux", description: "Boost your visibility.", href: "/amplify-flux", icon: Zap },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to ARTISAN</CardTitle>
          <CardDescription>Your dynamic platform for creative expression and connection. Let's create something amazing today.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Navigate through your creative space using the sidebar, or use the quick links below to jump right into action.</p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickAccessItems.map((item) => (
            <Card key={item.href} className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                <item.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>
                    Go to {item.title.split(" ")[0]} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl">Featured Crystalline Bloom</CardTitle>
            <CardDescription>Highlighting an exceptional piece of art or project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-md overflow-hidden">
              <Image 
                src="https://placehold.co/600x338.png" 
                alt="Featured Artwork" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="abstract art" 
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Ephemeral Dreams</h3>
            <p className="text-sm text-muted-foreground">A journey through surreal landscapes and fleeting moments.</p>
            <Button asChild variant="link" className="px-0 mt-2">
              <Link href="/crystalline-blooms/featured-id">Explore Bloom <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: GitFork, text: "New Genesis Trail created for 'Project Nebula'." },
              { icon: Music, text: "Process Symphony generated for your last session." },
              { icon: Gem, text: "Sketch 'Urban Flow' added to Crystalline Blooms." },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <activity.icon className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{activity.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
