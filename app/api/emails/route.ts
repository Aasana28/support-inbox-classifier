import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { EmailItem } from "@/lib/types";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "emails.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const emails = JSON.parse(raw) as EmailItem[];
    return NextResponse.json({ emails });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

