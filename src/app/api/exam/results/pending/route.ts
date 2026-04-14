import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const url = new URL(request.url);
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

    const professorExams = await Exam.find({ userId }).select("_id").lean();
    const examIds = professorExams.map((e: any) => e._id.toString());

    const filter = {
      examId: { $in: examIds },
      needsGrading: true,
    };

    const [pendingResults, total] = await Promise.all([
      Result.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    return NextResponse.json({
      status: "success",
      results: pendingResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[PENDING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch pending results" },
      { status: 500 }
    );
  }
}

