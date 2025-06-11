// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ExamConfig {
  title: string;
  description: string;
  questionStyle: "simples" | "enem";
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

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const file = files[0];
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    let text: string;

    // Handle different file types
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const parsedPdf = await pdfParse(buffer);
      text = parsedPdf.text;
    } else if (file.name.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        {
          error:
            "Tipo de arquivo não suportado. Por favor, envie um arquivo PDF ou DOCX.",
        },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Nenhum texto encontrado no arquivo enviado" },
        { status: 400 }
      );
    }

    const simpleSystemPrompt = `Você é um professor especialista em criar avaliações para estudantes brasileiros. Todas as saídas devem estar em Português do Brasil.

Retorne estritamente um objeto JSON válido (sem texto extra) com a estrutura abaixo:

{
  "questions": [
    {
      "id": string,                // identificador único (e.g., "Q1", "Q2")
      "subject": string,           // disciplina ou tópico (e.g., "Matemática", "História")
      "type": "multipleChoice" | "trueFalse",
      "difficulty": "fácil" | "médio" | "difícil",
      "context"?: string,         // (opcional) Texto base, cenário, etc.
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

    const enemSystemPrompt = `Você é um especialista em elaborar questões no estilo do ENEM (Exame Nacional do Ensino Médio) para estudantes brasileiros. Suas questões devem ser interdisciplinares, contextualizadas e exigir habilidades de interpretação e raciocínio crítico.

Retorne estritamente um objeto JSON válido (sem texto extra) com a estrutura abaixo:

{
  "questions": [
    {
      "id": string,
      "subject": string,
      "type": "multipleChoice", // ENEM é predominantemente múltipla escolha
      "difficulty": "fácil" | "médio" | "difícil",
      "context": string,         // Texto base, cenário, gráfico, etc.
      "question": string,
      "options": string[],
      "correctAnswer": number,
      "explanation": string
    }
  ]
}

Regras para construção das questões (Estilo ENEM):
1.  **Contextualização Narrativa e Situacional**: A base de toda questão é o seu contexto. Crie um texto-base (campo 'context') que apresente uma **narrativa curta, uma história ou uma situação-problema do mundo real**. O objetivo é engajar o aluno através de um cenário prático e interessante (ex: um desafio de engenharia, um problema financeiro, um dilema social, um fato histórico curioso). O texto deve ser rico e fornecer os dados necessários para resolver a questão.
2.  **Enunciado Conectado**: O enunciado (campo 'question') não deve ser uma simples pergunta sobre o texto-base. Ele deve criar uma ponte entre o contexto apresentado e o conhecimento mais amplo do conteúdo fornecido. A pergunta deve exigir que o aluno utilize o conteúdo para analisar, interpretar ou resolver o problema do texto-base.
3.  **Alternativas Plausíveis**: Crie 5 alternativas (A, B, C, D, E). Todas devem ser plausíveis e relacionadas ao tema. Os distratores (alternativas incorretas) devem ser cuidadosamente elaborados para representar erros comuns de raciocínio ou interpretações parciais do texto.
4.  **Interdisciplinaridade**: Sempre que possível, relacione o conteúdo com outras áreas do conhecimento para refletir a natureza do ENEM.
5.  **Rigor e Qualidade**: Gere exatamente ${config.questionCount} questões, adaptando a complexidade do texto, do raciocínio exigido e dos distratores ao nível de dificuldade (${config.difficulty}). A questão deve ser desafiadora e avaliar o pensamento crítico.
6.  **Metadados**: Preencha 'id', 'subject', 'type' (sempre 'multipleChoice' para ENEM), e 'difficulty'.
7.  **Formato JSON Estrito**: Siga o formato JSON à risca, sem comentários ou texto adicional.

Exemplo 1 (Ciências da Natureza):
{
  "id": "Q1",
  "subject": "Biologia - Virologia e Saúde",
  "type": "multipleChoice",
  "difficulty": "difícil",
  "context": "A agência norte-americana que regula medicamentos (FDA) aprovou um fármaco cujo uso contínuo reduz o risco de infecção do vírus HIV. Esse fármaco surge como profilaxia medicamentosa aos grupos de alto risco, uma vez que age na célula infectada inibindo a ação da enzima transcriptase reversa. Contudo, a camisinha ainda é o método mais seguro, barato e eficaz na prevenção de doenças como a aids, com taxas de aproximadamente 100% de proteção. (Fonte: SEGATTO, C. Época, n. 740, jul. 2012, adaptado).",
  "question": "O bloqueio dessa enzima contribui para o controle da doença, pois:",
  "options": [
    "inibe a transcrição do DNA viral, o que impede a formação de moléculas de RNA celular.",
    "impede a transformação do RNA viral em uma fita dupla de DNA, que se integra ao DNA celular.",
    "evita a duplicação do RNA viral, que levaria à formação de proteínas virais defeituosas.",
    "dificulta a duplicação do DNA da célula hospedeira, com a formação de novas fitas virais.",
    "controla a formação de moléculas de RNA transportador, que bloqueiam a síntese de novos vírus."
  ],
  "correctAnswer": 1,
  "explanation": "O HIV é um retrovírus que usa a enzima transcriptase reversa para converter seu RNA em DNA. Esse DNA viral então se integra ao genoma da célula hospedeira. O fármaco inibe essa enzima, impedindo a formação do DNA viral a partir do RNA viral, interrompendo o ciclo de vida do vírus. A alternativa B descreve corretamente este processo."
}

Exemplo 2 (Matemática e Suas Tecnologias):
{
  "id": "Q2",
  "subject": "Matemática - Otimização e Funções",
  "type": "multipleChoice",
  "difficulty": "médio",
  "context": "Um fazendeiro pretende construir um galinheiro ocupando uma região plana de formato retangular, com lados de comprimentos L e C metros. Os lados serão cercados por telas de tipos diferentes. Nos lados de comprimento L, será utilizada uma tela cujo metro linear custa R$ 20,00, enquanto, nos outros dois lados de comprimento C, uma que custa R$ 15,00. O fazendeiro quer gastar, no máximo, R$ 6.000,00 na compra de toda a tela e deseja que o galinheiro tenha a maior área possível.",
  "question": "Qual será a medida, em metro, do maior lado do galinheiro que maximiza a área, respeitando o orçamento?",
  "options": [
    "75",
    "100",
    "150",
    "200",
    "300"
  ],
  "correctAnswer": 1,
  "explanation": "O custo total é Custo = 2*L*20 + 2*C*15 = 40L + 30C. Com o orçamento máximo, 40L + 30C = 6000. A área é A = L*C. Isolando C, temos C = (6000 - 40L)/30 = 200 - (4/3)L. A área como função de L é A(L) = L * (200 - (4/3)L) = 200L - (4/3)L^2. Esta é uma parábola com concavidade para baixo, e seu valor máximo ocorre no vértice. O L do vértice é L = -b/(2a) = -200 / (2 * -4/3) = 75 metros. Com L=75, C = 200 - (4/3)*75 = 100 metros. Os lados são 75m e 100m. O maior lado é 100m."
}

Comece a gerar as questões.`;

    const systemPrompt =
      config.questionStyle === "enem" ? enemSystemPrompt : simpleSystemPrompt;

    const userPrompt = `Gere ${
      config.questionCount
    } questões com base no conteúdo abaixo:
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
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
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

      // Shuffle the questions array if both types are enabled
      if (
        config.questionTypes.multipleChoice &&
        config.questionTypes.trueFalse
      ) {
        for (let i = questions.questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions.questions[i], questions.questions[j]] = [
            questions.questions[j],
            questions.questions[i],
          ];
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
