/**
 * Parse a CSV string into rows of trimmed strings.
 * Handles UTF-8 BOM and quoted fields (double quote escape).
 */
export function parseCSV(text: string): string[][] {
  const BOM = "\uFEFF";
  const normalized = text.startsWith(BOM) ? text.slice(BOM.length) : text;
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rows: string[][] = [];
  for (const line of lines) {
    rows.push(parseCSVLine(line));
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalize header key: lowercase, trim.
 */
export function normalizeHeader(h: string): string {
  return h.toLowerCase().trim();
}

/**
 * Find required column from row of headers.
 * Supports "aluno" or "nome" for name, and "turma" for class.
 */
export function mapStudentHeaders(headers: string[]): {
  nameIndex: number;
  turmaIndex: number;
  extra: Record<string, number>;
} {
  const normalized = headers.map(normalizeHeader);
  const nameIndex = normalized.findIndex((h) => h === "aluno" || h === "nome");
  const turmaIndex = normalized.findIndex((h) => h === "turma");
  if (nameIndex === -1 || turmaIndex === -1) {
    throw new Error(
      nameIndex === -1 && turmaIndex === -1
        ? "Colunas obrigatórias: 'aluno' (ou 'nome') e 'turma'"
        : nameIndex === -1
        ? "Coluna obrigatória: 'aluno' ou 'nome'"
        : "Coluna obrigatória: 'turma'"
    );
  }
  const extra: Record<string, number> = {};
  normalized.forEach((h, i) => {
    if (i !== nameIndex && i !== turmaIndex) extra[h] = i;
  });
  return { nameIndex, turmaIndex, extra };
}
