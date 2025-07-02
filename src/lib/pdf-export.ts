import jsPDF from "jspdf";
import { DBExam } from "@/types/exam";

export const exportExamToPDF = async (
  exam: DBExam,
  includeAnswers: boolean = false
) => {
  try {
    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Margins and layout
    const margin = 18;
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = pageHeight - (2 * margin);
    
    // Font settings (smaller for more content)
    const titleFontSize = 13;
    const subtitleFontSize = 9;
    const normalFontSize = 8;
    const smallFontSize = 7;
    const questionFontSize = 8;
    const optionFontSize = 8;
    const answerFontSize = 8;
    const black = [0, 0, 0];
    
    let currentY = margin;
    let currentPage = 1;

    // Function to add footer
    const addFooter = (pageNum: number) => {
      pdf.setFontSize(smallFontSize);
      pdf.setTextColor(black[0], black[1], black[2]);
      const footerText = `${exam.title} - Página ${pageNum}`;
      const textWidth = pdf.getTextWidth(footerText);
      const x = pageWidth - textWidth - margin;
      const y = pageHeight - 10;
      pdf.text(footerText, x, y);
    };

    // Function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (currentY + requiredHeight > contentHeight) {
        addFooter(currentPage);
        pdf.addPage();
        currentPage++;
        currentY = margin;
        return true;
      }
      return false;
    };

    // Function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(black[0], black[1], black[2]);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.4;
      const totalHeight = lines.length * lineHeight;
      checkNewPage(totalHeight);
      pdf.text(lines, margin, currentY);
      currentY += totalHeight + 1.5; // Tighter spacing
    };

    // Function to add a horizontal line
    const addHorizontalLine = () => {
      checkNewPage(3);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 3;
    };

    // Add title
    addWrappedText(exam.title, titleFontSize, true);
    currentY += 2;
    
    // Add description if exists
    if (exam.description) {
      addWrappedText(exam.description, subtitleFontSize);
      currentY += 2;
    }

    // Add separator line
    addHorizontalLine();

    // Add student info section
    addWrappedText("INFORMAÇÕES DO ALUNO", subtitleFontSize, true);
    currentY += 2;
    [
      "Nome: _________________________________________________________________",
      "Data: _______________________         Turma: __________________________",
    ].forEach(field => addWrappedText(field, normalFontSize));
    currentY += 5;

    // Add instructions
    addWrappedText("INSTRUÇÕES: Leia atentamente cada questão e marque apenas uma alternativa por questão.", smallFontSize, true);
    currentY += 2;
    addHorizontalLine();
    currentY += 2;
    addWrappedText("QUESTÕES", subtitleFontSize, true);
    currentY += 2;

    // Add questions
    exam.questions.forEach((question, index) => {
      const questionNumber = `${index + 1}.`;
      let questionText = question.context 
        ? `${question.context}\n\n${question.question}`
        : question.question;
      pdf.setFontSize(questionFontSize);
      const questionLines = pdf.splitTextToSize(questionText, contentWidth);
      const questionHeight = questionLines.length * (questionFontSize * 0.4);
      // Calculate options height
      let optionsHeight = 0;
      let optionsLines = [];
      if (question.options && question.options.length > 0) {
        optionsLines = question.options.map((option, optionIndex) => {
          const optionLetter = String.fromCharCode(65 + optionIndex);
          return pdf.splitTextToSize(`   ${optionLetter}) ${option}`, contentWidth);
        });
        optionsHeight = optionsLines.reduce((sum, lines) => sum + lines.length * (optionFontSize * 0.4), 0);
      } else {
        optionsLines = [pdf.splitTextToSize("   ( ) Verdadeiro", contentWidth), pdf.splitTextToSize("   ( ) Falso", contentWidth)];
        optionsHeight = 2 * (optionFontSize * 0.4);
      }
      // Calculate answer height if including answers
      let answerHeight = 0;
      if (includeAnswers) {
        answerHeight = answerFontSize * 0.4 + 2;
      }
      // Calculate total height needed for this question block
      const totalQuestionHeight = questionHeight + optionsHeight + answerHeight + 4;
      // If not enough space for the whole block, break page first
      checkNewPage(totalQuestionHeight);
      // Add question number and text
      addWrappedText(`${questionNumber} ${questionText}`, questionFontSize, true);
      // Add options (all black)
      if (question.options && question.options.length > 0) {
        question.options.forEach((option, optionIndex) => {
          const optionLetter = String.fromCharCode(65 + optionIndex);
          addWrappedText(`   ${optionLetter}) ${option}`, optionFontSize);
        });
      } else {
        addWrappedText("   ( ) Verdadeiro", optionFontSize);
        addWrappedText("   ( ) Falso", optionFontSize);
      }
      // Add answer if including answers
      if (includeAnswers) {
        const correctAnswer = question.options
          ? question.options[question.correctAnswer]
          : question.correctAnswer
          ? "Verdadeiro"
          : "Falso";
        addWrappedText(`Resposta: ${correctAnswer}`, answerFontSize, true);
      }
      currentY += 2; // Tighter spacing between questions
    });

    // Add footer to last page
    addFooter(currentPage);

    // Save the PDF
    const fileName = includeAnswers
      ? `${exam.title}_gabarito.pdf`
      : `${exam.title}_prova.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};
