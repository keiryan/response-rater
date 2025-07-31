import { ResponseRecord } from "@/lib/types";

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
