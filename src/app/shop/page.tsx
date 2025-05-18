import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, DollarSign, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string; // e.g., "Prints", "Original Artwork", "Merchandise"
  bloomLink?: string; // Link to a Crystalline Bloom
  dataAiHint: string;
}

const shopItems: ShopItem[] = [
  { id: "s1", name: "Cosmic Dance - Limited Edition Print", description: "High-quality giclée print of the 'Cosmic Dance' artwork. Limited to 50 editions.", price: 150, imageUrl: "https://placehold.co/300x300.png", category: "Prints", bloomLink: "/crystalline-blooms/1", dataAiHint: "art print galaxy" },
  { id: "s2", name: "ARTISAN Signature Tee", description: "Comfortable cotton t-shirt with an abstract Flux Signature design.", price: 35, imageUrl: "https://placehold.co/300x300.png", category: "Merchandise", dataAiHint: "tshirt design" },
  { id: "s3", name: "Ephemeral Streams - Interactive License", description: "License to use the 'Ephemeral Streams' multimedia piece for personal projects.", price: 75, imageUrl: "https://placehold.co/300x300.png", category: "Digital Goods", bloomLink: "/crystalline-blooms/4", dataAiHint: "software license" },
  { id: "s4", name: "Original Sketch: Cyber Flora Study", description: "One-of-a-kind original pencil sketch from the 'Cybernetic Flora' series.", price: 450, imageUrl: "https://placehold.co/300x300.png", category: "Original Artwork", bloomLink: "/crystalline-blooms/3", dataAiHint: "sketch drawing" },
];

export default function ShopPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl">Artist Shop</CardTitle>
          <CardDescription>Acquire prints, original works, merchandise, and digital goods directly from the artist. Look for the 'Material Origin Link' on Crystalline Blooms.</CardDescription>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopItems.map((item) => (
            <Card key={item.id} className="hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                   <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint} />
                   <Badge variant="secondary" className="absolute top-2 right-2 bg-opacity-80 backdrop-blur-sm">{item.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{item.description}</p>
                 <div className="flex items-center text-primary font-semibold">
                    <DollarSign className="h-5 w-5 mr-1" /> {item.price.toFixed(2)}
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <Button className="w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
              </CardFooter>
                {item.bloomLink && (
                    <div className="px-4 pb-2 text-xs text-center">
                        <a href={item.bloomLink} className="text-accent hover:underline">
                            View related Crystalline Bloom <ArrowRight className="inline h-3 w-3"/>
                        </a>
                    </div>
                )}
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
            <CardTitle>Secure Checkout Process</CardTitle>
            <CardDescription>All transactions are processed securely. This is a placeholder for the e-commerce integration.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">A secure payment gateway interface would be embedded here.</p>
            <Button variant="outline" className="mt-4">Proceed to Checkout (Mock)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
