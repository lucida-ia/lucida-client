import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, planId } = await request.json();

    if (!priceId || !planId) {
      return NextResponse.json(
        { error: "Price ID and Plan ID are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ id: userId });

    const userIsCustomer = !!user?.subscription.stripeCustomerId;
    const hasPassedCurrentPeriodEnd =
      user?.subscription.currentPeriodEnd &&
      user?.subscription.currentPeriodEnd < new Date();

    if (userIsCustomer && !hasPassedCurrentPeriodEnd) {
      return NextResponse.json(
        {
          error:
            "User is already a customer. Try managing your subscription in the dashboard.",
        },
        { status: 400 }
      );
    }

    // Create checkout session with user ID as client_reference_id
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: userId, // This is crucial for webhook identification
      metadata: {
        userId: userId,
        planId: planId,
      },
      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/dashboard/billing`,
      phone_number_collection: {
        enabled: true,
      },
      discounts: [
        {
          coupon: process.env.STRIPE_CUPOM_EXPLORA || "",
        },
      ],

      // Note: customer_creation is not needed for subscription mode
      // Stripe will automatically create a customer for subscriptions
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
