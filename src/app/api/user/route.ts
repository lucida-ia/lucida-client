import { connectToDB } from "@/lib/mongodb";
import { Class } from "@/models/Class";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { getClerkIdentity } from "@/lib/clerk";
import { NextRequest, NextResponse } from "next/server";
import {
  withCache,
  generateCacheKey,
  CACHE_TTL,
  createCachedResponse,
  invalidateUserCache,
} from "@/lib/cache";

// Helper function to fetch user data (cacheable)
async function fetchUserData(
  userId: string,
  targetUserId: string,
  asUser: string | null
) {
  await connectToDB();

  // Get or create requester
  let requester = await User.findOne({ id: userId }).lean();
  if (!requester) {
    const newRequester = new User({ id: userId });
    newRequester.subscription.plan = "trial";
    newRequester.subscription.status = "active";
    newRequester.usage.examsThisPeriod = 0;
    newRequester.usage.examsThisPeriodResetDate = new Date();

    try {
      const { username, email } = await getClerkIdentity(userId);
      if (username) newRequester.username = username;
      if (email) newRequester.email = email;
    } catch {}

    await newRequester.save();
    requester = newRequester.toObject();
  }

  const isAdmin = requester.subscription?.plan === "admin";

  // Get or create target user
  let user = await User.findOne({ id: targetUserId }).lean();
  if (!user) {
    if (!asUser) {
      const newUser = new User({ id: targetUserId });
      newUser.subscription.plan = "trial";
      newUser.subscription.status = "active";
      newUser.usage.examsThisPeriod = 0;
      newUser.usage.examsThisPeriodResetDate = new Date();

      try {
        const { username, email } = await getClerkIdentity(targetUserId);
        if (username) newUser.username = username;
        if (email) newUser.email = email;
      } catch {}

      await newUser.save();
      user = newUser.toObject();
    } else {
      throw new Error("User not found");
    }
  }

  // Get user's classes and exams in parallel for better performance
  const [classes, exams] = await Promise.all([
    Class.find({ userId: user.id }).lean(),
    Exam.find({ userId: user.id }).lean(),
  ]);

  return {
    user,
    requester,
    isAdmin,
    classes,
    exams,
    stats: {
      totalExams: exams.length,
      totalClasses: classes.length,
      examsThisPeriod: user.usage.examsThisPeriod,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const asUser = url.searchParams.get("asUser");
    const targetUserId = asUser || userId;

    // Generate cache key
    const cacheKey = generateCacheKey("user", userId, {
      targetUserId,
      asUser: asUser || "self",
    });

    // Use cached data if available, otherwise fetch fresh data
    const data = await withCache(cacheKey, CACHE_TTL.USER_DATA, () =>
      fetchUserData(userId, targetUserId, asUser)
    );

    if (!data.user && asUser) {
      return NextResponse.json(
        { status: "error", message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check and handle usage reset (non-cached operation for accuracy)
    const isSelfView = !asUser || targetUserId === userId;
    if (isSelfView) {
      const now = new Date();
      const resetDate = new Date(data.user.usage.examsThisPeriodResetDate);
      let shouldReset = false;

      if (data.user.subscription.plan === "trial") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        shouldReset = resetDate < thirtyDaysAgo;
      } else if (data.user.subscription.plan === "semi-annual") {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        shouldReset = resetDate < sixMonthsAgo;
      } else if (data.user.subscription.plan === "annual") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        shouldReset = resetDate < oneYearAgo;
      }

      if (shouldReset) {
        await connectToDB();
        await User.findByIdAndUpdate(data.user._id, {
          "usage.examsThisPeriod": 0,
          "usage.examsThisPeriodResetDate": now,
        });

        // Invalidate cache after reset
        invalidateUserCache(userId);

        // Update the data object for response
        data.user.usage.examsThisPeriod = 0;
        data.user.usage.examsThisPeriodResetDate = now;
        data.stats.examsThisPeriod = 0;
      }
    }

    // Return cached response with proper headers
    return createCachedResponse({
      status: "success",
      message: "User fetched successfully",
      data: {
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          subscription: data.user.subscription,
          usage: data.user.usage,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt,
        },
        stats: data.stats,
        classes: data.classes,
        exams: data.exams,
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
