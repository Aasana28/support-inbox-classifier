import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { GuidanceChunk, RetrievedChunk, Topic } from "./types";
import { SIMILARITY_THRESHOLD } from "./escalation";

let cachedIndex: GuidanceChunk[] | null = null;

function getIndex(): GuidanceChunk[] {
  if (cachedIndex) return cachedIndex;
  try {
    const indexPath = path.join(process.cwd(), "data", "index.json");
    const raw = fs.readFileSync(indexPath, "utf-8");
    cachedIndex = JSON.parse(raw) as GuidanceChunk[];
    return cachedIndex;
  } catch (err) {
    console.error("Failed to load /data/index.json:", err);
    return [];
  }
}

function l2Normalize(vec: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

export async function embedQuery(queryText: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const embedModel = process.env.EMBED_MODEL || "gemini-embedding-001";
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.embedContent({
    model: embedModel,
    contents: queryText,
    config: {
      outputDimensionality: 768,
      taskType: "RETRIEVAL_QUERY",
    },
  });

  const raw = response.embeddings?.[0]?.values;
  if (!raw || raw.length === 0) {
    throw new Error("No embedding values received from Gemini API");
  }
  return l2Normalize(raw);
}

export async function retrieveGuidance(
  queryText: string,
  classifiedTopic?: Topic
): Promise<{ chunks: RetrievedChunk[]; queryVector: number[] }> {
  const index = getIndex();
  if (index.length === 0) {
    return { chunks: [], queryVector: [] };
  }

  const queryVector = await embedQuery(queryText);

  // Score all chunks
  const scored = index.map((chunk) => {
    const similarityScore = cosineSimilarity(queryVector, chunk.embedding);
    return {
      chunkId: chunk.chunkId,
      docId: chunk.docId,
      docTitle: chunk.docTitle,
      topic: chunk.topic,
      owner: chunk.owner,
      section: chunk.section,
      text: chunk.text,
      similarityScore,
      meetsThreshold: similarityScore >= SIMILARITY_THRESHOLD,
    };
  });

  // If topic is provided, restrict/prioritize chunks matching the classified topic
  let selected: RetrievedChunk[] = [];
  if (classifiedTopic) {
    const topicMatches = scored
      .filter((c) => c.topic.toLowerCase() === classifiedTopic.toLowerCase())
      .sort((a, b) => b.similarityScore - a.similarityScore);

    if (topicMatches.length > 0) {
      selected = topicMatches.slice(0, 3);
    }
  }

  // If fewer than 3, or if no classified topic, sort globally and fill
  if (selected.length < 3) {
    const remaining = scored
      .filter((s) => !selected.some((sel) => sel.chunkId === s.chunkId))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    selected = [...selected, ...remaining].slice(0, 3);
  }

  return {
    chunks: selected,
    queryVector,
  };
}
