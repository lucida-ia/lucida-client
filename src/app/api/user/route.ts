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

    let user = await User.findOne({ id: userId });

    if (!user) {
      user = await User.create({ id: userId });
    }

    // Check if usage needs to be reset (monthly reset)
    const now = new Date();
    const resetDate = new Date(user.usage.examsThisMonthResetDate);
    const shouldReset =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear();

    if (shouldReset) {
      user.usage.examsThisMonth = 0;
      user.usage.examsThisMonthResetDate = now;
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
          examsThisMonth: user.usage.examsThisMonth,
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
        user.usage.examsThisMonth += 1;
        break;
      case "reset_usage":
        user.usage.examsThisMonth = 0;
        user.usage.examsThisMonthResetDate = new Date();
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
