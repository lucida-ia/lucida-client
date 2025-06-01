// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
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

    const file = files[0];
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    let text: string;

    // Handle different file types
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const parsedPdf = await pdfParse(buffer);
      text = parsedPdf.text;
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Por favor, envie um arquivo PDF ou DOCX." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Nenhum texto encontrado no arquivo enviado" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um professor especialista. Retorne as questões em formato JSON com a seguinte estrutura: { questions: [{ type: 'multipleChoice' | 'trueFalse', question: string, options?: string[], correctAnswer: number | boolean }] }. Para questões de múltipla escolha, use options e correctAnswer como número. Para verdadeiro/falso, use correctAnswer como boolean.",
        },
        {
          role: "user",
          content: `Gere ${config.questionCount} questões com base no conteúdo abaixo.
          As questões devem ser de nível ${config.difficulty}.
          ${config.questionTypes.multipleChoice && config.questionTypes.trueFalse ? 'Gere uma mistura de questões de múltipla escolha e verdadeiro/falso.' : 
           config.questionTypes.multipleChoice ? 'Gere apenas questões de múltipla escolha.' : 
           'Gere apenas questões de verdadeiro/falso.'}
          Retorne APENAS o JSON, sem texto adicional:\n\n${text}`,
        },
      ],
    });

    if (!completion.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "Nenhuma questão foi gerada" },
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
        { error: "Formato de questões inválido" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing form data:", error);
    return NextResponse.json(
      { error: "Falha ao processar os dados do formulário" },
      { status: 500 }
    );
  }
}
