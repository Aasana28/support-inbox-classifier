import { QUALITY_TEST_CASES, QualityCheckResult } from "../lib/quality-checks";
import { classifyEmail, draftReply } from "../lib/ai";
import { retrieveGuidance } from "../lib/rag";
import { evaluateEscalation, SIMILARITY_THRESHOLD } from "../lib/escalation";
import { ProcessTrace } from "../lib/types";

try {
  process.loadEnvFile(".env.local");
} catch {}

async function runAll() {
  console.log(`Starting execution of ${QUALITY_TEST_CASES.length} Quality Test Cases...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < QUALITY_TEST_CASES.length; i++) {
    const tc = QUALITY_TEST_CASES[i];
    const start = Date.now();
    try {
      const { classification, modelUsed: groqClassify } = await classifyEmail(
        tc.email.subject,
        tc.email.body,
        tc.email.fromName
      );

      const { chunks } = await retrieveGuidance(
        `Subject: ${tc.email.subject}\n\n${tc.email.body}`,
        classification.topic
      );

      const { isEscalated, rules } = evaluateEscalation(
        tc.email.subject,
        tc.email.body,
        classification,
        chunks
      );

      const triggeredReasons = rules.filter((r) => r.triggered).map((r) => r.reason);

      const { draft, citationsValid, droppedCitations, modelUsed: groqDraft } = await draftReply(
        tc.email.subject,
        tc.email.body,
        chunks,
        isEscalated,
        triggeredReasons,
        tc.email.fromName
      );

      const trace: ProcessTrace = {
        modelUsed: groqDraft,
        groqModel: groqDraft,
        embedModel: "gemini-embedding-001",
        classification,
        retrievedChunks: chunks,
        similarityThreshold: SIMILARITY_THRESHOLD,
        isEscalated,
        escalationRules: rules,
        draft,
        citationsValid,
        droppedCitations,
        timings: {
          classifyMs: 0,
          embedMs: 0,
          retrieveMs: 0,
          draftMs: 0,
          validateMs: 0,
          totalMs: Date.now() - start,
        },
      };

      // Assertions
      let testPass = true;
      const issues: string[] = [];

      if (tc.expected.team && classification.team !== tc.expected.team) {
        testPass = false;
        issues.push(`Expected team "${tc.expected.team}", got "${classification.team}"`);
      }
      if (tc.expected.topic && classification.topic !== tc.expected.topic) {
        testPass = false;
        issues.push(`Expected topic "${tc.expected.topic}", got "${classification.topic}"`);
      }
      if (tc.expected.urgency && classification.urgency !== tc.expected.urgency) {
        testPass = false;
        issues.push(`Expected urgency "${tc.expected.urgency}", got "${classification.urgency}"`);
      }
      if (tc.expected.isEscalated !== undefined && isEscalated !== tc.expected.isEscalated) {
        testPass = false;
        issues.push(`Expected escalated=${tc.expected.isEscalated}, got ${isEscalated}`);
      }
      if (tc.expected.forbiddenInDraft) {
        const bodyLower = draft.body.toLowerCase();
        for (const forbidden of tc.expected.forbiddenInDraft) {
          if (bodyLower.includes(forbidden.toLowerCase())) {
            testPass = false;
            issues.push(`Draft contained forbidden phrase: "${forbidden}"`);
          }
        }
      }
      if (tc.expected.customCheck) {
        const res = tc.expected.customCheck(trace);
        if (!res.pass) {
          testPass = false;
          issues.push(res.reason);
        }
      }

      const duration = Date.now() - start;
      if (testPass) {
        passed++;
        console.log(`[PASS] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name} (${duration}ms)`);
      } else {
        failed++;
        console.log(`[FAIL] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name} (${duration}ms)`);
        console.log(`       Issues: ${issues.join("; ")}`);
      }

      // Small throttle between API calls
      await new Promise((r) => setTimeout(r, 350));
    } catch (err: unknown) {
      failed++;
      console.log(`[ERROR] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name}`);
      console.log(`        Exception: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (${QUALITY_TEST_CASES.length} TOTAL)`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runAll().catch(console.error);
