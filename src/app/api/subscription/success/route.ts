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
      const dashboardUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/dashboard?error=unauthorized`;
      return NextResponse.redirect(dashboardUrl);
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      const dashboardUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/dashboard?error=missing_session`;
      return NextResponse.redirect(dashboardUrl);
    }

    try {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session.customer) {
        const dashboardUrl = `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/dashboard?error=no_customer`;
        return NextResponse.redirect(dashboardUrl);
      }

      await connectToDB();

      // Get the user
      let user = await User.findOne({ id: userId });

      if (!user) {
        const dashboardUrl = `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/dashboard?error=user_not_found`;
        return NextResponse.redirect(dashboardUrl);
      }

      // Update user with Stripe customer ID and subscription ID
      user.subscription.stripeCustomerId = session.customer as string;

      if (session.subscription) {
        user.subscription.stripeSubscriptionId = session.subscription as string;

        // Get subscription details to update plan
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const priceId = subscription.items.data[0].price.id;

        // Determine plan based on environment variables
        let plan = "trial";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MENSAL) {
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

        user.subscription.plan = plan;
        user.subscription.status = subscription.status;

        // Safely handle date fields
        const currentPeriodStart = (subscription as any).current_period_start;
        const currentPeriodEnd = (subscription as any).current_period_end;
        const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;

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
      }

      await user.save();

      // Redirect to dashboard after successful subscription
      const dashboardUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/thank-you`;
      return NextResponse.redirect(dashboardUrl);
    } catch (stripeError) {
      console.error("Error retrieving checkout session:", stripeError);
      const dashboardUrl = `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/dashboard?error=stripe_error`;
      return NextResponse.redirect(dashboardUrl);
    }
  } catch (error) {
    console.error("[CHECKOUT_SUCCESS_ERROR]", error);
    const dashboardUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/dashboard?error=processing_error`;
    return NextResponse.redirect(dashboardUrl);
  }
}
