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

    const debugInfo: any = {
      userSubscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      },
      stripeInfo: null,
      environment: {
        hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      },
    };

    // Check Stripe customer if ID exists
    if (user.subscription.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(
          user.subscription.stripeCustomerId
        );

        if (customer.deleted) {
          debugInfo.stripeInfo = {
            status: "deleted",
            message: "Customer was deleted from Stripe",
          };
        } else {
          const stripeCustomer = customer as Stripe.Customer;
          debugInfo.stripeInfo = {
            status: "active",
            id: stripeCustomer.id,
            email: stripeCustomer.email,
            created: new Date(stripeCustomer.created * 1000).toISOString(),
            metadata: stripeCustomer.metadata,
            subscriptions: stripeCustomer.subscriptions?.data?.length || 0,
          };
        }
      } catch (stripeError: any) {
        debugInfo.stripeInfo = {
          status: "error",
          error: stripeError.message,
          type: stripeError.type,
        };
      }
    } else {
      debugInfo.stripeInfo = {
        status: "no_customer_id",
        message: "No Stripe customer ID found in database",
      };
    }

    return NextResponse.json({
      status: "success",
      data: debugInfo,
    });
  } catch (error) {
    console.error("[PORTAL_DEBUG_ERROR]", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Debug failed",
      },
      { status: 500 }
    );
  }
}
