
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import Image from "next/image";

export default function SearchPage() {
  // Placeholder data for search results or trending topics
  const searchCategories = [
    { name: "Trending Artists", dataAiHint: "popular artist" },
    { name: "Digital Painting", dataAiHint: "digital art" },
    { name: "Generative Art", dataAiHint: "abstract algorithm" },
    { name: "Photography", dataAiHint: "camera lens" },
    { name: "Sculpture", dataAiHint: "stone sculpture" },
    { name: "Music Production", dataAiHint: "mixing console" },
  ];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="relative w-full max-w-xl mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for artists, artworks, keywords..."
              className="w-full pl-10 text-lg h-12 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl mb-4 text-center">Discover & Explore</CardTitle>
           <p className="text-muted-foreground text-center mb-6">
            Find inspiration, connect with creators, or explore new creative avenues.
          </p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {searchCategories.map((category) => (
            <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer aspect-square flex flex-col justify-between">
              <CardContent className="p-2 flex-1 flex items-center justify-center">
                <Image
                  src={`https://placehold.co/150x150.png`}
                  alt={category.name}
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                  data-ai-hint={category.dataAiHint}
                />
              </CardContent>
              <CardFooter className="p-2 border-t">
                <p className="text-sm font-medium text-center w-full truncate">{category.name}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
        <div className="text-center py-10 text-muted-foreground">
          <p>(Placeholder: Your recent searches will appear here)</p>
        </div>
      </section>

       <section>
        <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
        <div className="text-center py-10 text-muted-foreground">
          <p>(Placeholder: Trending artworks and artists will be shown here)</p>
        </div>
      </section>
    </div>
  );
}
