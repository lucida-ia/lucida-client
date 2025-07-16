export interface ExamResult {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  score: number;
  examTitle: string;
  examQuestionCount: number;
  percentage: number;
  createdAt: Date;
}

export const exportResultsToCSV = (
  results: ExamResult[],
  filename: string = "resultados_prova"
) => {
  try {
    // Define CSV headers
    const headers = [
      "Email do Aluno",
      "Título da Prova", 
      "Nota",
      "Total de Questões",
      "Percentual (%)",
      "Data da Prova"
    ];

    // Convert results to CSV rows
    const csvRows = results.map(result => [
      result.email,
      result.examTitle,
      result.score.toString(),
      result.examQuestionCount.toString(),
      (result.percentage * 100).toFixed(2),
      new Date(result.createdAt).toLocaleDateString('pt-BR')
    ]);

    // Combine headers and data
    const allRows = [headers, ...csvRows];

    // Convert to CSV string
    const csvContent = allRows
      .map(row => 
        row.map(field => 
          // Escape quotes and wrap in quotes if field contains comma, quote, or newline
          field.includes(',') || field.includes('"') || field.includes('\n')
            ? `"${field.replace(/"/g, '""')}"`
            : field
        ).join(',')
      )
      .join('\n');

    // Add BOM for UTF-8 encoding to support accented characters
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Create blob and download
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
}; 