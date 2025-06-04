
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
  crystallineBloomId?: string | null; // Optional metadata for art-linked items
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
    crystallineBloomId,
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
            // You can add more metadata to product_data if needed by Stripe
          },
          unit_amount: itemPriceInCents, 
        },
        quantity: quantity,
      },
    ];
    
    const metadata: Stripe.MetadataParam = { 
        itemId,
        itemType: 'shop_item', // To distinguish from other types of checkouts
    };
    if (userId) {
        metadata.userId = userId;
    }
    if (crystallineBloomId) {
        metadata.crystallineBloomId = crystallineBloomId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment', // For one-time purchases
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
    };
    
    if (userId) {
        const userProfile = await getUserProfile(userId);
        if (userProfile?.stripeCustomerId) {
            sessionParams.customer = userProfile.stripeCustomerId;
        } else if (userProfile?.email) {
            // Prefer creating a customer if user is logged in for better tracking in Stripe
             const customerId = await getOrCreateStripeCustomerId(userId, userProfile.email, userProfile.fullName || userProfile.username);
             sessionParams.customer = customerId;
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
        const customer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
        if (customer && !customer.deleted) {
            return userProfile.stripeCustomerId;
        }
        console.warn(`Stripe customer ${userProfile.stripeCustomerId} for user ${userId} was deleted. Creating a new one.`);
    } catch (error) {
        console.warn(`Failed to retrieve Stripe customer ${userProfile.stripeCustomerId} for user ${userId}. Error: ${error}. Creating a new one.`);
    }
  }

  const customerParams: Stripe.CustomerCreateParams = {
    email: userEmail || userProfile?.email || undefined, 
    name: userName || userProfile?.fullName || userProfile?.username || undefined,
    metadata: {
      firebaseUID: userId,
    },
  };

  const customer = await stripe.customers.create(customerParams);
  
  // Save only if userProfile exists, otherwise this function might be called for guest checkouts
  if (userProfile) {
    await saveUserProfile(userId, { stripeCustomerId: customer.id });
  } else {
    // If userProfile doesn't exist, it implies it's a new user or guest.
    // We can create a placeholder profile or handle this based on app logic.
    // For now, we'll assume userProfile must exist if userId is provided.
    // If it's truly a guest checkout (no userId), then Stripe handles email input.
    // This function, as is, assumes a userId means an existing/creatable user profile.
    // For true guest checkout, the checkout session would collect email directly.
    await saveUserProfile(userId, { stripeCustomerId: customer.id, email: userEmail, fullName: userName });
  }


  return customer.id;
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null,
  priceId: string, 
  biomeId: string 
): Promise<{ sessionId: string } | { error: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return { error: 'Base URL is not configured.' };
  }

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
        priceId: priceId,
        subscriptionType: 'biome_subscription' 
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

export async function createPremiumAppSubscriptionCheckoutSession(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null
): Promise<{ sessionId: string } | { error: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return { error: 'Base URL is not configured.' };
  }
  const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!premiumPriceId) {
    return { error: 'Stripe Premium Price ID is not configured in environment variables.' };
  }

  const successUrl = `${baseUrl}/premium?premium_status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/premium?premium_status=cancel`;

  try {
    const stripeCustomerId = await getOrCreateStripeCustomerId(userId, userEmail, userName);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: premiumPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: userId,
        priceId: premiumPriceId,
        subscriptionType: 'app_premium', 
      },
    });

    if (!session.id) {
      return { error: 'Could not create Stripe premium app subscription session.' };
    }

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating Stripe premium app subscription session:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: `Failed to create premium app subscription session: ${errorMessage}` };
  }
}

/**
 * CRITICAL: STRIPE WEBHOOK IMPLEMENTATION (Firebase Cloud Function)
 *
 * You MUST implement a Firebase Cloud Function to act as a Stripe Webhook endpoint.
 * This function will listen for events from Stripe and update your Firestore database accordingly.
 *
 * Key Events to Handle:
 *
 * 1. `checkout.session.completed`:
 *    - WHEN: A user successfully completes the Stripe Checkout process.
 *    - METADATA: The session object will contain metadata you passed (e.g., `firebaseUID`, `priceId`, `subscriptionType`, `biomeId`, `itemId`, `itemType`).
 *    - ACTION:
 *      - **If `session.mode` is 'payment' (for one-time shop item purchases):**
 *        - Retrieve `itemId`, `firebaseUID` (if user was logged in) from `session.metadata`.
 *        - Retrieve `customer_details.email` (if available, for guest checkouts or logged-in users).
 *        - Fetch the `ShopItemData` from Firestore using `itemId` to get current price, name, etc. (verify price if needed).
 *        - Create an `OrderData` document in your `orders` collection in Firestore. Include:
 *          - `userId` (if `firebaseUID` is present),
 *          - `userEmail` (from `customer_details` or user profile),
 *          - `items`: [{ `itemId`, `name`, `priceInCents`, `quantity`: (usually 1 for this setup) }],
 *          - `totalAmountInCents`: `session.amount_total`,
 *          - `status`: 'paid',
 *          - `stripeCheckoutSessionId`: `session.id`,
 *          - `createdAt`, `updatedAt`.
 *        - If the item is physical and has `stock` tracking: Decrement the `stock` count on the `ShopItemData` document (atomically).
 *        - If the item is digital: Trigger your digital goods delivery mechanism (e.g., grant access, send email with link - complex, requires separate setup).
 *        - Send notifications to buyer (receipt) and artist (new order).
 *
 *      - **If `session.mode` is 'subscription' (for app premium or biome subscriptions):**
 *        - If `subscriptionType` is 'app_premium':
 *          - Retrieve the `subscription` ID from the session.
 *          - Fetch the full subscription object from Stripe to get `current_period_end`.
 *          - Update the user's profile in Firestore (`users/{firebaseUID}`):
 *            - `isPremium = true`
 *            - `stripeCustomerId = session.customer` (if not already set)
 *            - `premiumSubscriptionId = session.subscription`
 *            - `premiumSubscriptionEndsAt = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *        - If `subscriptionType` is 'biome_subscription':
 *          - Retrieve `biomeId` and `subscription` ID.
 *          - Fetch the full subscription object to get `current_period_end`.
 *          - Create/update a document in `biomeMemberships/{firebaseUID}_{biomeId}`:
 *            - `userId = firebaseUID`, `biomeId = biomeId`, `role = "member"`, `status = "active"`
 *            - `stripeSubscriptionId = session.subscription`, `stripeCustomerId = session.customer`
 *            - `stripePriceId = session.metadata.priceId`
 *            - `stripeCurrentPeriodEnd = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *            - `joinedAt = serverTimestamp()`
 *          - Increment `memberCount` on the `biomes/{biomeId}` document.
 *
 * 2. `customer.subscription.updated`:
 *    - WHEN: A subscription changes (e.g., payment success for renewal, payment failure, cancellation scheduled).
 *    - METADATA: The subscription object should have metadata.
 *    - ACTION:
 *      - If for 'app_premium': Update `isPremium` and `premiumSubscriptionEndsAt` on the user's profile.
 *      - If for 'biome_subscription': Update `status` and `stripeCurrentPeriodEnd` in `biomeMemberships`.
 *
 * 3. `customer.subscription.deleted`:
 *    - WHEN: A subscription is definitively canceled.
 *    - ACTION:
 *      - If for 'app_premium': Set `isPremium = false` on user profile.
 *      - If for 'biome_subscription': Set `status = "cancelled"` in `biomeMemberships`, decrement `memberCount`.
 *
 * Implementation Steps for Webhook (Firebase Cloud Function):
 * 1. `firebase init functions` (if not done), choose TypeScript.
 * 2. `npm install stripe firebase-admin firebase-functions` in your functions directory.
 * 3. Initialize Firebase Admin SDK in your function (e.g., `admin.initializeApp()`).
 * 4. Use `stripe.webhooks.constructEvent()` to verify signature with `STRIPE_WEBHOOK_SECRET`.
 * 5. Implement logic for event types.
 * 6. Deploy: `firebase deploy --only functions`.
 * 7. Stripe Dashboard: Developers > Webhooks > Add endpoint (URL of deployed function). Select events. Get signing secret.
 * 8. Set environment variables for the function: `stripe.secret_key`, `stripe.webhook_secret`.
 *    `firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY" stripe.webhook_secret="whsec_YOUR_SECRET"`
 *
 * SECURITY: Protect your webhook. Verify Stripe's signature.
 * IDEMPOTENCY: Design handlers to be idempotent.
 * LOGGING: Add robust logging for debugging.
 */
