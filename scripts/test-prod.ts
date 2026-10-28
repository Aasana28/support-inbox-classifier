async function checkProd() {
  const baseUrl = 'https://support-inbox-classifier.vercel.app';
  console.log(`Checking ${baseUrl}...`);

  // 1. Guidance API
  console.log('\n--- 1. Testing /api/guidance ---');
  const gRes = await fetch(`${baseUrl}/api/guidance`);
  console.log(`Guidance HTTP Status: ${gRes.status}`);
  const gData = await gRes.json();
  console.log(`Guidance docs returned: ${gData.docs?.length || 0}`);

  // 2. Emails API
  console.log('\n--- 2. Testing /api/emails ---');
  const eRes = await fetch(`${baseUrl}/api/emails`);
  console.log(`Emails HTTP Status: ${eRes.status}`);
  const eData = await eRes.json();
  console.log(`Emails sample returned: ${eData.emails?.length || 0}`);

  // 3. Process API (live AI pipeline call on Vercel)
  console.log('\n--- 3. Testing /api/process (Live AI on Vercel) ---');
  const testPayload = {
    subject: "Urgent: Complete website checkout outage - losing revenue",
    body: "Hi team, our payment gateway is throwing 500 errors on production. Customers cannot complete checkout. This is P1 critical.",
    fromName: "Kavita Shah",
    fromEmail: "kavita@novaretail.in"
  };

  const startTime = Date.now();
  const pRes = await fetch(`${baseUrl}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  const duration = Date.now() - startTime;
  console.log(`Process HTTP Status: ${pRes.status} in ${duration}ms`);

  if (pRes.ok) {
    const pData = await pRes.json();
    const trace = pData.trace;
    console.log('Success:', pData.success);
    console.log('Classification:', trace.classification);
    console.log('Is Escalated:', trace.isEscalated);
    console.log('Escalation Rules:', trace.escalationRules.filter((r: any) => r.triggered).map((r: any) => r.name));
    console.log('Retrieved Chunks:', trace.retrievedChunks.length);
    console.log('Top retrieved similarity:', trace.retrievedChunks[0]?.similarity);
    console.log('Draft Subject:', trace.draft.subject);
    console.log('Draft Body snippet:', trace.draft.body.slice(0, 180) + '...');
    console.log('Trace timings:', trace.timings);
  } else {
    const errorText = await pRes.text();
    console.error('Process error:', errorText);
  }
}

checkProd();

