
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
    
    if (userId) {
        const userProfile = await getUserProfile(userId);
        if (userProfile?.stripeCustomerId) {
            sessionParams.customer = userProfile.stripeCustomerId;
        } else if (userProfile?.email) {
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
    email: userEmail || undefined, 
    name: userName || undefined,
    metadata: {
      firebaseUID: userId,
    },
  };

  const customer = await stripe.customers.create(customerParams);
  
  await saveUserProfile(userId, { stripeCustomerId: customer.id });

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
        subscriptionType: 'app_premium', // To distinguish this subscription
      },
      // Enable this if you want to allow promo codes for app premium
      // allow_promotion_codes: true, 
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
 * Without this, users will pay but their premium status or biome access WILL NOT be activated in your app.
 *
 * Key Events to Handle:
 *
 * 1. `checkout.session.completed`:
 *    - WHEN: A user successfully completes the Stripe Checkout process.
 *    - METADATA: The session object will contain metadata you passed during session creation (e.g., `firebaseUID`, `priceId`, `subscriptionType`, `biomeId`).
 *    - ACTION:
 *      - If `subscriptionType` is 'app_premium':
 *        - Retrieve the `subscription` ID from the session.
 *        - Fetch the full subscription object from Stripe using the subscription ID to get `current_period_end`.
 *        - Update the user's profile in Firestore (`users/{firebaseUID}`):
 *          - `isPremium = true`
 *          - `stripeCustomerId = session.customer` (if not already set)
 *          - `premiumSubscriptionId = session.subscription`
 *          - `premiumSubscriptionEndsAt = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *      - If `subscriptionType` is 'biome_subscription':
 *        - Retrieve `biomeId` and `subscription` ID.
 *        - Fetch the full subscription object to get `current_period_end`.
 *        - Create/update a document in `biomeMemberships/{firebaseUID}_{biomeId}`:
 *          - `userId = firebaseUID`
 *          - `biomeId = biomeId`
 *          - `role = "member"`
 *          - `status = "active"`
 *          - `stripeSubscriptionId = session.subscription`
 *          - `stripeCustomerId = session.customer`
 *          - `stripePriceId = session.metadata.priceId`
 *          - `stripeCurrentPeriodEnd = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *          - `joinedAt = serverTimestamp()`
 *        - Increment `memberCount` on the `biomes/{biomeId}` document.
 *
 * 2. `customer.subscription.updated`:
 *    - WHEN: A subscription changes (e.g., payment success for renewal, payment failure, cancellation scheduled, trial ends).
 *    - METADATA: The subscription object should have the metadata you set initially (or you might need to fetch it from your DB based on `subscription.id`).
 *    - ACTION:
 *      - Check `subscription.status` (e.g., 'active', 'past_due', 'canceled', 'trialing').
 *      - Check `subscription.cancel_at_period_end`.
 *      - If for 'app_premium':
 *        - Update `isPremium` and `premiumSubscriptionEndsAt` on the user's profile.
 *          (e.g., if `status` is 'canceled' or 'past_due' and `cancel_at_period_end` is true, `isPremium` might remain true until `premiumSubscriptionEndsAt`).
 *      - If for 'biome_subscription':
 *        - Update `status` and `stripeCurrentPeriodEnd` in the `biomeMemberships` document.
 *
 * 3. `customer.subscription.deleted`:
 *    - WHEN: A subscription is definitively canceled (either immediately or at the end of the current period after `cancel_at_period_end` was true).
 *    - ACTION:
 *      - If for 'app_premium':
 *        - Set `isPremium = false` on the user's profile.
 *        - Optionally clear `premiumSubscriptionId` and `premiumSubscriptionEndsAt`.
 *      - If for 'biome_subscription':
 *        - Set `status = "cancelled"` or "expired" in the `biomeMemberships` document.
 *        - Decrement `memberCount` on the `biomes/{biomeId}` document if the member was previously active.
 *
 * Implementation Steps for Webhook:
 * 1. Create a new Firebase Cloud Function (HTTP trigger).
 * 2. Install `stripe` and `firebase-admin` SDKs in your functions directory.
 * 3. Initialize Firebase Admin SDK.
 * 4. Use `stripe.webhooks.constructEvent()` to verify the event signature using your `STRIPE_WEBHOOK_SECRET`.
 * 5. Implement the logic for each event type as described above, making necessary Firestore updates.
 * 6. Deploy the function.
 * 7. In your Stripe Dashboard (Developers > Webhooks), add an endpoint pointing to your deployed function's URL.
 * 8. Select the events to listen to (at least the ones mentioned above).
 * 9. Stripe will provide a "Signing secret" for this endpoint; store this as `STRIPE_WEBHOOK_SECRET` in your function's environment variables.
 *
 * SECURITY: Protect your webhook endpoint. Verify Stripe's signature on every incoming event.
 * IDEMPOTENCY: Design your webhook handlers to be idempotent (i.e., processing the same event multiple times should not cause issues).
 * LOGGING: Add robust logging within your webhook for debugging.
 */
