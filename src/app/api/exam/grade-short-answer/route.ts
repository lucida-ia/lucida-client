import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDB();

    const { resultId, questionIndex, score, feedback, useAI } = await request.json();

    // Get the result
    const result = await Result.findById(resultId);
    if (!result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    // Get the exam to verify ownership and get question details
    const exam = await Exam.findById(result.examId);
    if (!exam || exam.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - not your exam" },
        { status: 403 }
      );
    }

    const question = exam.questions[questionIndex];
    const answerDetail = result.answers[questionIndex];

    if (!question || !answerDetail) {
      return NextResponse.json(
        { error: "Question or answer not found" },
        { status: 404 }
      );
    }

    if (question.type !== "shortAnswer") {
      return NextResponse.json(
        { error: "Only short answer questions can be graded manually" },
        { status: 400 }
      );
    }

    let finalScore = score;
    let finalFeedback = feedback;

    if (useAI) {
      // Use AI to grade
      const prompt = `You are grading a short answer question. 

Question: ${question.question}
${question.context ? `Context: ${question.context}` : ''}

Rubric: ${question.rubric || 'No specific rubric provided. Grade based on correctness and completeness.'}

Student Answer: ${answerDetail.answer}

Please provide:
1. A score from 0 to 1 (where 1 is perfect)
2. Brief feedback explaining the grade

Format your response as JSON:
{
  "score": <number between 0 and 1>,
  "feedback": "<your feedback>"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert educator grading student answers. Be fair but thorough in your evaluation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      finalScore = aiResponse.score;
      finalFeedback = aiResponse.feedback;
    }

    // Update the answer detail
    result.answers[questionIndex] = {
      ...answerDetail.toObject ? answerDetail.toObject() : answerDetail,
      score: finalScore,
      needsReview: false,
      feedback: finalFeedback,
    };

    // Check if all questions are graded
    const allGraded = result.answers.every((a: any) => !a.needsReview);
    
    if (allGraded) {
      // Recalculate total score
      const totalScore = result.answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
      result.score = totalScore;
      result.percentage = totalScore / result.examQuestionCount;
      result.needsGrading = false;
    }

    await result.save();

    return NextResponse.json({
      status: "success",
      message: "Question graded successfully",
      result,
      allGraded,
    });
  } catch (error) {
    console.error("[GRADE_SHORT_ANSWER_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to grade question" },
      { status: 500 }
    );
  }
}

