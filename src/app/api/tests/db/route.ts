import { connectToDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: "success",
      message: "Connected to MongoDB",
      clusters: mongoose.connection.db.admin().listDatabases(),
      db: db.databaseName,
      collections: collections.map((col) => col.name),
    });
  } catch (error) {
    console.error("[MONGO ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to connect to MongoDB" },
      { status: 500 }
    );
  }
}
