"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useProvidersStore } from "@/store/providers";
import { useModelsStore } from "@/store/models";
import { useUIStore } from "@/store/ui";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [newModel, setNewModel] = useState({
    id: "",
    label: "",
    provider: "openai" as "openai" | "anthropic" | "deepseek",
    temperature: 0.7,
    maxTokens: 4096,
  });

  const { providers, setProviderSettings } = useProvidersStore();
  const { models, addModel, deleteModel, toggleModel } = useModelsStore();
  const { loopCap, similarityThreshold, classificationThresholds, setLoopCap, setSimilarityThreshold, setClassificationThresholds } =
    useUIStore();

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleAddModel = () => {
    if (!newModel.id || !newModel.label) return;

    addModel({
      ...newModel,
      enabled: false,
    });

    setNewModel({
      id: "",
      label: "",
      provider: "openai",
      temperature: 0.7,
      maxTokens: 4096,
    });
  };

  const handleDeleteModel = (id: string) => {
    if (confirm("Are you sure you want to delete this model?")) {
      deleteModel(id);
    }
  };

  const providerNames = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    deepseek: "DeepSeek",
    openai_compatible: "OpenAI Compatible",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Providers */}
          <Card>
            <CardHeader>
              <CardTitle>API Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(providers).map(([provider, settings]) => (
                <div key={provider} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {providerNames[provider as keyof typeof providerNames]}
                    </h3>
                    <Badge variant={settings.apiKey ? "default" : "secondary"}>
                      {settings.apiKey ? "Configured" : "Not configured"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${provider}-key`}>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${provider}-key`}
                        type={showKeys[provider] ? "text" : "password"}
                        value={settings.apiKey}
                        onChange={(e) =>
                          setProviderSettings(
                            provider as keyof typeof providers,
                            { apiKey: e.target.value }
                          )
                        }
                        placeholder="Enter your API key"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleKeyVisibility(provider)}
                      >
                        {showKeys[provider] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Transport</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.transport === "relay"}
                        onCheckedChange={(checked) =>
                          setProviderSettings(
                            provider as keyof typeof providers,
                            {
                              transport: checked ? "relay" : "direct",
                            }
                          )
                        }
                      />
                      <Label className="text-sm">
                        Use Relay (for CORS issues)
                      </Label>
                    </div>
                  </div>

                  {provider === "openai_compatible" && (
                    <div className="space-y-2">
                      <Label htmlFor={`${provider}-url`}>Base URL</Label>
                      <Input
                        id={`${provider}-url`}
                        value={settings.baseUrl || ""}
                        onChange={(e) =>
                          setProviderSettings(
                            provider as keyof typeof providers,
                            { baseUrl: e.target.value }
                          )
                        }
                        placeholder="https://api.example.com"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Models */}
          <Card>
            <CardHeader>
              <CardTitle>Models</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Model */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Add New Model</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="new-model-id">Model ID</Label>
                    <Input
                      id="new-model-id"
                      value={newModel.id}
                      onChange={(e) =>
                        setNewModel((prev) => ({ ...prev, id: e.target.value }))
                      }
                      placeholder="gpt-4o-mini"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-model-label">Label</Label>
                    <Input
                      id="new-model-label"
                      value={newModel.label}
                      onChange={(e) =>
                        setNewModel((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                      placeholder="GPT-4o Mini"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="new-model-provider">Provider</Label>
                    <select
                      id="new-model-provider"
                      value={newModel.provider}
                      onChange={(e) =>
                        setNewModel((prev) => ({
                          ...prev,
                          provider: e.target.value as
                            | "openai"
                            | "anthropic"
                            | "deepseek",
                        }))
                      }
                      className="w-full p-2 border rounded"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="new-model-temp">Temperature</Label>
                    <Input
                      id="new-model-temp"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={newModel.temperature}
                      onChange={(e) =>
                        setNewModel((prev) => ({
                          ...prev,
                          temperature: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-model-tokens">Max Tokens</Label>
                    <Input
                      id="new-model-tokens"
                      type="number"
                      value={newModel.maxTokens}
                      onChange={(e) =>
                        setNewModel((prev) => ({
                          ...prev,
                          maxTokens: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAddModel} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
              </div>

              {/* Model List */}
              <div className="space-y-2">
                <h3 className="font-semibold">Configured Models</h3>
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <div>
                        <div className="font-medium">{model.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.id} • {providerNames[model.provider]}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteModel(model.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loop-cap">Loop Cap (Max per model)</Label>
                  <Input
                    id="loop-cap"
                    type="number"
                    min="1"
                    max="20"
                    value={loopCap}
                    onChange={(e) => setLoopCap(parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of responses to generate per model per run.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="similarity-threshold">
                    Similarity Threshold
                  </Label>
                  <Input
                    id="similarity-threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={similarityThreshold}
                    onChange={(e) =>
                      setSimilarityThreshold(parseFloat(e.target.value))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Threshold for detecting similar responses (0.0 - 1.0).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="red-threshold">
                    AI Detection Threshold (Red)
                  </Label>
                  <Input
                    id="red-threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={classificationThresholds.red}
                    onChange={(e) =>
                      setClassificationThresholds({
                        ...classificationThresholds,
                        red: parseFloat(e.target.value)
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Responses above this threshold are classified as AI-generated (red).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yellow-threshold">
                    Potential AI Threshold (Yellow)
                  </Label>
                  <Input
                    id="yellow-threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={classificationThresholds.yellow}
                    onChange={(e) =>
                      setClassificationThresholds({
                        ...classificationThresholds,
                        yellow: parseFloat(e.target.value)
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Responses above this threshold are flagged as potential AI (yellow).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
