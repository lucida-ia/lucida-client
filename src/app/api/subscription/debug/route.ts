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

    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const debugData: any = {
      database: {
        userId: user.id,
        subscription: user.subscription,
      },
      stripe: null,
    };

    // Get data from Stripe if subscription exists
    if (user.subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );

        const subscriptionItem = (stripeSubscription as any).items?.data?.[0];
        const currentPeriodStart =
          subscriptionItem?.current_period_start ||
          (stripeSubscription as any).current_period_start;
        const currentPeriodEnd =
          subscriptionItem?.current_period_end ||
          (stripeSubscription as any).current_period_end;

        debugData.stripe = {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: (stripeSubscription as any)
            .cancel_at_period_end,
          current_period_start_date: currentPeriodStart
            ? new Date(currentPeriodStart * 1000).toISOString()
            : null,
          current_period_end_date: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
          subscription_item_period_start:
            subscriptionItem?.current_period_start,
          subscription_item_period_end: subscriptionItem?.current_period_end,
          subscription_direct_period_start: (stripeSubscription as any)
            .current_period_start,
          subscription_direct_period_end: (stripeSubscription as any)
            .current_period_end,
          raw_data: stripeSubscription,
        };
      } catch (stripeError) {
        debugData.stripe = {
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Unknown error",
        };
      }
    }

    // Get customer data if exists
    if (user.subscription.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(
          user.subscription.stripeCustomerId
        );
        debugData.customer = {
          id: customer.id,
          deleted: customer.deleted,
          metadata: customer.deleted
            ? null
            : (customer as Stripe.Customer).metadata,
        };
      } catch (customerError) {
        debugData.customer = {
          error:
            customerError instanceof Error
              ? customerError.message
              : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      status: "success",
      data: debugData,
    });
  } catch (error) {
    console.error("[DEBUG_SUBSCRIPTION_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to debug subscription" },
      { status: 500 }
    );
  }
}
