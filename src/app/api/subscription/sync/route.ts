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

    await connectToDB();

    // Find all users with Stripe subscriptions but missing period data or incorrect plan mapping
    const usersNeedingSync = await User.find({
      "subscription.stripeSubscriptionId": { $exists: true, $ne: null },
      $or: [
        { "subscription.currentPeriodStart": null },
        { "subscription.currentPeriodEnd": null },
        { "subscription.plan": "trial" }, // Users with paid subscriptions but still showing as trial
      ],
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const user of usersNeedingSync) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );

        const priceId = (stripeSubscription as any).items.data[0].price.id;

        // Determine plan based on environment variables
        let plan = "trial";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY) {
          plan = "monthly";
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL
        ) {
          plan = "annual";
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL
        ) {
          plan = "semi-annual";
        } else if (priceId === process.env.STRIPE_PRICE_ID_CUSTOM) {
          plan = "custom";
        }

        // Update user subscription with Stripe data
        user.subscription.plan = plan;
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

        syncedCount++;
      } catch (error) {
        console.error(
          `[SYNC_SUBSCRIPTIONS] Error syncing user ${user.id}:`,
          error
        );
        errorCount++;
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Sync completed. ${syncedCount} users synced successfully, ${errorCount} errors.`,
      details: {
        totalFound: usersNeedingSync.length,
        synced: syncedCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("[SYNC_SUBSCRIPTIONS_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to sync subscriptions" },
      { status: 500 }
    );
  }
}
