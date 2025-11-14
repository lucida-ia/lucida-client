import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
        { status: "error", message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const now = new Date();
    const currentPeriodEnd = user.subscription.currentPeriodEnd;
    let planUpdated = false;

    // Check if currentPeriodEnd exists and has passed
    if (currentPeriodEnd && currentPeriodEnd < now) {
      // Update plan to trial if period has ended
      if (user.subscription.plan !== "trial") {
        user.subscription.plan = "trial";
        planUpdated = true;
        await user.save();
      }
    }

    return NextResponse.json({
      status: "success",
      message: planUpdated
        ? "Plano atualizado para trial - período expirado"
        : "Período ainda ativo ou já está em trial",
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
      planUpdated,
    });
  } catch (error) {
    console.error("[CHECK_EXPIRY_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to check subscription expiry" },
      { status: 500 }
    );
  }
}
