
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, TrendingUp, RotateCcw } from "lucide-react";
import Image from "next/image";

export default function SearchPage() {
  // Placeholder data for search results or trending topics
  const searchCategories = [
    { name: "Trending Artists", dataAiHint: "popular artist spotlight" },
    { name: "Digital Painting", dataAiHint: "digital art tools" },
    { name: "Generative Art", dataAiHint: "algorithmic abstract art" },
    { name: "Photography", dataAiHint: "vintage camera lens" },
    { name: "Sculpture", dataAiHint: "modern stone sculpture" },
    { name: "Music Production", dataAiHint: "audio mixing console" },
    { name: "AI Art", dataAiHint: "ai robot painting" },
    { name: "Illustration", dataAiHint: "fantasy character illustration" },
  ];

  const recentSearches = ["abstract art", "surrealism", "violet color palette"];
  const trendingTopics = ["#NeoSurrealism", "#AICollaborations", "FluxSignatures2024"];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg transition-shadow hover:shadow-xl">
        <CardHeader>
          <div className="relative w-full max-w-xl mx-auto">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search artists, artworks, genres, keywords..."
              className="w-full pl-12 text-lg h-14 rounded-lg shadow-inner"
            />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl mb-4 text-center text-gradient-primary-accent">Discover & Explore</CardTitle>
           <p className="text-muted-foreground text-center mb-6">
            Find inspiration, connect with creators, or explore new creative avenues within the ARTISAN ecosystem.
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><RotateCcw className="h-5 w-5 mr-2 text-primary"/> Recent Searches</h2>
        {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {recentSearches.map((searchTerm, index) => (
                    <Button key={index} variant="outline" size="sm" className="transition-transform hover:scale-105 hover:border-primary">
                        {searchTerm}
                    </Button>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground">No recent searches.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-primary"/> Trending Now</h2>
         {trendingTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic, index) => (
                    <Button key={index} variant="secondary" size="sm" className="transition-transform hover:scale-105 hover:shadow-md">
                        {topic}
                    </Button>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground">Nothing trending at the moment.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {searchCategories.map((category) => (
            <Card key={category.name} className="hover:shadow-xl transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer aspect-square flex flex-col justify-between group overflow-hidden">
              <CardContent className="p-0 flex-1 flex items-center justify-center relative">
                <Image
                  src={`https://placehold.co/200x200.png`}
                  alt={category.name}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                  data-ai-hint={category.dataAiHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </CardContent>
              <CardFooter className="p-3 border-t bg-card/80 backdrop-blur-sm">
                <p className="text-sm font-medium text-center w-full truncate text-card-foreground group-hover:text-primary transition-colors">{category.name}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
