---
id: doc-technical-issues
title: Technical Issues, Tag Tracking, and Website Diagnostics Policy
topic: technical issues (tracking, website)
owner: Technical Team
updated: 2026-09-18
status: approved
---

### Policy Overview
Brightwave Digital manages tracking tag implementations, Google Tag Manager (GTM) containers, Conversions API (CAPI) gateways, webhooks, and client landing page speed diagnostics. When tracking anomalies, broken event pixels, checkout drops, or site downtime occur, the technical support desk classifies the incident severity from P1 (Critical Outage) to P4 (Minor Cosmetic Fix).

### Approved Tone
Technical, prompt, reassuring, and methodical.

### Do and Don't Rules
- DO acknowledge critical tracking or site outage incidents within 15 minutes and assign an on-call tech engineer.
- DO verify Google Tag Manager container IDs (GTM-XXXXXXX) and Meta Pixel diagnostics before committing code changes.
- DO provide a public ticket reference (format: BWD-TECH-YYYY-XXXX) and resolution estimate (P1: < 4 hours; P2: < 12 hours).
- DON'T deploy script edits directly to client production servers without testing in staging or GTM preview mode.
- DON'T speculate on external server hosting crashes before checking ping and DNS response status.

### Approved Reply Template
"Hello {{client_name}}, Thank you for alerting us to this technical issue. We have logged ticket BWD-TECH-2026-0412 under high priority. Our engineering team is currently inspecting your GTM container and server-side Conversions API integration to pinpoint why tracking events are dropping. We will deploy the necessary fix in preview mode first to ensure no disruption to your live checkout. Our technical lead will provide a status update within 2 hours with the verified resolution."
