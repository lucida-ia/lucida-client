import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";
import { DBExam } from "@/types/exam";

export const exportSimplifiedGabarito = async (exam: DBExam) => {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: `GABARITO - ${exam.title}`,
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Horizontal line
            new Paragraph({
              children: [new TextRun("")],
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: { after: 300 },
            }),

            // Answer key
            ...exam.questions.map((question, index) => {
              let correctAnswerLetter: string;
              
              if (question.options && question.options.length > 0) {
                // Multiple choice question
                correctAnswerLetter = String.fromCharCode(65 + question.correctAnswer);
              } else {
                // True/False question
                correctAnswerLetter = question.correctAnswer ? "V" : "F";
              }

              return new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}) ${correctAnswerLetter}`,
                    size: 20,
                  }),
                ],
                spacing: { after: 150 },
              });
            }),
          ],
        },
      ],
    });

    // Generate and download the document
    const buffer = await Packer.toBuffer(doc);
    
    // Create blob and download
    const blob = new Blob([buffer], { 
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.title}_gabarito_simples.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting simplified gabarito:", error);
    throw error;
  }
};

export const exportExamToWord = async (
  exam: DBExam,
  includeAnswers: boolean = false
) => {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: exam.title,
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Description (if exists)
            ...(exam.description ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: exam.description,
                    size: 20,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            ] : []),

            // Horizontal line (using border)
            new Paragraph({
              children: [new TextRun("")],
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: { after: 300 },
            }),

            // Student info section
            new Paragraph({
              children: [
                new TextRun({
                  text: "INFORMAÇÕES DO ALUNO",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Nome: _________________________________________________________________",
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Data: _______________________         Turma: __________________________",
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Instructions
            new Paragraph({
              children: [
                new TextRun({
                  text: "INSTRUÇÕES: Leia atentamente cada questão e marque apenas uma alternativa por questão.",
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Another horizontal line
            new Paragraph({
              children: [new TextRun("")],
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6,
                },
              },
              spacing: { after: 200 },
            }),

            // Questions section title
            new Paragraph({
              children: [
                new TextRun({
                  text: "QUESTÕES",
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Questions
            ...exam.questions.flatMap((question, index) => {
              const questionParagraphs = [];
              
              // Question number and text
              const questionText = question.context 
                ? `${question.context}\n\n${question.question}`
                : question.question;

              questionParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. `,
                      bold: true,
                      size: 20,
                    }),
                    new TextRun({
                      text: questionText,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 200 },
                })
              );

              // Options
              if (question.options && question.options.length > 0) {
                question.options.forEach((option, optionIndex) => {
                  const optionLetter = String.fromCharCode(65 + optionIndex);
                  questionParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `   ${optionLetter}) ${option}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    })
                  );
                });
              } else {
                // True/False question
                questionParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "   ( ) Verdadeiro",
                        size: 18,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "   ( ) Falso",
                        size: 18,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
              }

              // Add answer if including answers
              if (includeAnswers) {
                const correctAnswer = question.options
                  ? question.options[question.correctAnswer]
                  : question.correctAnswer
                  ? "Verdadeiro"
                  : "Falso";
                
                questionParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Resposta: ${correctAnswer}`,
                        bold: true,
                        size: 18,
                        color: "0066CC",
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                );
              }

              // Add spacing between questions
              questionParagraphs.push(
                new Paragraph({
                  children: [new TextRun("")],
                  spacing: { after: 300 },
                })
              );

              return questionParagraphs;
            }),
          ],
        },
      ],
    });

    // Generate and download the document
    const buffer = await Packer.toBuffer(doc);
    
    // Create blob and download
    const blob = new Blob([buffer], { 
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    const fileName = includeAnswers
      ? `${exam.title}_gabarito.docx`
      : `${exam.title}_prova.docx`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to Word:", error);
    throw error;
  }
}; 