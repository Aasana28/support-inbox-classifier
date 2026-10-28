import {
  ClassificationResult,
  EscalationRule,
  RetrievedChunk,
} from "./types";

export const SIMILARITY_THRESHOLD = 0.65;

const SENSITIVE_KEYWORDS = [
  "legal",
  "lawyer",
  "sue",
  "suing",
  "lawsuit",
  "court",
  "arbitration",
  "refund",
  "refunds",
  "chargeback",
  "chargebacks",
  "breach",
  "leak",
  "leaked",
  "hacked",
  "hack",
  "vulnerability",
  "privacy",
  "gdpr",
  "dpdp",
  "data deletion",
  "data erasure",
  "scrub",
  "cancel contract",
  "canceling our contract",
  "cancel our contract",
  "terminating contract",
  "termination notice",
  "consumer forum",
  "furious",
  "threatening",
  "unacceptable",
  "terrible service",
  "take our business elsewhere",
  "ruined our",
  "override",
  "ignore all",
  "ignore previous",
];

const SENSITIVE_TOPICS = [
  "refund policy",
  "contract and legal",
  "data privacy and security",
];

export function evaluateEscalation(
  subject: string,
  body: string,
  classification: ClassificationResult,
  retrievedChunks: RetrievedChunk[]
): {
  isEscalated: boolean;
  rules: EscalationRule[];
} {
  const combinedText = `${subject} ${body}`.toLowerCase();
  const rules: EscalationRule[] = [];

  // Rule (a): Confidence below 0.70
  const lowConfValues: string[] = [];
  if (classification.topicConfidence < 0.7) {
    lowConfValues.push(`topicConfidence: ${classification.topicConfidence.toFixed(2)}`);
  }
  if (classification.urgencyConfidence < 0.7) {
    lowConfValues.push(`urgencyConfidence: ${classification.urgencyConfidence.toFixed(2)}`);
  }
  if (classification.teamConfidence < 0.7) {
    lowConfValues.push(`teamConfidence: ${classification.teamConfidence.toFixed(2)}`);
  }

  rules.push({
    ruleId: "low_confidence",
    name: "Classification Confidence Below 0.70",
    triggered: lowConfValues.length > 0,
    reason:
      lowConfValues.length > 0
        ? `Confidence below threshold (0.70): ${lowConfValues.join(", ")}`
        : "All classification confidence scores meet or exceed 0.70",
    matchedValues: lowConfValues,
  });

  // Rule (b): Sensitive keywords or sensitive topics found
  const matchedKeywords: string[] = [];
  for (const kw of SENSITIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(combinedText)) {
      matchedKeywords.push(kw);
    }
  }

  // Also check if classified into sensitive topic
  if (SENSITIVE_TOPICS.includes(classification.topic)) {
    matchedKeywords.push(`topic:${classification.topic}`);
  }

  rules.push({
    ruleId: "sensitive_content",
    name: "Sensitive Keywords or Sensitive Topic",
    triggered: matchedKeywords.length > 0,
    reason:
      matchedKeywords.length > 0
        ? `Found sensitive terms or topics: ${matchedKeywords.join(", ")}`
        : "No sensitive keywords or restricted policy topics detected",
    matchedValues: matchedKeywords,
  });

  // Rule (c): Best guidance similarity below threshold
  const bestScore = retrievedChunks.length > 0 ? retrievedChunks[0].similarityScore : 0;
  const isBelowThreshold = bestScore < SIMILARITY_THRESHOLD;

  rules.push({
    ruleId: "low_similarity",
    name: `Guidance Similarity Below Threshold (${SIMILARITY_THRESHOLD})`,
    triggered: isBelowThreshold,
    reason: isBelowThreshold
      ? `Best match score (${bestScore.toFixed(3)}) is below the required threshold of ${SIMILARITY_THRESHOLD}`
      : `Best match score (${bestScore.toFixed(3)}) satisfies threshold (${SIMILARITY_THRESHOLD})`,
    matchedValues: [`bestScore: ${bestScore.toFixed(3)}`],
  });

  // Rule (d): Urgency is critical
  const isCritical = classification.urgency === "critical";
  rules.push({
    ruleId: "critical_urgency",
    name: "Critical Urgency Severity",
    triggered: isCritical,
    reason: isCritical
      ? "Classified as critical urgency requiring mandatory immediate human management"
      : `Urgency level is ${classification.urgency}`,
    matchedValues: isCritical ? ["urgency: critical"] : [],
  });

  const isEscalated = rules.some((r) => r.triggered);

  return {
    isEscalated,
    rules,
  };
}
