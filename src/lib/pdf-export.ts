import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DBExam } from "@/types/exam";

export const exportExamToPDF = async (
  exam: DBExam,
  includeAnswers: boolean = false
) => {
  try {
    // Create a temporary container for the PDF content
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "800px";
    container.style.padding = "40px";
    container.style.backgroundColor = "white";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "12px";
    container.style.lineHeight = "1.5";
    container.style.color = "black";

    // Add exam header
    const header = document.createElement("div");
    header.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px; font-size: 24px; font-weight: bold;">
        ${exam.title}
      </h1>
      ${
        exam.description
          ? `<p style="text-align: center; margin-bottom: 30px; font-style: italic;">${exam.description}</p>`
          : ""
      }
      <div style="border-bottom: 2px solid #333; margin-bottom: 30px;"></div>
    `;
    container.appendChild(header);

    // Add student info section
    const studentInfo = document.createElement("div");
    studentInfo.innerHTML = `
      <div style="margin-bottom: 30px;">
        <p><strong>Nome:</strong> _______________________________________________________</p>
        <p><strong>Data:</strong> _______________________________________________________</p>
        <p><strong>Turma:</strong> _______________________________________________________</p>
      </div>
    `;
    container.appendChild(studentInfo);

    // Add questions
    exam.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.style.marginBottom = "25px";
      questionDiv.style.pageBreakInside = "avoid";
      questionDiv.style.pageBreakAfter = "always";

      let questionContent = `<p style="font-weight: bold; margin-bottom: 10px;"><strong>${
        index + 1
      }.</strong> `;

      if (question.context) {
        questionContent += `${question.context}<br><br>${question.question}`;
      } else {
        questionContent += question.question;
      }

      questionContent += "</p>";

      if (question.options && question.options.length > 0) {
        questionContent += '<div style="margin-left: 20px;">';
        question.options.forEach((option, optionIndex) => {
          const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D...
          questionContent += `<p style="margin: 5px 0;">${optionLetter}) ${option}</p>`;
        });
        questionContent += "</div>";
      } else {
        // If no options, assume it's a true/false question
        questionContent += '<div style="margin-left: 20px;">';
        questionContent += '<p style="margin: 5px 0;">( ) Verdadeiro</p>';
        questionContent += '<p style="margin: 5px 0;">( ) Falso</p>';
        questionContent += "</div>";
      }

      if (includeAnswers) {
        const correctAnswer = question.options
          ? question.options[question.correctAnswer]
          : question.correctAnswer
          ? "Verdadeiro"
          : "Falso";
        questionContent += `<p style="margin-top: 10px; color: #2563eb; font-weight: bold;">Resposta: ${correctAnswer}</p>`;
      }

      questionDiv.innerHTML = questionContent;
      container.appendChild(questionDiv);
    });

    // Add to document temporarily
    document.body.appendChild(container);

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: container.scrollHeight,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const footerHeight = 15; // Space reserved for footer
    const availableHeight = pageHeight - footerHeight; // Available space for content

    // Function to add footer to a page
    const addFooter = (pdfDoc: jsPDF) => {
      // Save current state
      pdfDoc.saveGraphicsState();

      // Set font for footer
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(100, 100, 100); // Gray color

      // Add footer text at bottom right
      const footerText = exam.title;
      const textWidth = pdfDoc.getTextWidth(footerText);
      const x = pageWidth - textWidth - 10; // 10mm from right edge
      const y = pageHeight - 10; // 10mm from bottom

      pdfDoc.text(footerText, x, y);

      // Restore state
      pdfDoc.restoreGraphicsState();
    };

    // Calculate dimensions
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    addFooter(pdf);
    heightLeft -= availableHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      addFooter(pdf);
      heightLeft -= availableHeight;
    }

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
