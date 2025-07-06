import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectToDB();

    let user = await User.findOne({ id: userId });

    if (!user) {
      // Create user with default free plan
      user = await User.create({
        id: userId,
        subscription: {
          plan: "free",
          status: "active",
        },
        usage: {
          examsThisMonth: 0,
          examsThisMonthResetDate: new Date(),
        },
      });
    }

    // Check if subscription data needs syncing from Stripe
    if (
      user.subscription.stripeSubscriptionId &&
      (!user.subscription.currentPeriodStart ||
        !user.subscription.currentPeriodEnd)
    ) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );

        // Update user subscription with Stripe data
        user.subscription.status = stripeSubscription.status;

        // Safely handle date fields - get from subscription items or direct
        const subscriptionItem = (stripeSubscription as any).items?.data?.[0];
        const currentPeriodStart =
          subscriptionItem?.current_period_start ||
          (stripeSubscription as any).current_period_start;
        const currentPeriodEnd =
          subscriptionItem?.current_period_end ||
          (stripeSubscription as any).current_period_end;
        const cancelAtPeriodEnd = (stripeSubscription as any)
          .cancel_at_period_end;

        if (currentPeriodStart && typeof currentPeriodStart === "number") {
          user.subscription.currentPeriodStart = new Date(
            currentPeriodStart * 1000
          );
        } else {
          user.subscription.currentPeriodStart = null;
        }

        if (currentPeriodEnd && typeof currentPeriodEnd === "number") {
          user.subscription.currentPeriodEnd = new Date(
            currentPeriodEnd * 1000
          );
        } else {
          user.subscription.currentPeriodEnd = null;
        }

        if (typeof cancelAtPeriodEnd === "boolean") {
          user.subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
        } else {
          user.subscription.cancelAtPeriodEnd = false;
        }

        await user.save();
      } catch (stripeError) {
        console.error(
          `[SUBSCRIPTION_SYNC] Error syncing subscription data:`,
          stripeError
        );
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Subscription fetched successfully",
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
    console.error("[SUBSCRIPTION_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const {
      planId,
      stripeCustomerId,
      stripeSubscriptionId,
      customerEmail,
      customerName,
    } = await request.json();

    await connectToDB();

    let user = await User.findOne({ id: userId });

    if (!user) {
      user = await User.create({
        id: userId,
        subscription: {
          plan: "free",
          status: "active",
        },
        usage: {
          examsThisMonth: 0,
          examsThisMonthResetDate: new Date(),
        },
      });
    }

    // Create Stripe customer if subscribing to paid plan and customer doesn't exist
    let customerId = stripeCustomerId || user.subscription.stripeCustomerId;

    if (planId !== "free" && !customerId && (customerEmail || customerName)) {
      try {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;
      } catch (stripeError) {
        console.error("Error creating Stripe customer:", stripeError);
        return NextResponse.json(
          { status: "error", message: "Failed to create customer in Stripe" },
          { status: 500 }
        );
      }
    }

    // Update subscription
    user.subscription.plan = planId;

    if (customerId) {
      user.subscription.stripeCustomerId = customerId;
    }

    if (stripeSubscriptionId) {
      user.subscription.stripeSubscriptionId = stripeSubscriptionId;
    }

    // Reset usage if changing from free to paid plan
    if (user.subscription.plan === "free" && planId !== "free") {
      user.usage.examsThisMonth = 0;
      user.usage.examsThisMonthResetDate = new Date();
    }

    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Subscription updated successfully",
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
    console.error("[SUBSCRIPTION_POST_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
