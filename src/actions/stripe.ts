
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
  itemPriceInCents: number; 
  quantity: number;
  itemId: string; 
  userId?: string; 
  crystallineBloomId?: string | null; 
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
  console.info(`[createCheckoutSession] Attempting for item: ${itemName}, itemId: ${itemId}, userId: ${userId}`);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('[createCheckoutSession] Base URL (NEXT_PUBLIC_BASE_URL) is not configured.');
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
    
    const metadata: Stripe.MetadataParam = { 
        itemId,
        itemType: 'shop_item', 
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
             const customerId = await getOrCreateStripeCustomerId(userId, userProfile.email, userProfile.fullName || userProfile.username);
             if (customerId) sessionParams.customer = customerId;
        }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.id) {
      console.error('[createCheckoutSession] Stripe session creation failed (no ID returned).');
      return { error: 'Could not create Stripe Checkout session.' };
    }
    console.info(`[createCheckoutSession] Stripe session created: ${session.id} for itemId: ${itemId}, userId: ${userId}`);
    return { sessionId: session.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[createCheckoutSession] Error for item: ${itemName}, itemId: ${itemId}: ${errorMessage}`, error);
    return { error: `Failed to create checkout session: ${errorMessage}` };
  }
}


export async function getOrCreateStripeCustomerId(
  userId: string,
  userEmail?: string | null,
  userName?: string | null
): Promise<string | null> { // Modified to return null on critical error
  if (!userId) {
    console.error("[getOrCreateStripeCustomerId] User ID is required.");
    throw new Error("User ID is required to get or create Stripe customer ID.");
  }
  console.info(`[getOrCreateStripeCustomerId] Processing for userId: ${userId}`);

  const userProfile = await getUserProfile(userId);

  if (userProfile?.stripeCustomerId) {
    try {
        const customer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
        if (customer && !customer.deleted) {
            console.info(`[getOrCreateStripeCustomerId] Found existing Stripe customerId: ${userProfile.stripeCustomerId} for userId: ${userId}`);
            return userProfile.stripeCustomerId;
        }
        console.warn(`[getOrCreateStripeCustomerId] Stripe customer ${userProfile.stripeCustomerId} for user ${userId} was deleted or not found. Creating a new one.`);
    } catch (error: any) {
        if (error.code === 'resource_missing') {
             console.warn(`[getOrCreateStripeCustomerId] Stripe customer ${userProfile.stripeCustomerId} for user ${userId} not found in Stripe. Creating a new one.`);
        } else {
            console.warn(`[getOrCreateStripeCustomerId] Failed to retrieve Stripe customer ${userProfile.stripeCustomerId} for user ${userId}. Error: ${error.message}. Creating a new one.`);
        }
    }
  }

  const customerParams: Stripe.CustomerCreateParams = {
    email: userEmail || userProfile?.email || undefined, 
    name: userName || userProfile?.fullName || userProfile?.username || undefined,
    metadata: {
      firebaseUID: userId,
    },
  };

  try {
    const customer = await stripe.customers.create(customerParams);
    console.info(`[getOrCreateStripeCustomerId] Created new Stripe customerId: ${customer.id} for userId: ${userId}`);
    
    // Save to user profile
    // Ensure saveUserProfile is robust and doesn't require full profile data if only updating stripeCustomerId
    const saveResult = await saveUserProfile(userId, { stripeCustomerId: customer.id, email: userEmail || userProfile?.email, fullName: userName || userProfile?.fullName, username: userProfile?.username });
    if(!saveResult.success){
        console.error(`[getOrCreateStripeCustomerId] Failed to save new Stripe customerId ${customer.id} to user profile ${userId}. Message: ${saveResult.message}`);
        // Depending on policy, you might want to delete the Stripe customer if Firebase save fails, or log for manual reconciliation
    }
    return customer.id;

  } catch(error){
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred creating Stripe customer.';
      console.error(`[getOrCreateStripeCustomerId] Error creating Stripe customer for userId ${userId}: ${errorMessage}`, error);
      return null; // Return null on critical error to prevent further issues
  }
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null,
  priceId: string, 
  biomeId: string 
): Promise<{ sessionId: string } | { error: string }> {
  console.info(`[createSubscriptionCheckoutSession] Attempting for userId: ${userId}, priceId: ${priceId}, biomeId: ${biomeId}`);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('[createSubscriptionCheckoutSession] Base URL (NEXT_PUBLIC_BASE_URL) is not configured.');
    return { error: 'Base URL is not configured.' };
  }

  const successUrl = `${baseUrl}/biomes?biome_join_success=${biomeId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/biomes?biome_join_cancel=${biomeId}`;

  try {
    const stripeCustomerId = await getOrCreateStripeCustomerId(userId, userEmail, userName);
    if (!stripeCustomerId) {
        console.error(`[createSubscriptionCheckoutSession] Could not get or create Stripe customer ID for user ${userId}.`);
        return { error: "Could not process payment due to customer identification error." };
    }

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
      console.error('[createSubscriptionCheckoutSession] Stripe session creation failed (no ID returned).');
      return { error: 'Could not create Stripe subscription session.' };
    }
    console.info(`[createSubscriptionCheckoutSession] Stripe session created: ${session.id} for userId: ${userId}, biomeId: ${biomeId}`);
    return { sessionId: session.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[createSubscriptionCheckoutSession] Error for userId: ${userId}, biomeId: ${biomeId}: ${errorMessage}`, error);
    return { error: `Failed to create subscription session: ${errorMessage}` };
  }
}

export async function createPremiumAppSubscriptionCheckoutSession(
  userId: string,
  userEmail: string | undefined | null,
  userName: string | undefined | null
): Promise<{ sessionId: string } | { error: string }> {
  console.info(`[createPremiumAppSubscriptionCheckoutSession] Attempting for userId: ${userId}`);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('[createPremiumAppSubscriptionCheckoutSession] Base URL (NEXT_PUBLIC_BASE_URL) is not configured.');
    return { error: 'Base URL is not configured.' };
  }
  const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!premiumPriceId) {
    console.error('[createPremiumAppSubscriptionCheckoutSession] Stripe Premium Price ID (STRIPE_PREMIUM_PRICE_ID) is not configured.');
    return { error: 'Stripe Premium Price ID is not configured in environment variables.' };
  }

  const successUrl = `${baseUrl}/premium?premium_status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/premium?premium_status=cancel`;

  try {
    const stripeCustomerId = await getOrCreateStripeCustomerId(userId, userEmail, userName);
     if (!stripeCustomerId) {
        console.error(`[createPremiumAppSubscriptionCheckoutSession] Could not get or create Stripe customer ID for user ${userId}.`);
        return { error: "Could not process payment due to customer identification error." };
    }

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
      console.error('[createPremiumAppSubscriptionCheckoutSession] Stripe session creation failed (no ID returned).');
      return { error: 'Could not create Stripe premium app subscription session.' };
    }
    console.info(`[createPremiumAppSubscriptionCheckoutSession] Stripe session created: ${session.id} for userId: ${userId}`);
    return { sessionId: session.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[createPremiumAppSubscriptionCheckoutSession] Error for userId: ${userId}: ${errorMessage}`, error);
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
 *        - Call the `createOrder` action (or similar logic directly in webhook) to create an `OrderData` document in your `orders` collection in Firestore. Include:
 *          - `userId` (if `firebaseUID` is present),
 *          - `userEmail` (from `customer_details` or user profile),
 *          - `items`: [{ `itemId`, `name`, `priceInCents`, `quantity`: (usually 1 for this setup) }],
 *          - `totalAmountInCents`: `session.amount_total`,
 *          - `status`: 'paid',
 *          - `stripeCheckoutSessionId`: `session.id`,
 *          - `createdAt`, `updatedAt`.
 *        - If the item is physical and has `stock` tracking: Decrement the `stock` count on the `ShopItemData` document (atomically using Firestore transactions or increment(-quantity)).
 *        - If the item is digital: Trigger your digital goods delivery mechanism.
 *        - Send notifications to buyer and artist.
 *
 *      - **If `session.mode` is 'subscription' (for app premium or biome subscriptions):**
 *        - **If `subscriptionType` is 'app_premium':**
 *          - Retrieve the `subscription` ID from `session.subscription`.
 *          - Fetch the full subscription object from Stripe: `await stripe.subscriptions.retrieve(session.subscription as string)`.
 *          - Update the user's profile in Firestore (`users/{firebaseUID}`):
 *            - `isPremium = true`
 *            - `stripeCustomerId = session.customer as string` (if not already set)
 *            - `premiumSubscriptionId = session.subscription as string`
 *            - `premiumSubscriptionEndsAt = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *            - `updatedAt = serverTimestamp()`
 *        - **If `subscriptionType` is 'biome_subscription':**
 *          - Retrieve `biomeId` and `subscription` ID.
 *          - Fetch the full subscription object.
 *          - Create/update a document in `biomeMemberships/{firebaseUID}_{biomeId}`:
 *            - `userId = firebaseUID`, `biomeId = biomeId`, `role = "member"`, `status = "active"`
 *            - `stripeSubscriptionId = session.subscription as string`, `stripeCustomerId = session.customer as string`
 *            - `stripePriceId = session.metadata.priceId`
 *            - `stripeCurrentPeriodEnd = Timestamp.fromMillis(subscription.current_period_end * 1000)`
 *            - `joinedAt = serverTimestamp()` (on create), `updatedAt = serverTimestamp()`
 *          - Atomically increment `memberCount` on the `biomes/{biomeId}` document.
 *
 * 2. `customer.subscription.updated`:
 *    - WHEN: A subscription changes (e.g., payment success for renewal, payment failure, cancellation scheduled).
 *    - METADATA: The subscription object (`event.data.object as Stripe.Subscription`) should have metadata.
 *    - ACTION:
 *      - If for 'app_premium': Update `isPremium` (e.g., to `false` if status is `canceled` or `past_due` and grace period passed) and `premiumSubscriptionEndsAt` on the user's profile.
 *      - If for 'biome_subscription': Update `status` (e.g., `active`, `past_due`, `cancelled`) and `stripeCurrentPeriodEnd` in `biomeMemberships`.
 *
 * 3. `customer.subscription.deleted`:
 *    - WHEN: A subscription is definitively canceled (at period end or immediately).
 *    - ACTION:
 *      - If for 'app_premium': Set `isPremium = false`, clear `premiumSubscriptionId` and `premiumSubscriptionEndsAt` on user profile.
 *      - If for 'biome_subscription': Set `status = "cancelled"` in `biomeMemberships`, clear Stripe fields, and atomically decrement `memberCount` on the biome.
 *
 * Implementation Steps for Webhook (Firebase Cloud Function):
 * 1. `firebase init functions` (if not done), choose TypeScript.
 * 2. `npm install stripe firebase-admin firebase-functions` in your functions directory.
 * 3. Initialize Firebase Admin SDK in your function (e.g., `admin.initializeApp()`).
 * 4. Use `stripe.webhooks.constructEvent()` to verify signature with `STRIPE_WEBHOOK_SECRET`.
 * 5. Implement logic for event types. Ensure idempotent handling.
 * 6. Deploy: `firebase deploy --only functions`.
 * 7. Stripe Dashboard: Developers > Webhooks > Add endpoint (URL of deployed function). Select events. Get signing secret.
 * 8. Set environment variables for the function: `stripe.secret_key`, `stripe.webhook_secret`.
 *    `firebase functions:config:set stripe.secret="sk_test_YOUR_KEY" stripe.webhooksecret="whsec_YOUR_SECRET"`
 *
 * SECURITY: Protect your webhook. Verify Stripe's signature. Use Firebase Admin SDK for Firestore writes.
 * IDEMPOTENCY: Design handlers to be idempotent (safe to run multiple times for the same event).
 * LOGGING: Add robust logging within your Cloud Function for debugging.
 */
