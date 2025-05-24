
'use server';

import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';

interface CreateCheckoutSessionInput {
  itemName: string;
  itemDescription?: string;
  itemImage?: string;
  itemPriceInCents: number; // Price in cents
  quantity: number;
  itemId: string; // Your internal item ID for metadata
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<{ sessionId: string } | { error: string }> {
  const {
    itemName,
    itemDescription,
    itemImage,
    itemPriceInCents,
    quantity,
    itemId,
  } = input;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return { error: 'Base URL is not configured.' };
  }

  const successUrl = `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/shop/cancel`;

  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd', // Or your desired currency
          product_data: {
            name: itemName,
            ...(itemDescription && { description: itemDescription }),
            ...(itemImage && { images: [itemImage] }),
          },
          unit_amount: itemPriceInCents, // Price in cents
        },
        quantity: quantity,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        // Add any metadata you need, e.g., itemId, userId
        itemId: itemId,
      },
    });

    if (!session.id) {
      return { error: 'Could not create Stripe Checkout session.' };
    }

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to create checkout session: ${errorMessage}` };
  }
}
