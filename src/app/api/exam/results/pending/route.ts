import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    // Get all exams by this professor
    const professorExams = await Exam.find({ userId });
    const examIds = professorExams.map(e => e._id.toString());

    // Find results that need grading for these exams
    const pendingResults = await Result.find({
      examId: { $in: examIds },
      needsGrading: true,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      status: "success",
      results: pendingResults,
    });
  } catch (error) {
    console.error("[PENDING_RESULTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch pending results" },
      { status: 500 }
    );
  }
}

