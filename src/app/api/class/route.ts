import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
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

    const classes = await Class.find({ userId });

    return NextResponse.json({
      status: "success",
      message: "Successfully fetched classes",
      data: classes,
    });
  } catch (error) {
    console.error("[CLASS_GET_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to get classes",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    await connectToDB();

    const { id } = await request.json();

    await Class.findByIdAndDelete(id);

    return NextResponse.json({
      status: "success",
      message: "Successfully deleted class",
    });
  } catch (error) {
    console.error("[CLASS_DELETE_ERROR]", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to delete class",
    });
  }
}
