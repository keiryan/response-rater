import { ResponseRecord, ResponseClassification } from "@/lib/types";

// Simple tokenization function
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

// Calculate TF-IDF vectors
function calculateTFIDF(texts: string[]): {
  vectors: number[][];
  vocabulary: string[];
} {
  const documents = texts.map(tokenize);
  const vocabulary = new Set<string>();

  // Build vocabulary
  documents.forEach((doc) => {
    doc.forEach((token) => vocabulary.add(token));
  });

  const vocabArray = Array.from(vocabulary);
  const vectors: number[][] = [];

  // Calculate TF-IDF for each document
  documents.forEach((doc) => {
    const vector = new Array(vocabArray.length).fill(0);

    // Calculate term frequency
    doc.forEach((token) => {
      const index = vocabArray.indexOf(token);
      if (index !== -1) {
        vector[index]++;
      }
    });

    // Normalize by document length
    const docLength = doc.length;
    if (docLength > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / docLength;
      }
    }

    vectors.push(vector);
  });

  return { vectors, vocabulary: vocabArray };
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// Find similar pairs above threshold
export function findSimilarPairs(
  responses: ResponseRecord[],
  threshold: number = 0.9
): Record<string, Array<{ id: string; score: number }>> {
  const completedResponses = responses.filter(
    (r) => r.status === "done" && r.text.trim().length > 0
  );

  if (completedResponses.length < 2) {
    return {};
  }

  const texts = completedResponses.map((r) => r.text);
  const { vectors } = calculateTFIDF(texts);
  const pairs: Record<string, Array<{ id: string; score: number }>> = {};

  // Calculate pairwise similarities
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const similarity = cosineSimilarity(vectors[i], vectors[j]);

      if (similarity >= threshold) {
        const id1 = completedResponses[i].id;
        const id2 = completedResponses[j].id;

        if (!pairs[id1]) pairs[id1] = [];
        if (!pairs[id2]) pairs[id2] = [];

        pairs[id1].push({ id: id2, score: similarity });
        pairs[id2].push({ id: id1, score: similarity });
      }
    }
  }

  return pairs;
}

// Group similar responses into clusters
export function findSimilarityClusters(
  responses: ResponseRecord[],
  threshold: number = 0.9
): Array<{ ids: string[] }> {
  const pairs = findSimilarPairs(responses, threshold);
  const visited = new Set<string>();
  const clusters: Array<{ ids: string[] }> = [];

  // Find connected components (clusters)
  for (const responseId of Object.keys(pairs)) {
    if (visited.has(responseId)) continue;

    const cluster: string[] = [];
    const queue = [responseId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      cluster.push(currentId);

      // Add all similar responses to the queue
      const similarResponses = pairs[currentId] || [];
      for (const { id } of similarResponses) {
        if (!visited.has(id)) {
          queue.push(id);
        }
      }
    }

    if (cluster.length > 1) {
      clusters.push({ ids: cluster });
    }
  }

  return clusters;
}

// Get similarity score for a specific pair
export function getSimilarityScore(
  response1: ResponseRecord,
  response2: ResponseRecord,
  threshold: number = 0.9
): number | null {
  if (response1.status !== "done" || response2.status !== "done") {
    return null;
  }

  const texts = [response1.text, response2.text];
  const { vectors } = calculateTFIDF(texts);

  if (vectors.length < 2) return null;

  const similarity = cosineSimilarity(vectors[0], vectors[1]);
  return similarity >= threshold ? similarity : null;
}

export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

export function enhancedCosineSimilarity(text1: string, text2: string): number {
  const { vectors } = calculateTFIDF([text1, text2]);
  if (vectors.length < 2) return 0;
  return cosineSimilarity(vectors[0], vectors[1]);
}

export function compareExpertToAI(
  expertResponse: { text: string },
  aiResponses: ResponseRecord[],
  thresholds: { red: number; yellow: number }
): ResponseClassification {
  const completedAI = aiResponses.filter(r => r.status === "done" && r.text.trim().length > 0);
  
  let maxSimilarity = 0;
  let likelyModel: string | undefined;
  let bestScores = { levenshtein: 0, cosine: 0, tfIdf: 0 };
  
  for (const aiResponse of completedAI) {
    const levenshtein = levenshteinSimilarity(expertResponse.text, aiResponse.text);
    const cosine = enhancedCosineSimilarity(expertResponse.text, aiResponse.text);
    const tfIdf = getSimilarityScore({ text: expertResponse.text, status: "done" } as ResponseRecord, aiResponse) || 0;
    
    const avgSimilarity = (levenshtein + cosine + tfIdf) / 3;
    
    if (avgSimilarity > maxSimilarity) {
      maxSimilarity = avgSimilarity;
      likelyModel = `${aiResponse.service}/${aiResponse.modelLabel}`;
      bestScores = { levenshtein, cosine, tfIdf };
    }
  }
  
  const classification: "red" | "yellow" | "green" = 
    maxSimilarity >= thresholds.red ? "red" :
    maxSimilarity >= thresholds.yellow ? "yellow" : "green";
  
  return {
    isAIGenerated: classification === "red",
    confidence: maxSimilarity,
    likelyModel: classification === "red" ? likelyModel : undefined,
    similarityScores: bestScores,
    classification
  };
}
