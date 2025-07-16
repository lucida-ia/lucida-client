import { connectToDB } from "@/lib/mongodb";
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
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { status: "error", message: "Subscription ID is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Cancel the subscription in Stripe
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (stripeError) {
      console.error("Error canceling subscription in Stripe:", stripeError);
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to cancel subscription with Stripe",
        },
        { status: 500 }
      );
    }

    // Update user subscription to cancel at period end
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Subscription canceled successfully",
      subscription: {
        id: user.id,
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        usage: user.usage,
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION_CANCEL_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
