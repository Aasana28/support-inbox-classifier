import { QUALITY_TEST_CASES } from "../lib/quality-checks";
import { ProcessTrace } from "../lib/types";

const PROD_URL = "https://support-inbox-classifier.vercel.app/api/process";

async function fetchWithRetry(url: string, options: any, maxRetries = 2): Promise<Response> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        console.log(`       [Network retry ${attempt}/${maxRetries} after transient failure]`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError;
}

async function runProdChecks() {
  console.log(`Starting execution of ${QUALITY_TEST_CASES.length} Quality Test Cases against PRODUCTION (${PROD_URL})...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < QUALITY_TEST_CASES.length; i++) {
    const tc = QUALITY_TEST_CASES[i];
    const start = Date.now();
    try {
      const res = await fetchWithRetry(PROD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: tc.email.subject,
          body: tc.email.body,
          sender: tc.email.fromName,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const trace: ProcessTrace = json.trace;

      let testPass = true;
      const issues: string[] = [];

      if (tc.expected.team && trace.classification.team !== tc.expected.team) {
        testPass = false;
        issues.push(`Expected team "${tc.expected.team}", got "${trace.classification.team}"`);
      }
      if (tc.expected.topic && trace.classification.topic !== tc.expected.topic) {
        testPass = false;
        issues.push(`Expected topic "${tc.expected.topic}", got "${trace.classification.topic}"`);
      }
      if (tc.expected.urgency && trace.classification.urgency !== tc.expected.urgency) {
        testPass = false;
        issues.push(`Expected urgency "${tc.expected.urgency}", got "${trace.classification.urgency}"`);
      }
      if (tc.expected.isEscalated !== undefined && trace.isEscalated !== tc.expected.isEscalated) {
        testPass = false;
        issues.push(`Expected escalated=${tc.expected.isEscalated}, got ${trace.isEscalated}`);
      }
      if (tc.expected.forbiddenInDraft) {
        const bodyLower = trace.draft.body.toLowerCase();
        for (const forbidden of tc.expected.forbiddenInDraft) {
          if (bodyLower.includes(forbidden.toLowerCase())) {
            testPass = false;
            issues.push(`Draft contained forbidden phrase: "${forbidden}"`);
          }
        }
      }
      if (tc.expected.customCheck) {
        const resCheck = tc.expected.customCheck(trace);
        if (!resCheck.pass) {
          testPass = false;
          issues.push(resCheck.reason);
        }
      }

      const durationMs = Date.now() - start;

      if (testPass) {
        passed++;
        console.log(`[PASS] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name} [${durationMs}ms]`);
      } else {
        failed++;
        console.error(`[FAIL] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name} [${durationMs}ms]`);
        console.error(`       Issues: ${issues.join("; ")}`);
        console.error(`       Actual: topic='${trace.classification.topic}', urgency='${trace.classification.urgency}', team='${trace.classification.team}', escalated=${trace.isEscalated}`);
      }
    } catch (err: unknown) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] (${i + 1}/${QUALITY_TEST_CASES.length}) ${tc.id}: ${tc.name} -> ${message}`);
    }

    // Delay between calls to prevent TPM throttling
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n======================================================`);
  console.log(`PRODUCTION QUALITY CHECKS SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${QUALITY_TEST_CASES.length}`);
  console.log(`Pass Rate: ${((passed / QUALITY_TEST_CASES.length) * 100).toFixed(1)}%`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProdChecks();
