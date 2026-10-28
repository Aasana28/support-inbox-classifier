export type Topic =
  | "billing and invoices"
  | "refund policy"
  | "reporting delays"
  | "campaign performance concerns"
  | "onboarding and access"
  | "technical issues (tracking, website)"
  | "scope change requests"
  | "data privacy and security"
  | "contract and legal"
  | "general inquiries and meeting requests";

export const TOPIC_LIST: Topic[] = [
  "billing and invoices",
  "refund policy",
  "reporting delays",
  "campaign performance concerns",
  "onboarding and access",
  "technical issues (tracking, website)",
  "scope change requests",
  "data privacy and security",
  "contract and legal",
  "general inquiries and meeting requests",
];

export type Urgency = "low" | "medium" | "high" | "critical";
export const URGENCY_LIST: Urgency[] = ["low", "medium", "high", "critical"];

export type Team =
  | "Accounts"
  | "Account Management"
  | "Technical"
  | "Legal and Compliance"
  | "Sales and Onboarding"
  | "General";

export const TEAM_LIST: Team[] = [
  "Accounts",
  "Account Management",
  "Technical",
  "Legal and Compliance",
  "Sales and Onboarding",
  "General",
];

export interface EmailItem {
  id: string;
  fromName: string;
  fromEmail: string;
  company: string;
  subject: string;
  body: string;
  receivedAt: string;
}

export interface ClassificationResult {
  topic: Topic;
  topicConfidence: number;
  urgency: Urgency;
  urgencyConfidence: number;
  team: Team;
  teamConfidence: number;
  reason: string;
}

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

export interface RetrievedChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  topic: string;
  owner: string;
  section: string;
  text: string;
  similarityScore: number;
  meetsThreshold: boolean;
}

export interface EscalationRule {
  ruleId: "low_confidence" | "sensitive_content" | "low_similarity" | "critical_urgency";
  name: string;
  triggered: boolean;
  reason: string;
  matchedValues?: string[];
}

export interface Citation {
  chunkId: string;
  quote: string;
}

export interface DraftReply {
  subject: string;
  body: string;
  reviewerNote?: string;
  usedGuidance: Citation[];
}

export interface DroppedCitation {
  chunkId: string;
  quote: string;
  reason: string;
}

export interface StageTimings {
  classifyMs: number;
  embedMs: number;
  retrieveMs: number;
  draftMs: number;
  validateMs: number;
  totalMs: number;
}

export interface ProcessTrace {
  modelUsed: string;
  groqModel: string;
  embedModel: string;
  classification: ClassificationResult;
  retrievedChunks: RetrievedChunk[];
  similarityThreshold: number;
  isEscalated: boolean;
  escalationRules: EscalationRule[];
  draft: DraftReply;
  citationsValid: boolean;
  droppedCitations: DroppedCitation[];
  timings: StageTimings;
}

export interface ProcessResponse {
  success: boolean;
  trace?: ProcessTrace;
  error?: string;
}

export interface GuidanceDocMeta {
  id: string;
  title: string;
  topic: Topic;
  owner: Team | string;
  updated: string;
  status: string;
  content: string;
  filename: string;
}

