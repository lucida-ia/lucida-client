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

    // Find all users with Stripe customers but potentially missing metadata
    const usersWithStripeCustomers = await User.find({
      "subscription.stripeCustomerId": { $exists: true, $ne: null },
    });

    let fixedCount = 0;
    let errorCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of usersWithStripeCustomers) {
      try {
        const stripeCustomer = await stripe.customers.retrieve(
          user.subscription.stripeCustomerId
        );

        if (stripeCustomer.deleted) {
          continue;
        }

        const customer = stripeCustomer as Stripe.Customer;

        // Check if metadata already has userId
        if (customer.metadata && customer.metadata.userId === user.id) {
          alreadyCorrectCount++;
          continue;
        }

        // Update customer metadata
        await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            userId: user.id,
          },
        });

        fixedCount++;
      } catch (error) {
        errorCount++;
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Metadata fix completed. ${fixedCount} customers updated, ${alreadyCorrectCount} already correct, ${errorCount} errors.`,
      details: {
        totalFound: usersWithStripeCustomers.length,
        fixed: fixedCount,
        alreadyCorrect: alreadyCorrectCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("[FIX_METADATA_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fix customer metadata" },
      { status: 500 }
    );
  }
}
