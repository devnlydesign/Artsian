'use server';

import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';
import { getUserProfile, saveUserProfile } from './userProfile';
import { db } from '@/lib/firebase';
import { doc } from 'firebase/firestore';


interface CreateCheckoutSessionInput {
  itemName: string;
  itemDescription?: string;
  itemImage?: string;
  itemPriceInCents: number; // Price in cents
  quantity: number;
  itemId: string; // Your internal item ID for metadata
  userId?: string; // Optional: if you want to link one-time payments to a user
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
    userId,
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
          currency: 'usd', 
          product_data: {
            name: itemName,
            ...(itemDescription && { description: itemDescription }),
            ...(itemImage && { images: [itemImage] }),
          },
          unit_amount: itemPriceInCents, 
        },
        quantity: quantity,
      },
    ];
    
    const metadata: Stripe.MetadataParam = { itemId };
    if (userId) {
        metadata.userId = userId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
    };
    
    // If userId is provided, try to link to Stripe customer for one-time payments
    if (userId) {
        const userProfile = await getUserProfile(userId);
        if (userProfile?.stripeCustomerId) {
            sessionParams.customer = userProfile.stripeCustomerId;
        } else if (userProfile?.email) {
            // This allows Stripe to potentially match or create a customer, useful for guest checkouts that might later sign up
            sessionParams.customer_email = userProfile.email;
        }
    }


    const session = await stripe.checkout.sessions.create(sessionParams);

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


export async function getOrCreateStripeCustomerId(
  userId: string,
  userEmail?: string | null,
  userName?: string | null
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to get or create Stripe customer ID.");
  }

  const userProfile = await getUserProfile(userId);

  if (userProfile?.stripeCustomerId) {
    try {
        // Verify customer exists in Stripe
        const customer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
        if (customer && !customer.deleted) {
            return userProfile.stripeCustomerId;
        }
        // If customer is deleted in Stripe, proceed to create a new one
        console.warn(`Stripe customer ${userProfile.stripeCustomerId} for user ${userId} was deleted. Creating a new one.`);
    } catch (error) {
        console.warn(`Failed to retrieve Stripe customer ${userProfile.stripeCustomerId} for user ${userId}. Error: ${error}. Creating a new one.`);
    }
  }

  // Create a new Stripe customer
  const customerParams: Stripe.CustomerCreateParams = {
    email: userEmail || undefined, // Stripe expects undefined, not null
    name: userName || undefined,
    metadata: {
      firebaseUID: userId,
    },
  };

  const customer = await stripe.customers.create(customerParams);
  
  // Save the new Stripe Customer ID to the user's profile in Firestore
  await saveUserProfile(userId, { stripeCustomerId: customer.id });

  return customer.id;
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null,
  priceId: string, // This is the Stripe Price ID for the subscription
  biomeId: string // To pass to webhook for identifying the biome
): Promise<{ sessionId: string } | { error: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return { error: 'Base URL is not configured.' };
  }

  // For subscriptions, success and cancel URLs might be different, e.g., redirect to the biome page
  const successUrl = `${baseUrl}/biomes?biome_join_success=${biomeId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/biomes?biome_join_cancel=${biomeId}`;

  try {
    const stripeCustomerId = await getOrCreateStripeCustomerId(userId, userEmail, userName);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: userId,
        biomeId: biomeId,
        priceId: priceId
      },
    });

    if (!session.id) {
      return { error: 'Could not create Stripe subscription session.' };
    }

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating Stripe subscription session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to create subscription session: ${errorMessage}` };
  }
}