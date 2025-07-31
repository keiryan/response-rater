"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useUIStore } from "@/store/ui";
import { useModelsStore } from "@/store/models";
import { useRunsStore } from "@/store/runs";
import { RunEngineImpl } from "@/lib/runEngine";
import {
  findSimilarPairs,
  findSimilarityClusters,
} from "@/lib/similarity/text";
import {
  exportRunToCSV,
  downloadCSV,
  exportRunToJSON,
  downloadJSON,
} from "@/lib/csv/export";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Download,
  FileText,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { ExpertResponseUpload } from "@/components/ExpertResponseUpload";
import { ExpertAnalysis } from "@/components/ExpertAnalysis";

export default function HomePage() {
  const [systemPromptExpanded, setSystemPromptExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runEngine, setRunEngine] = useState<RunEngineImpl | null>(null);

  const { concurrency, loopCap, similarityThreshold, setConcurrency } =
    useUIStore();
  const { models } = useModelsStore();
  const { currentRun, setCurrentRun, addToHistory } = useRunsStore();

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleRun = async () => {
    if (!question.trim() || selectedModels.length === 0) return;

    const config = {
      systemPrompt: systemPrompt.trim() || undefined,
      question: question.trim(),
      loopCount: 5, // Default to 5, can be made configurable
      selectedModelIds: selectedModels,
      concurrency,
      createdAt: new Date().toISOString(),
      loopCapAtRunTime: loopCap,
    };

    setIsRunning(true);

    const engine = new RunEngineImpl(concurrency, (run) => {
      setCurrentRun(run);

      // Calculate similarity when run completes
      if (run.stats.completed === run.stats.total && run.stats.total > 0) {
        const pairs = findSimilarPairs(run.responses, similarityThreshold);
        const clusters = findSimilarityClusters(
          run.responses,
          similarityThreshold
        );

        run.similarity = { pairs, clusters };
        setCurrentRun({ ...run });
        addToHistory(run);
      }
    });

    setRunEngine(engine);

    try {
      await engine.startRun(config);
    } catch (error) {
      console.error("Run failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    runEngine?.cancelRun();
    setIsRunning(false);
  };

  const handleRetryErrors = () => {
    runEngine?.retryErrors();
  };

  const handleExportCSV = () => {
    if (!currentRun) return;
    const csv = exportRunToCSV(currentRun);
    downloadCSV(csv, `llm-vetting-run-${currentRun.id}.csv`);
  };

  const handleExportJSON = () => {
    if (!currentRun) return;
    const json = exportRunToJSON(currentRun);
    downloadJSON(json, `llm-vetting-run-${currentRun.id}.json`);
  };

  const getSimilarityCount = (responseId: string) => {
    if (!currentRun?.similarity?.pairs) return 0;
    return currentRun.similarity.pairs[responseId]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">LLM Vetting Sampler</h1>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Run Configuration
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSystemPromptExpanded(!systemPromptExpanded)
                    }
                  >
                    {systemPromptExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    System Prompt
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemPromptExpanded && (
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">
                      System Prompt (Optional)
                    </Label>
                    <Textarea
                      id="system-prompt"
                      placeholder="Enter a system prompt to standardize formatting..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter your vetting question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Concurrency: {concurrency}</Label>
                  <Slider
                    value={[concurrency]}
                    onValueChange={([value]) => setConcurrency(value)}
                    max={6}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Select Models</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={model.id}
                          checked={selectedModels.includes(model.id)}
                          onCheckedChange={() => handleModelToggle(model.id)}
                          disabled={!model.enabled}
                        />
                        <Label
                          htmlFor={model.id}
                          className={`text-sm ${
                            !model.enabled ? "text-muted-foreground" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                            {model.label}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRun}
                    disabled={
                      !question.trim() ||
                      selectedModels.length === 0 ||
                      isRunning
                    }
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                  {isRunning && (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        <Square className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button variant="outline" onClick={handleRetryErrors}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry Errors
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {currentRun && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed: {currentRun.stats.completed}</span>
                      <span>Total: {currentRun.stats.total}</span>
                      <span>Errors: {currentRun.stats.errors}</span>
                    </div>
                    <Progress
                      value={
                        (currentRun.stats.completed / currentRun.stats.total) *
                        100
                      }
                      className="w-full"
                    />
                    {currentRun.stats.avgLatencyMs && (
                      <p className="text-sm text-muted-foreground">
                        Avg Latency: {currentRun.stats.avgLatencyMs}ms
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expert Response Upload */}
            <ExpertResponseUpload />

            {/* Export */}
            {currentRun && currentRun.stats.completed > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleExportCSV}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportJSON}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Results and Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expert Analysis */}
            <ExpertAnalysis />
            
            {/* AI Results */}
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!currentRun || currentRun.responses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>
                      No responses yet. Configure your run and click
                      &quot;Run&quot; to start.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentRun.responses.map((response) => (
                      <Card key={response.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{response.service}</Badge>
                            <Badge variant="secondary">
                              {response.modelLabel}
                            </Badge>
                            <Badge variant="outline">
                              Loop {response.loopIndex + 1}
                            </Badge>
                            {getSimilarityCount(response.id) > 0 && (
                              <Badge variant="destructive">
                                {getSimilarityCount(response.id)} similar
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {response.latencyMs && (
                              <span>{response.latencyMs}ms</span>
                            )}
                            {response.charCount && (
                              <span>{response.charCount} chars</span>
                            )}
                            {response.totalTokens && (
                              <span>{response.totalTokens} tokens</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-2">
                          <Badge
                            variant={
                              response.status === "done"
                                ? "default"
                                : response.status === "error"
                                ? "destructive"
                                : response.status === "in_progress"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {response.status}
                          </Badge>
                        </div>

                        <div className="prose prose-sm max-w-none">
                          {response.status === "error" ? (
                            <p className="text-destructive">
                              {response.errorMessage}
                            </p>
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">
                              {response.text ||
                                (response.status === "in_progress"
                                  ? "Streaming..."
                                  : "")}
                            </pre>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
