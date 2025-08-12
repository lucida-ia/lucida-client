import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { auth } from "@clerk/nextjs/server";

import { NextRequest, NextResponse } from "next/server";
import { Class } from "@/models/Class";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    await connectToDB();

    const { name } = await request.json();

    const newClass = await Class.create({
      name,
      userId,
    });

    return NextResponse.json({
      status: "success",
      message: "Successfully created class",
      data: newClass,
    });
  } catch (error) {
    console.error("[CLASS_CREATE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to create class",
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

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
      await requester.save();
    }
    const isAdmin = requester.subscription?.plan === "admin";
    const targetUserId = isAdmin && asUser ? asUser : requester.id;

    const classes = await Class.find({ userId: targetUserId });

    const results = await Result.find({
      classId: { $in: classes.map((c) => c._id) },
    });

    const payload = classes.map((c) => ({
      name: c.name,
      description: c.description || "",
      id: c._id,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      results: results.filter((r) => r.classId === c.id),
    }));

    return NextResponse.json({
      status: "success",
      message: "Successfully fetched classes",
      data: payload,
    });
  } catch (error) {
    console.error("[CLASS_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get classes",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    await connectToDB();

    const { id, name, description } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          status: "error",
          message: "Nome da turma é obrigatório",
        },
        { status: 400 }
      );
    }

    // Check if class exists and belongs to user
    const existingClass = await Class.findOne({ _id: id, userId });
    if (!existingClass) {
      return NextResponse.json(
        {
          status: "error",
          message: "Turma não encontrada",
        },
        { status: 404 }
      );
    }

    // Update the class
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        updatedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      status: "success",
      message: "Turma atualizada com sucesso",
      data: updatedClass,
    });
  } catch (error) {
    console.error("[CLASS_UPDATE_ERROR]", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Falha ao atualizar turma",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    await connectToDB();

    const { id } = await request.json();

    // Delete related results first (they reference both examId and classId)
    await Result.deleteMany({ classId: id });

    // Delete related exams
    await Exam.deleteMany({ classId: id });

    // Finally delete the class
    await Class.findByIdAndDelete(id);

    return NextResponse.json({
      status: "success",
      message: "Successfully deleted class and all related data",
    });
  } catch (error) {
    console.error("[CLASS_DELETE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to delete class",
    });
  }
}
