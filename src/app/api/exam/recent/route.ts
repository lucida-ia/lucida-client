import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";

import { NextRequest, NextResponse } from "next/server";
import { Class } from "@/models/Class";

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

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");

    let requester = await User.findOne({ id: userId });
    if (!requester) {
      requester = new User({ id: userId });
      requester.subscription.plan = "trial";
      requester.subscription.status = "active";
      requester.usage.examsThisPeriod = 0;
      requester.usage.examsThisPeriodResetDate = new Date();
      const { username, email } = await getClerkIdentity(userId);
      if (username) requester.username = username;
      if (email) requester.email = email;
      await requester.save();
    }
    const isAdmin = requester.subscription?.plan === "admin";
    const targetUserId = isAdmin && asUser ? asUser : requester.id;

    const user = await User.findOne({ id: targetUserId });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const pageParam = parseInt(url.searchParams.get("page") || "1", 10);
    const limitParam = parseInt(
      url.searchParams.get("limit") || String(DEFAULT_LIMIT),
      10
    );
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const filter = {
      userId: user?.id,
      createdAt: { $gte: thirtyDaysAgo },
    };

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter),
    ]);

    return NextResponse.json({
      status: "success",
      message: "Exams fetched successfully",
      data: exams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[EXAM_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get exams",
    });
  }
}
