import { QUALITY_TEST_CASES } from "../lib/quality-checks";

async function testSingle(index: number) {
  const tc = QUALITY_TEST_CASES[index];
  console.log(`Testing Case #${index + 1}: ${tc.name}`);
  const start = Date.now();
  try {
    const res = await fetch("https://support-inbox-classifier.vercel.app/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: tc.email.subject,
        body: tc.email.body,
        sender: tc.email.fromName,
      }),
    });
    console.log(`Status: ${res.status} ${res.statusText} in ${Date.now() - start}ms`);
    const text = await res.text();
    console.log(`Response length: ${text.length}`);
    try {
      const json = JSON.parse(text);
      console.log(`Success: ${json.success}`);
      if (json.trace) {
        console.log(`Model: ${json.trace.modelUsed}`);
        console.log(`Topic: ${json.trace.classification.topic}, Escalated: ${json.trace.isEscalated}`);
        console.log(`Timings:`, json.trace.timings);
      } else {
        console.log(`Error:`, json.error);
      }
    } catch {
      console.log(`Raw text:`, text.slice(0, 500));
    }
  } catch (err: any) {
    console.error(`Fetch exception:`, err);
  }
}

testSingle(9); // Case 10 (index 9)
