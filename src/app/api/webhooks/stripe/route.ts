import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") as string;

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    if (!session.customer) {
      return;
    }

    if (!session.client_reference_id) {
      return;
    }

    const customerId = session.customer;
    const userId = session.client_reference_id; // This should be the user ID from Clerk

    // Update the Stripe customer with the userId metadata
    const updatedCustomer = await stripe.customers.update(customerId, {
      metadata: {
        userId: userId,
      },
    });

    // Also update the user in the database
    const user = await User.findOne({ id: userId });
    if (user) {
      user.subscription.stripeCustomerId = customerId;
      if (session.subscription) {
        user.subscription.stripeSubscriptionId = session.subscription;
      }
      await user.save();
    }
  } catch (error) {
    console.error(
      "[WEBHOOK] Error handling checkout session completed:",
      error
    );
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);

    if (!customer || customer.deleted) {
      return;
    }

    if (!customer.metadata || !customer.metadata.userId) {
      return;
    }

    const userId = customer.metadata.userId;

    const user = await User.findOne({ id: userId });

    if (!user) {
      console.error(`[WEBHOOK] User not found with ID: ${userId}`);
      return;
    }

    const priceId = subscription.items.data[0].price.id;

    // Determine plan based on environment variables
    let plan = "trial";
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL) {
      plan = "annual";
    } else if (
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL
    ) {
      plan = "semi-annual";
    } else if (priceId === process.env.STRIPE_PRICE_ID_CUSTOM) {
      plan = "custom";
    }

    const oldSubscription = { ...user.subscription };

    // Get subscription item for period dates
    const subscriptionItem = subscription.items?.data?.[0];
    console.log(
      "[WEBHOOK] Subscription item:",
      JSON.stringify(subscriptionItem, null, 2)
    );

    // Extract period dates - prioritize subscription item, fallback to subscription level
    let currentPeriodStart = null;
    let currentPeriodEnd = null;

    if (subscriptionItem) {
      currentPeriodStart = subscriptionItem.current_period_start;
      currentPeriodEnd = subscriptionItem.current_period_end;
    }

    // Fallback to subscription level if not found in item
    if (!currentPeriodStart) {
      currentPeriodStart = subscription.current_period_start;
    }
    if (!currentPeriodEnd) {
      currentPeriodEnd = subscription.current_period_end;
    }

    console.log("[WEBHOOK] Period dates:", {
      currentPeriodStart,
      currentPeriodEnd,
    });

    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    user.subscription = {
      ...user.subscription,
      plan,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      cancelAtPeriodEnd:
        typeof cancelAtPeriodEnd === "boolean" ? cancelAtPeriodEnd : false,
    };

    if (currentPeriodStart && typeof currentPeriodStart === "number") {
      user.subscription.currentPeriodStart = new Date(
        currentPeriodStart * 1000
      );
    } else {
      user.subscription.currentPeriodStart = null;
    }

    if (currentPeriodEnd && typeof currentPeriodEnd === "number") {
      user.subscription.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
    } else {
      user.subscription.currentPeriodEnd = null;
    }

    await user.save();
  } catch (error) {
    console.error("[WEBHOOK] Error handling subscription created:", error);
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);

    if (!customer || customer.deleted) {
      return;
    }

    if (!customer.metadata || !customer.metadata.userId) {
      return;
    }

    const userId = customer.metadata.userId;

    const user = await User.findOne({ id: userId });

    if (!user) {
      return;
    }

    const priceId = subscription.items.data[0].price.id;

    // Determine plan based on environment variables
    let plan = "trial";
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL) {
      plan = "annual";
    } else if (
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL
    ) {
      plan = "semi-annual";
    } else if (priceId === process.env.STRIPE_PRICE_ID_CUSTOM) {
      plan = "custom";
    }

    const oldSubscription = { ...user.subscription };

    // Get subscription item for period dates
    const subscriptionItem = subscription.items?.data?.[0];
    console.log(
      "[WEBHOOK] Subscription item:",
      JSON.stringify(subscriptionItem, null, 2)
    );

    // Extract period dates - prioritize subscription item, fallback to subscription level
    let currentPeriodStart = null;
    let currentPeriodEnd = null;

    if (subscriptionItem) {
      currentPeriodStart = subscriptionItem.current_period_start;
      currentPeriodEnd = subscriptionItem.current_period_end;
    }

    // Fallback to subscription level if not found in item
    if (!currentPeriodStart) {
      currentPeriodStart = subscription.current_period_start;
    }
    if (!currentPeriodEnd) {
      currentPeriodEnd = subscription.current_period_end;
    }

    console.log("[WEBHOOK] Period dates:", {
      currentPeriodStart,
      currentPeriodEnd,
    });

    const cancelAtPeriodEnd = subscription.cancel_at_period_end;

    user.subscription = {
      ...user.subscription,
      plan,
      status: subscription.status,
      cancelAtPeriodEnd:
        typeof cancelAtPeriodEnd === "boolean" ? cancelAtPeriodEnd : false,
    };

    if (currentPeriodStart && typeof currentPeriodStart === "number") {
      user.subscription.currentPeriodStart = new Date(
        currentPeriodStart * 1000
      );
    } else {
      user.subscription.currentPeriodStart = null;
    }

    if (currentPeriodEnd && typeof currentPeriodEnd === "number") {
      user.subscription.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
    } else {
      user.subscription.currentPeriodEnd = null;
    }

    await user.save();
  } catch (error) {
    console.error("[WEBHOOK] Error handling subscription updated:", error);
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);

    if (!customer || customer.deleted) {
      return;
    }

    if (!customer.metadata || !customer.metadata.userId) {
      return;
    }

    const userId = customer.metadata.userId;

    const user = await User.findOne({ id: userId });

    if (!user) {
      return;
    }

    const oldSubscription = { ...user.subscription };

    user.subscription = {
      ...user.subscription,
      plan: "trial",
      status: "canceled",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
    };

    await user.save();
  } catch (error) {
    console.error("[WEBHOOK] Error handling subscription deleted:", error);
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);

    if (!customer || customer.deleted) {
      return;
    }

    if (!customer.metadata || !customer.metadata.userId) {
      return;
    }

    const userId = customer.metadata.userId;

    const user = await User.findOne({ id: userId });

    if (!user) {
      return;
    }

    const oldUsage = { ...user.usage };

    // Reset usage count on successful payment
    user.usage.examsThisPeriod = 0;
    user.usage.examsThisPeriodResetDate = new Date();

    await user.save();
  } catch (error) {
    console.error("[WEBHOOK] Error handling payment succeeded:", error);
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);

    if (!customer || customer.deleted) {
      return;
    }

    if (!customer.metadata || !customer.metadata.userId) {
      return;
    }

    const userId = customer.metadata.userId;

    const user = await User.findOne({ id: userId });

    if (!user) {
      return;
    }

    user.subscription.status = "past_due";

    await user.save();
  } catch (error) {
    console.error("[WEBHOOK] Error handling payment failed:", error);
    // Re-throw to ensure webhook fails and Stripe retries
    throw error;
  }
}
