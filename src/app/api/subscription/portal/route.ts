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

    const user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.subscription.stripeCustomerId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Nenhuma assinatura ativa encontrada",
        },
        { status: 400 }
      );
    }

    console.log(
      "[CUSTOMER_PORTAL] Creating portal for customer:",
      user.subscription.stripeCustomerId
    );

    // Verify customer exists in Stripe first
    let customer;
    try {
      customer = await stripe.customers.retrieve(
        user.subscription.stripeCustomerId
      );
      if (customer.deleted) {
        return NextResponse.json(
          {
            status: "error",
            message: "Customer not found in Stripe",
          },
          { status: 400 }
        );
      }
    } catch (customerError) {
      console.error(
        "[CUSTOMER_PORTAL] Customer retrieval error:",
        customerError
      );
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid customer ID",
        },
        { status: 400 }
      );
    }

    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/dashboard/billing`,
    });

    console.log("[CUSTOMER_PORTAL] Portal session created successfully");

    return NextResponse.json({
      status: "success",
      url: portalSession.url,
    });
  } catch (error) {
    console.error("[CUSTOMER_PORTAL_ERROR] Full error details:", error);

    // Check if it's a Stripe error
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as any;
      console.error(
        "[CUSTOMER_PORTAL_ERROR] Stripe error type:",
        stripeError.type
      );
      console.error(
        "[CUSTOMER_PORTAL_ERROR] Stripe error message:",
        stripeError.message
      );

      return NextResponse.json(
        {
          status: "error",
          message: `Stripe error: ${stripeError.message}`,
          details: stripeError.type,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create customer portal session",
      },
      { status: 500 }
    );
  }
}
