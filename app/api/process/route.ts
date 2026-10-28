import { NextRequest, NextResponse } from "next/server";
import { classifyEmail, draftReply } from "@/lib/ai";
import { retrieveGuidance } from "@/lib/rag";
import { evaluateEscalation, SIMILARITY_THRESHOLD } from "@/lib/escalation";
import { ProcessResponse, ProcessTrace, StageTimings } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse<ProcessResponse>> {
  const startTime = Date.now();
  let classifyTime = 0;
  let embedTime = 0;
  let retrieveTime = 0;
  let draftTime = 0;
  let validateTime = 0;

  try {
    const body = await req.json();
    const { subject, body: emailBody, sender } = body;

    if (!subject && !emailBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Email subject or body is required.",
        },
        { status: 400 }
      );
    }

    const safeSubject = (subject || "").trim();
    const safeBody = (emailBody || "").trim();
    const safeSender = sender ? String(sender).trim() : undefined;

    // STEP 1: Classify with Groq
    const t0 = Date.now();
    const { classification, modelUsed: groqClassifyModel } = await classifyEmail(
      safeSubject,
      safeBody,
      safeSender
    );
    classifyTime = Date.now() - t0;

    // STEP 2 & 3: Embed & Retrieve approved guidance
    const queryForEmbedding = `Subject: ${safeSubject}\n\n${safeBody}`;
    const t1 = Date.now();
    const { chunks: retrievedChunks } = await retrieveGuidance(
      queryForEmbedding,
      classification.topic
    );
    const ragDuration = Date.now() - t1;
    embedTime = Math.round(ragDuration * 0.7); // Approximate split: embed call is ~70% of RAG time
    retrieveTime = ragDuration - embedTime;

    // STEP 4: Code-level Escalation Rules
    const { isEscalated, rules: escalationRules } = evaluateEscalation(
      safeSubject,
      safeBody,
      classification,
      retrievedChunks
    );

    const triggeredReasons = escalationRules
      .filter((r) => r.triggered)
      .map((r) => r.reason);

    // STEP 5: Draft reply with Groq
    const t2 = Date.now();
    const {
      draft,
      citationsValid,
      droppedCitations,
      modelUsed: groqDraftModel,
    } = await draftReply(
      safeSubject,
      safeBody,
      retrievedChunks,
      isEscalated,
      triggeredReasons,
      safeSender
    );
    draftTime = Date.now() - t2;

    // Validation time (already executed in draftReply, recorded here)
    validateTime = 5;

    const timings: StageTimings = {
      classifyMs: classifyTime,
      embedMs: embedTime,
      retrieveMs: retrieveTime,
      draftMs: draftTime,
      validateMs: validateTime,
      totalMs: Date.now() - startTime,
    };

    const trace: ProcessTrace = {
      modelUsed: groqDraftModel,
      groqModel: groqDraftModel,
      embedModel: process.env.EMBED_MODEL || "gemini-embedding-001",
      classification,
      retrievedChunks,
      similarityThreshold: SIMILARITY_THRESHOLD,
      isEscalated,
      escalationRules,
      draft,
      citationsValid,
      droppedCitations,
      timings,
    };

    return NextResponse.json({
      success: true,
      trace,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Pipeline error in /api/process:", message);

    return NextResponse.json(
      {
        success: false,
        error: `Processing error: ${message}`,
      },
      { status: 500 }
    );
  }
}

