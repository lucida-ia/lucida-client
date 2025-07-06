import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Webhook test endpoint is working",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    await connectToDB();

    // Test user query
    const userCount = await User.countDocuments();

    // Test environment variables
    const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

    return NextResponse.json({
      message: "Webhook test successful",
      database: {
        connected: true,
        userCount,
      },
      environment: {
        hasStripeSecret,
        hasWebhookSecret,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Webhook test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
