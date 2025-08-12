import { connectToDB } from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
      // Set subscription properties explicitly
      requester.subscription.plan = "trial";
      requester.subscription.status = "active";
      // Set usage properties explicitly
      requester.usage.examsThisPeriod = 0;
      requester.usage.examsThisPeriodResetDate = new Date();
      await requester.save();
    }

    const isAdmin = requester.subscription?.plan === "admin";

    // Target user to view
    const targetUserId = isAdmin && asUser ? asUser : userId || "";
    let user = await User.findOne({ id: targetUserId });

    if (!user) {
      // Only auto-create for self, not when impersonating
      if (!asUser) {
        user = new User({ id: targetUserId });
        user.subscription.plan = "trial";
        user.subscription.status = "active";
        user.usage.examsThisPeriod = 0;
        user.usage.examsThisPeriodResetDate = new Date();
        await user.save();
      } else {
        return NextResponse.json(
          { status: "error", message: "Usuário não encontrado" },
          { status: 404 }
        );
      }
    }

    // Check if usage needs to be reset based on plan duration
    const now = new Date();
    const resetDate = new Date(user.usage.examsThisPeriodResetDate);
    let shouldReset = false;

    const isSelfView = !asUser || targetUserId === userId;

    if (isSelfView && user.subscription.plan === "trial") {
      // Reset every 30 days for trial users
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      shouldReset = resetDate < thirtyDaysAgo;
    } else if (isSelfView && user.subscription.plan === "semi-annual") {
      // Reset every 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      shouldReset = resetDate < sixMonthsAgo;
    } else if (isSelfView && user.subscription.plan === "annual") {
      // Reset every year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      shouldReset = resetDate < oneYearAgo;
    } else {
      // For custom plan, no reset needed (unlimited)
      shouldReset = false;
    }

    if (isSelfView && shouldReset) {
      user.usage.examsThisPeriod = 0;
      user.usage.examsThisPeriodResetDate = now;
      await user.save();
    }

    const classes = await Class.find({ userId: user.id });
    const exams = await Exam.find({ userId: user.id });

    // Calculate additional stats
    const totalExams = exams.length;
    const totalClasses = classes.length;

    return NextResponse.json({
      status: "success",
      message: "User fetched successfully",
      data: {
        user: {
          id: user.id,
          subscription: user.subscription,
          usage: user.usage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: {
          totalExams,
          totalClasses,
          examsThisPeriod: user.usage.examsThisPeriod,
        },
        classes,
        exams,
      },
    });
  } catch (error) {
    console.error("[USER_GET_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription, usage } = body;

    await connectToDB();

    let user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    // Update subscription if provided
    if (subscription) {
      user.subscription = { ...user.subscription, ...subscription };
    }

    // Update usage if provided
    if (usage) {
      user.usage = { ...user.usage, ...usage };
    }

    await user.save();

    return NextResponse.json({
      status: "success",
      message: "User updated successfully",
      data: {
        user: {
          id: user.id,
          subscription: user.subscription,
          usage: user.usage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[USER_UPDATE_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    await connectToDB();

    let user = await User.findOne({ id: userId });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "increment_exam_usage":
        user.usage.examsThisPeriod += 1;
        break;
      case "reset_usage":
        user.usage.examsThisPeriod = 0;
        user.usage.examsThisPeriodResetDate = new Date();
        break;
      case "update_subscription":
        user.subscription = { ...user.subscription, ...data };
        break;
      default:
        return NextResponse.json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }

    await user.save();

    return NextResponse.json({
      status: "success",
      message: `User ${action} completed successfully`,
      data: {
        user: {
          id: user.id,
          subscription: user.subscription,
          usage: user.usage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("[USER_PATCH_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update user" },
      { status: 500 }
    );
  }
}
