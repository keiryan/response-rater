import { Run, RunConfig, ResponseRecord, ModelSettings } from "@/lib/types";
import { sendPrompt } from "@/lib/adapters";
import { useProvidersStore } from "@/store/providers";
import { useModelsStore } from "@/store/models";

export interface Job {
  id: string;
  model: ModelSettings;
  loopIndex: number;
  status: "queued" | "in_progress" | "done" | "error" | "canceled";
  abortController?: AbortController;
  retryCount: number;
}

export interface RunEngine {
  startRun: (config: RunConfig) => Promise<Run>;
  cancelRun: () => void;
  retryErrors: () => void;
  getStatus: () => {
    isRunning: boolean;
    completed: number;
    total: number;
    errors: number;
  };
}

export class RunEngineImpl implements RunEngine {
  private currentRun: Run | null = null;
  private jobs: Job[] = [];
  private runningJobs = new Set<string>();
  private concurrency: number;
  private onUpdate?: (run: Run) => void;

  constructor(concurrency: number = 3, onUpdate?: (run: Run) => void) {
    this.concurrency = concurrency;
    this.onUpdate = onUpdate;
  }

  async startRun(config: RunConfig): Promise<Run> {
    // Cancel any existing run
    this.cancelRun();

    const enabledModels = config.selectedModelIds;
    const jobs: Job[] = [];

    // Get models from the store
    const modelsStore = useModelsStore.getState();
    const allModels = modelsStore.models;

    // Create jobs for each model × loop count
    for (const modelId of enabledModels) {
      const model = allModels.find((m) => m.id === modelId);
      if (!model) {
        console.warn(`Model ${modelId} not found`);
        continue;
      }

      for (let i = 0; i < config.loopCount; i++) {
        jobs.push({
          id: `${modelId}-${i}`,
          model,
          loopIndex: i,
          status: "queued",
          retryCount: 0,
        });
      }
    }

    this.jobs = jobs;
    this.runningJobs.clear();

    const run: Run = {
      id: crypto.randomUUID(),
      config,
      responses: [],
      stats: {
        total: jobs.length,
        completed: 0,
        errors: 0,
      },
    };

    this.currentRun = run;
    this.onUpdate?.(run);

    // Start processing jobs
    this.processJobs();

    return run;
  }

  private async processJobs() {
    while (
      this.jobs.some((job) => job.status === "queued") &&
      this.runningJobs.size < this.concurrency
    ) {
      const nextJob = this.jobs.find((job) => job.status === "queued");
      if (!nextJob) break;

      this.runningJobs.add(nextJob.id);
      nextJob.status = "in_progress";
      nextJob.abortController = new AbortController();

      this.executeJob(nextJob);
    }
  }

  private async executeJob(job: Job) {
    if (!this.currentRun) return;

    const providersStore = useProvidersStore.getState();
    const providerSettings = providersStore.getProviderSettings(
      job.model.provider
    );

    if (!providerSettings.apiKey) {
      this.handleJobError(job, "No API key configured for this provider");
      return;
    }

    const responseId = crypto.randomUUID();
    const response: ResponseRecord = {
      id: responseId,
      runId: this.currentRun.id,
      service: job.model.provider,
      modelId: job.model.id,
      modelLabel: job.model.label,
      loopIndex: job.loopIndex,
      status: "in_progress",
      text: "",
      startedAt: new Date().toISOString(),
      retryCount: job.retryCount,
    };

    this.currentRun.responses.push(response);
    this.onUpdate?.(this.currentRun);

    try {
      await sendPrompt(
        job.model.provider,
        {
          model: job.model,
          providerSettings,
          prompt: this.currentRun.config.question,
          systemPrompt: this.currentRun.config.systemPrompt,
          temperature: job.model.temperature,
          maxTokens: job.model.maxTokens,
          abortSignal: job.abortController?.signal,
          transport: providerSettings.transport,
        },
        {
          onStart: () => {
            // Job started
          },
          onChunk: ({ text }) => {
            if (this.currentRun) {
              const resp = this.currentRun.responses.find(
                (r) => r.id === responseId
              );
              if (resp) {
                resp.text += text;
                resp.charCount = resp.text.length;
                this.onUpdate?.(this.currentRun);
              }
            }
          },
          onComplete: (fullText, metadata) => {
            if (this.currentRun) {
              const resp = this.currentRun.responses.find(
                (r) => r.id === responseId
              );
              if (resp) {
                resp.status = "done";
                resp.text = fullText;
                resp.completedAt = new Date().toISOString();
                resp.latencyMs = metadata.latencyMs;
                resp.totalTokens = metadata.totalTokens;
                resp.charCount = fullText.length;
                this.updateRunStats();
                this.onUpdate?.(this.currentRun);
              }
            }
            this.completeJob(job);
          },
          onError: (error) => {
            this.handleJobError(job, error);
          },
        }
      );
    } catch (error) {
      this.handleJobError(
        job,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private handleJobError(job: Job, error: string) {
    if (!this.currentRun) return;

    const response = this.currentRun.responses.find(
      (r) => r.modelId === job.model.id && r.loopIndex === job.loopIndex
    );

    if (response) {
      response.status = "error";
      response.errorMessage = error;
      response.completedAt = new Date().toISOString();
    }

    job.status = "error";
    this.updateRunStats();
    this.onUpdate?.(this.currentRun);
    this.completeJob(job);
  }

  private completeJob(job: Job) {
    this.runningJobs.delete(job.id);
    this.processJobs(); // Start next job if available
  }

  private updateRunStats() {
    if (!this.currentRun) return;

    const responses = this.currentRun.responses;
    this.currentRun.stats = {
      total: responses.length,
      completed: responses.filter((r) => r.status === "done").length,
      errors: responses.filter((r) => r.status === "error").length,
      avgLatencyMs: this.calculateAverageLatency(),
    };
  }

  private calculateAverageLatency(): number | undefined {
    if (!this.currentRun) return undefined;

    const completedResponses = this.currentRun.responses.filter(
      (r) => r.latencyMs !== undefined
    );
    if (completedResponses.length === 0) return undefined;

    const totalLatency = completedResponses.reduce(
      (sum, r) => sum + (r.latencyMs || 0),
      0
    );
    return Math.round(totalLatency / completedResponses.length);
  }

  cancelRun() {
    // Cancel all running jobs
    this.jobs.forEach((job) => {
      if (job.status === "in_progress") {
        job.abortController?.abort();
        job.status = "canceled";
      } else if (job.status === "queued") {
        job.status = "canceled";
      }
    });

    this.runningJobs.clear();
  }

  retryErrors() {
    const errorJobs = this.jobs.filter((job) => job.status === "error");
    errorJobs.forEach((job) => {
      job.status = "queued";
      job.retryCount++;
    });

    this.processJobs();
  }

  getStatus() {
    if (!this.currentRun) {
      return { isRunning: false, completed: 0, total: 0, errors: 0 };
    }

    return {
      isRunning:
        this.runningJobs.size > 0 ||
        this.jobs.some((job) => job.status === "queued"),
      completed: this.currentRun.stats.completed,
      total: this.currentRun.stats.total,
      errors: this.currentRun.stats.errors,
    };
  }
}
