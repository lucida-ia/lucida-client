// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ExamConfig {
  title: string;
  description: string;
  questionCount: number;
  questionTypes: {
    multipleChoice: true;
    trueFalse: true;
    shortAnswer: false;
    essay: false;
  };
  difficulty: string;
  timeLimit: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const config = JSON.parse(formData.get("config") as string) as ExamConfig;

    console.log(config);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const fileBuffer = await files[0].arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const parsedPdf = await pdfParse(buffer);
    const text = parsedPdf.text;

    if (!text) {
      return NextResponse.json(
        { error: "No text found in the uploaded file" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um professor especialista. Retorne as questões em formato JSON com a seguinte estrutura: { questions: [{ question: string, options: string[], correctAnswer: number }] }",
        },
        {
          role: "user",
          content: `Gere ${config.questionCount} questões de múltipla escolha com base no conteúdo abaixo.
          As questões devem ser de nível ${config.difficulty}.
          Retorne APENAS o JSON, sem texto adicional:\n\n${text}`,
        },
      ],
    });

    if (!completion.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "No questions generated" },
        { status: 400 }
      );
    }

    try {
      const questions = JSON.parse(completion.choices[0].message.content);
      return NextResponse.json({
        questions: questions.questions,
        config: config,
      });
    } catch (error) {
      console.error("Error parsing questions JSON:", error);
      return NextResponse.json(
        { error: "Invalid questions format" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing form data:", error);
    return NextResponse.json(
      { error: "Failed to process form data" },
      { status: 500 }
    );
  }
}
