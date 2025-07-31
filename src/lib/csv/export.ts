import { Run } from "@/lib/types";

// Escape CSV field value
function escapeCSVField(field: string): string {
  if (field.includes('"') || field.includes(",") || field.includes("\n")) {
    // Double any existing quotes and wrap in quotes
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Convert run to CSV format
export function exportRunToCSV(run: Run): string {
  const headers = [
    "run_id",
    "run_created_at",
    "system_prompt",
    "question",
    "service",
    "model_id",
    "model_label",
    "loop_index",
    "status",
    "started_at",
    "completed_at",
    "latency_ms",
    "char_count",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "finish_reason",
    "truncated",
    "retry_count",
    "text",
  ];

  const csvRows = [headers.join(",")];

  run.responses.forEach((response) => {
    const row = [
      escapeCSVField(run.id),
      escapeCSVField(run.config.createdAt),
      escapeCSVField(run.config.systemPrompt || ""),
      escapeCSVField(run.config.question),
      escapeCSVField(response.service),
      escapeCSVField(response.modelId),
      escapeCSVField(response.modelLabel),
      response.loopIndex.toString(),
      escapeCSVField(response.status),
      escapeCSVField(response.startedAt || ""),
      escapeCSVField(response.completedAt || ""),
      response.latencyMs?.toString() || "",
      response.charCount?.toString() || "",
      response.inputTokens?.toString() || "",
      response.outputTokens?.toString() || "",
      response.totalTokens?.toString() || "",
      escapeCSVField(response.finishReason || ""),
      response.truncated ? "true" : "false",
      response.retryCount.toString(),
      escapeCSVField(response.text),
    ];

    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export run to JSON
export function exportRunToJSON(run: Run): string {
  return JSON.stringify(run, null, 2);
}

// Download JSON file
export function downloadJSON(jsonContent: string, filename: string) {
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
