import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { GoogleGenAI } from "@google/genai";

// Load .env.local if present
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignored if file does not exist or already loaded
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is not defined in environment.");
  process.exit(1);
}

const embedModel = process.env.EMBED_MODEL || "gemini-embedding-001";
const ai = new GoogleGenAI({ apiKey });

export interface GuidanceChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  topic: string;
  owner: string;
  section: string;
  text: string;
  embedding: number[];
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

async function getEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: embedModel,
    contents: text,
    config: {
      outputDimensionality: 768,
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });

  const raw = response.embeddings?.[0]?.values;
  if (!raw || raw.length === 0) {
    throw new Error("Empty embedding returned by Gemini API");
  }
  return l2Normalize(raw);
}

async function main() {
  const guidanceDir = path.join(process.cwd(), "data", "guidance");
  const files = fs.readdirSync(guidanceDir).filter((f) => f.endsWith(".md"));

  console.log(`Found ${files.length} guidance documents in ${guidanceDir}`);

  const allChunks: GuidanceChunk[] = [];

  for (const file of files) {
    const fullPath = path.join(guidanceDir, file);
    const rawContent = fs.readFileSync(fullPath, "utf-8");
    const parsed = matter(rawContent);

    const docId = (parsed.data.id as string) || path.basename(file, ".md");
    const docTitle = (parsed.data.title as string) || docId;
    const topic = (parsed.data.topic as string) || "general inquiries and meeting requests";
    const owner = (parsed.data.owner as string) || "General";

    console.log(`Processing: ${file} (Topic: ${topic})`);

    // Parse sections
    const content = parsed.content;
    const sections = content.split(/###\s+/).filter(Boolean);

    let overviewText = "";
    let rulesText = "";
    let templateText = "";

    for (const sec of sections) {
      const trimmed = sec.trim();
      const firstLine = trimmed.split("\n")[0].toLowerCase();
      if (firstLine.includes("policy overview") || firstLine.includes("approved tone")) {
        overviewText += `\n### ${trimmed}`;
      } else if (firstLine.includes("do and don't") || firstLine.includes("rule")) {
        rulesText += `\n### ${trimmed}`;
      } else if (firstLine.includes("template") || firstLine.includes("reply")) {
        templateText += `\n### ${trimmed}`;
      } else {
        overviewText += `\n### ${trimmed}`;
      }
    }

    // Chunk 1: Policy Overview & Tone
    if (overviewText.trim()) {
      const text = `Document: ${docTitle}\nTopic: ${topic}\nOwner: ${owner}\n\n${overviewText.trim()}`;
      console.log(`  Embedding chunk: ${docId}-overview...`);
      const embedding = await getEmbedding(text);
      allChunks.push({
        chunkId: `${docId}-overview`,
        docId,
        docTitle,
        topic,
        owner,
        section: "Policy Overview & Tone",
        text,
        embedding,
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    // Chunk 2: Operational Rules & Guidelines
    if (rulesText.trim()) {
      const text = `Document: ${docTitle}\nTopic: ${topic}\nOwner: ${owner}\n\n${rulesText.trim()}`;
      console.log(`  Embedding chunk: ${docId}-rules...`);
      const embedding = await getEmbedding(text);
      allChunks.push({
        chunkId: `${docId}-rules`,
        docId,
        docTitle,
        topic,
        owner,
        section: "Rules & Guidelines",
        text,
        embedding,
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    // Chunk 3: Approved Reply Templates & Turnarounds
    if (templateText.trim()) {
      const text = `Document: ${docTitle}\nTopic: ${topic}\nOwner: ${owner}\n\n${templateText.trim()}`;
      console.log(`  Embedding chunk: ${docId}-template...`);
      const embedding = await getEmbedding(text);
      allChunks.push({
        chunkId: `${docId}-template`,
        docId,
        docTitle,
        topic,
        owner,
        section: "Approved Reply Template",
        text,
        embedding,
      });
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const outputPath = path.join(process.cwd(), "data", "index.json");
  fs.writeFileSync(outputPath, JSON.stringify(allChunks, null, 2), "utf-8");
  console.log(`\nSuccessfully indexed ${allChunks.length} chunks to ${outputPath}`);
}

main().catch((err) => {
  console.error("Index build failed:", err);
  process.exit(1);
});
