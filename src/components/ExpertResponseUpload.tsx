"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useExpertsStore } from "@/store/experts";
import { parseExpertResponsesCSV } from "@/lib/csv/import";
import { FileText, Trash2 } from "lucide-react";

export function ExpertResponseUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { expertResponses, setExpertResponses, clearExpertResponses } = useExpertsStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const text = await file.text();
      const responses = parseExpertResponsesCSV(text);
      setExpertResponses(responses);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to parse CSV file");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Expert Responses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-upload">Upload CSV File</Label>
          <div className="flex gap-2">
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {expertResponses.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearExpertResponses}
                title="Clear expert responses"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            CSV should contain a column with &quot;response&quot;, &quot;text&quot;, or &quot;answer&quot; in the header.
          </p>
        </div>

        {uploadError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        )}

        {expertResponses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Loaded Responses</span>
              <Badge variant="secondary">{expertResponses.length} responses</Badge>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {expertResponses.slice(0, 3).map((response) => (
                <div key={response.id} className="text-xs p-2 bg-muted rounded">
                  {response.text.substring(0, 100)}...
                </div>
              ))}
              {expertResponses.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  ...and {expertResponses.length - 3} more responses
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
