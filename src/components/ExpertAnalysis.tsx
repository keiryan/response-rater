"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExpertsStore } from "@/store/experts";
import { useRunsStore } from "@/store/runs";
import { useUIStore } from "@/store/ui";
import { compareExpertToAI } from "@/lib/similarity/text";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export function ExpertAnalysis() {
  const { expertResponses, classifications, setClassification } = useExpertsStore();
  const { currentRun } = useRunsStore();
  const { classificationThresholds } = useUIStore();

  useEffect(() => {
    if (expertResponses.length > 0 && currentRun?.responses && currentRun.responses.length > 0) {
      expertResponses.forEach((expertResponse) => {
        const classification = compareExpertToAI(
          expertResponse,
          currentRun.responses,
          classificationThresholds
        );
        setClassification(expertResponse.id, classification);
      });
    }
  }, [expertResponses, currentRun, classificationThresholds, setClassification]);

  if (expertResponses.length === 0) {
    return null;
  }

  const getClassificationIcon = (classification: "red" | "yellow" | "green") => {
    switch (classification) {
      case "red":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "yellow":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "green":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getClassificationVariant = (classification: "red" | "yellow" | "green") => {
    switch (classification) {
      case "red":
        return "destructive" as const;
      case "yellow":
        return "secondary" as const;
      case "green":
        return "default" as const;
    }
  };

  const getClassificationLabel = (classification: "red" | "yellow" | "green") => {
    switch (classification) {
      case "red":
        return "AI Generated";
      case "yellow":
        return "Potential AI";
      case "green":
        return "Human";
    }
  };

  const stats = expertResponses.reduce(
    (acc, response) => {
      const classification = classifications[response.id];
      if (classification) {
        acc[classification.classification]++;
      }
      return acc;
    },
    { red: 0, yellow: 0, green: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expert Response Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{stats.red}</div>
            <div className="text-sm text-muted-foreground">AI Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.yellow}</div>
            <div className="text-sm text-muted-foreground">Potential AI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.green}</div>
            <div className="text-sm text-muted-foreground">Human</div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {expertResponses.map((response) => {
            const classification = classifications[response.id];
            if (!classification) return null;

            return (
              <Card key={response.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getClassificationIcon(classification.classification)}
                    <Badge variant={getClassificationVariant(classification.classification)}>
                      {getClassificationLabel(classification.classification)}
                    </Badge>
                    {classification.likelyModel && (
                      <Badge variant="outline" className="text-xs">
                        {classification.likelyModel}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(classification.confidence * 100)}% similar
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm bg-muted p-2 rounded">
                    {response.text.substring(0, 200)}
                    {response.text.length > 200 && "..."}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Levenshtein:</span>
                      <div className="font-mono">{(classification.similarityScores.levenshtein * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cosine:</span>
                      <div className="font-mono">{(classification.similarityScores.cosine * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TF-IDF:</span>
                      <div className="font-mono">{(classification.similarityScores.tfIdf * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
