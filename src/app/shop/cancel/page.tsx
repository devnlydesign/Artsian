
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ShoppingCart } from 'lucide-react';

export default function ShopCancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-muted/10 p-4">
      <Card className="w-full max-w-md shadow-2xl text-center">
        <CardHeader>
          <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-3xl font-bold">Payment Cancelled</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            Your payment process was cancelled or was not completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You have not been charged. If you wish to try again, you can return to the shop.
          </p>
          <Button asChild variant="outline" className="w-full text-lg py-3 transition-transform hover:scale-105 hover:border-primary">
            <Link href="/shop">
              <ShoppingCart className="mr-2 h-5 w-5" /> Return to Shop
            </Link>
          </Button>
           <Button asChild variant="link" className="w-full transition-transform hover:scale-105">
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
