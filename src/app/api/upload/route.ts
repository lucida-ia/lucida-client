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
    multipleChoice: boolean;
    trueFalse: boolean;
    shortAnswer: boolean;
    essay: boolean;
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

    const systemPrompt = `Você é um professor especialista em criar avaliações para estudantes brasileiros. Todas as saídas devem estar em Português do Brasil.

Retorne estritamente um objeto JSON válido (sem texto extra) com a estrutura abaixo:

{
  "questions": [
    {
      "id": string,                // identificador único (e.g., "Q1", "Q2")
      "subject": string,           // disciplina ou tópico (e.g., "Matemática", "História")
      "type": "multipleChoice" | "trueFalse",
      "difficulty": "fácil" | "médio" | "difícil",
      "question": string,          // enunciado da questão
      "options"?: string[],        // apenas para múltipla escolha: array com alternativas
      "correctAnswer": number | boolean, // índice (0-based) ou boolean para true/false
      "explanation"?: string       // (opcional) breve justificativa da resposta correta
    }
  ]
}

Regras para construção das questões:
1. **Linguagem e contexto**: 
   - Use Português (Brasil) claro e objetivo.
   - Adeque exemplos e contextos à realidade brasileira (se for o caso).

2. **Quantidade e forma**:
   - Gere exatamente ${config.questionCount} questões.
   - Siga o nível de dificuldade passado em ${config.difficulty} (fácil, médio ou difícil).
   - Se ${config.questionTypes.multipleChoice} e ${config.questionTypes.trueFalse} forem verdadeiros, gere uma mistura coerente entre múltipla escolha e verdadeiro/falso, respeitando proporções razoáveis. 
   - Se for apenas múltipla escolha, todas devem ter 4 alternativas (opções "A", "B", "C" e "D"), com **altamente plausíveis** ("distratores") e apenas uma resposta correta.
   - Se for apenas verdadeiro/falso, gere afirmações que possam gerar dúvida, não óbvias.

3. **Metadados**:
   - \`id\`: um código único sequencial ("Q1", "Q2", etc.).
   - \`subject\`: identifique qual área/conteúdo a questão aborda (por exemplo, "Matemática – Álgebra" ou "Biologia – Citologia").
   - \`difficulty\`: reforce o nível (faça com que a questão esteja de fato adequada ao nível pedido, sem simplificações ou excessos).

4. **Formato JSON estrito**:
   - Não emita texto antes ou depois do JSON.
   - Mantenha todas as aspas e vírgulas perfeitamente formatadas.
   - Não use comentários, nem quebras de linha fora da estrutura JSON padrão.
   - Não inclua anotações, emojis ou explicações extras fora da chave \`explanation\`.

5. **Qualidade pedagógica**:
   - Enunciados claros, sem ambiguidade.
   - Para múltipla escolha, aponte distratores que façam o aluno pensar (não opções obviamente erradas).
   - Para verdadeiro/falso, asserções relevantes ao conteúdo, de modo a testar compreensão, não "achismo".

6. **Exemplo de estrutura interna de uma questão**:
   {
     "id": "Q1",
     "subject": "Química – Tabela Periódica",
     "type": "multipleChoice",
     "difficulty": "médio",
     "question": "Qual elemento é representado pelo símbolo 'Na' na Tabela Periódica?",
     "options": [
       "Nitrogênio", 
       "Nióbio", 
       "Sódio", 
       "Cálcio"
     ],
     "correctAnswer": 2,
     "explanation": "O sódio (Na) pertence ao grupo dos alcalinos. 'Na' vem do latim Natrium."
   }

Comece já a gerar as questões de acordo com essas diretrizes.`;

    const userPrompt = `Gere ${config.questionCount} questões com base no conteúdo abaixo:
${text}

- Nível de dificuldade: ${config.difficulty}.
- Tipos de questões: ${
  config.questionTypes.multipleChoice && config.questionTypes.trueFalse
    ? "mistura de múltipla escolha e verdadeiro/falso"
    : config.questionTypes.multipleChoice
    ? "apenas múltipla escolha"
    : "apenas verdadeiro/falso"
}.

Retorne **APENAS** o JSON seguindo rigorosamente o formato definido.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    if (!completion.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "Nenhuma questão foi gerada" },
        { status: 400 }
      );
    }

    try {
      const questions = JSON.parse(completion.choices[0].message.content);
      
      // Shuffle the questions array if both types are enabled
      if (config.questionTypes.multipleChoice && config.questionTypes.trueFalse) {
        for (let i = questions.questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions.questions[i], questions.questions[j]] = [questions.questions[j], questions.questions[i]];
        }
      }

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
