import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { GuidanceDocMeta, Topic } from "@/lib/types";

export async function GET() {
  try {
    const guidanceDir = path.join(process.cwd(), "data", "guidance");
    const files = fs.readdirSync(guidanceDir).filter((f) => f.endsWith(".md"));

    const docs: GuidanceDocMeta[] = files.map((file) => {
      const fullPath = path.join(guidanceDir, file);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = matter(raw);

      return {
        id: (parsed.data.id as string) || path.basename(file, ".md"),
        title: (parsed.data.title as string) || "Untitled Policy",
        topic: (parsed.data.topic as Topic) || "general inquiries and meeting requests",
        owner: (parsed.data.owner as string) || "General",
        updated: (parsed.data.updated as string) || "2026-09-01",
        status: (parsed.data.status as string) || "approved",
        content: parsed.content,
        filename: file,
      };
    });

    return NextResponse.json({ docs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

