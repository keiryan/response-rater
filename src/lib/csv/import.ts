import { ExpertResponse } from "@/lib/types";

export function parseExpertResponsesCSV(csvContent: string): ExpertResponse[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const textColumnIndex = headers.findIndex(h => 
    h.toLowerCase().includes('response') || 
    h.toLowerCase().includes('text') || 
    h.toLowerCase().includes('answer')
  );
  
  if (textColumnIndex === -1) {
    throw new Error('CSV must contain a column with "response", "text", or "answer" in the header');
  }
  
  const expertResponses: ExpertResponse[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length > textColumnIndex && values[textColumnIndex].trim()) {
      const metadata: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        if (index !== textColumnIndex && values[index]) {
          metadata[header] = values[index];
        }
      });
      
      expertResponses.push({
        id: crypto.randomUUID(),
        text: values[textColumnIndex].trim(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
    }
  }
  
  return expertResponses;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
