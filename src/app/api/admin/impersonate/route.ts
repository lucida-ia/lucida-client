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

    const adminIdsEnv = process.env.ADMIN_USER_IDS || "";
    const allowedAdminIds = adminIdsEnv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!allowedAdminIds.includes(userId)) {
      return NextResponse.json(
        { status: "forbidden", message: "Acesso negado" },
        { status: 403 }
      );
    }

    await connectToDB();

    let user = await User.findOne({ id: userId });
    if (!user) {
      user = new User({ id: userId });
    }

    user.subscription.plan = "admin";
    user.subscription.status = "active";
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "User upgraded to admin plan",
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
      },
    });
  } catch (error) {
    console.error("[ADMIN_IMPERSONATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to set admin plan" },
      { status: 500 }
    );
  }
}


