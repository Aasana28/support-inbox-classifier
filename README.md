# Brightwave Support Inbox (AI Support Inbox Classifier & Draft Responder)

> **Live Production Link:** [https://support-inbox-classifier.vercel.app](https://support-inbox-classifier.vercel.app)  
> **GitHub Repository:** [https://github.com/Aasana28/support-inbox-classifier](https://github.com/Aasana28/support-inbox-classifier)  
> **Primary Accent:** `#2F5D8A` (Muted Blue) • **Target Agency:** Brightwave Digital, Bodakdev, Ahmedabad, Gujarat, India

---

## 1. Project Purpose & Official Definition

**AI Support Inbox Classifier & Draft Responder:**  
*Classify incoming support/client emails by topic, urgency, and team; retrieve approved response guidance and draft a reply. Require human approval before sending and escalate uncertain or sensitive cases.*

Built for **Brightwave Digital**, a performance digital marketing and software agency based in Ahmedabad. Amounts and retainers are denominated in Indian Rupees (INR).

---

## 2. Key Features Mapped to Requirements

| Feature Requirement | Implementation Details | Where Demonstrated in UI |
| :--- | :--- | :--- |
| **Email Classification** | Groq (`openai/gpt-oss-120b` with fallback to `openai/gpt-oss-20b`) in structured JSON mode. Classifies topic, urgency (low, medium, high, critical), team, 0–1 confidences, and one-line reasoning. | **Inbox Tab** &rarr; Classification Card with visual confidence progress bars. |
| **Approved Guidance RAG** | Pre-embedded vector index (`gemini-embedding-001`, 768-dim, L2-normalized). Incoming queries embedded on-the-fly (`RETRIEVAL_QUERY`), cosine top-3 retrieved, topic-filtered. | **Inbox Tab** &rarr; Retrieved Guidance card with similarity scores & source preview drawer. |
| **Deterministic Escalation Rules** | Decided purely by code (not the LLM): <br>1. Any confidence < 0.70<br>2. Sensitive keywords/topics (`legal`, `sue`, `refund`, `chargeback`, `breach`, `leak`, `privacy`, `GDPR`, `cancel contract`, angry tone)<br>3. Best similarity < 0.65 threshold<br>4. Urgency is `critical` | **Inbox Tab** &rarr; Prominent "Escalated to Human Review" badge with exact matched terms & rules. |
| **Grounded Draft Reply** | Drafts reply using ONLY retrieved guidance. On escalated or low-context cases, locked to a safe holding reply making zero promises regarding refunds or legal claims. Includes mandatory reviewer note. | **Inbox Tab** &rarr; Draft Response card, Editable Draft textarea, and Reviewer Note alert. |
| **Code Citation Validator** | Validates in code that every cited chunkId exists in retrieved set and every quote is a real substring in the policy text. Prohibits promissory monetary commitments. | **Inbox Tab** &rarr; Verified inline citation chips & "How this was produced" trace section. |
| **Strict Human Approval** | **Nothing is ever sent automatically.** Features *Approve & Send* (mock simulated confirmation with timestamp), *Edit Draft* (editable textarea), and *Reject* (with reason). Escalated cases require a secondary confirmation modal. | **Inbox Tab** &rarr; Action buttons, simulated confirmation badges, and escalation dialog. |
| **Guidance Library** | Interactive catalog of 10 approved operational policy documents (billing, refund, reporting delays, performance, onboarding, technical, scope change, privacy, contract, general). | **Guidance Library Tab** &rarr; Filterable policy table and slide-over reader. |
| **Live Quality Checks Suite** | 16 live integration tests executed live against `/api/process` validating classification accuracy, prompt-injection safety, Hinglish handling, and escalation guarantees. | **Quality Checks Tab** &rarr; One-click test runner with real-time pass/fail matrix. |

---

## 3. Screenshots

### Desktop View: Inbox & Triage
![Inbox Desktop View](docs/screenshots/inbox-desktop.png)

### Desktop View: Escalation to Human Review
![Escalated Case Review](docs/screenshots/escalation-desktop.png)

### Desktop View: Approved Guidance Library
![Guidance Library](docs/screenshots/guidance-desktop.png)

### Desktop View: Live Quality Checks Suite (16/16 Passed)
![Quality Checks Suite](docs/screenshots/quality-checks-desktop.png)

### Mobile Responsive Views (390px iPhone Viewport)
<p align="center">
  <img src="docs/screenshots/inbox-mobile-390px.png" width="380" alt="Inbox Mobile View" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/quality-mobile-390px.png" width="380" alt="Quality Checks Mobile View" />
</p>

---

## 4. Architecture & AI Pipeline

```mermaid
flowchart TD
    A["Incoming Email (Subject + Body)"] --> B["1. Groq Structured Classification<br/>(Prompt-Injection Safe)"]
    B --> C["2. Gemini Query Embedding<br/>(RETRIEVAL_QUERY, 768-dim, L2-norm)"]
    C --> D["3. Cosine Top-3 Retrieval & Topic Restriction<br/>(Threshold: 0.65)"]
    B & D --> E{"4. Deterministic Code Escalation<br/>- Confidence < 0.70<br/>- Sensitive keywords/topics<br/>- Best similarity < 0.65<br/>- Urgency = critical"}
    E -- Standard Case --> F["5a. Groq Grounded Reply Drafting<br/>(Approved Template + Citations)"]
    E -- Escalated Case --> G["5b. Groq Safe Holding Reply<br/>(No promises, Reviewer Note)"]
    F & G --> H["6. Code Validation<br/>(Check chunkIds, substring quotes, strip promises)"]
    H --> I["7. Full Trace Return<br/>(Timings, model, scores, rules)"]
    I --> J{"8. Human Reviewer Action<br/>(Approve, Edit, Reject)"}
    J --> K["Sent (Simulated Confirmation in State)"]
```

---

## 5. Tech Stack

- **Framework:** Next.js 15.5.28 (App Router, TypeScript)
- **Styling:** Tailwind CSS with Inter typography and custom brand accent `#2F5D8A`
- **Text Generation & Classification:** Groq SDK (`openai/gpt-oss-120b` with automatic fallback to `openai/gpt-oss-20b`)
- **Semantic Vector Embeddings:** Google Gemini (`@google/genai`, `gemini-embedding-001`, 768-dim, L2-normalized)
- **Data Validation:** Zod
- **Icons:** Lucide React
- **End-to-End Testing:** Playwright Chromium (Desktop & 390px Mobile)
- **Deployment:** Vercel Production Serverless

---

## 6. Local Setup & Development

### Prerequisites
- Node.js 20+ (Node 24 supported)
- npm or pnpm
- Valid Groq API Key and Google Gemini API Key

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Aasana28/support-inbox-classifier.git
   cd support-inbox-classifier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   cp .env.example .env.local
   ```

4. Build precomputed vector index (already committed in `data/index.json`):
   ```bash
   npm run build-index
   ```

5. Run development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Run lint & build:
   ```bash
   npm run lint
   npm run build
   ```

---

## 7. Environment Variables

| Variable | Description | Default / Recommended Value |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq API authentication key | `gsk_...` |
| `GROQ_MODEL` | Primary text generation model | `openai/gpt-oss-120b` (fallback: `openai/gpt-oss-20b`) |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `EMBED_MODEL` | Gemini embedding model name | `gemini-embedding-001` (768 dimensions) |

*API keys are strictly server-side and never exposed to the client bundle.*

---

## 8. Data & Privacy Declarations

- **Synthetic Data Notice:** All 10 approved response-guidance documents and 25 sample incoming emails are 100% synthetic, crafted specifically for the fictional Ahmedabad agency *Brightwave Digital*.
- **No Data Storage Declaration:** In accordance with project requirements, **no database, localStorage, sessionStorage, or browser cookies are used**. All triage and draft approval interactions persist exclusively in ephemeral React state for the active session.

---

## 9. Known Limitations

1. **Free-tier Rate Limits:** During heavy sequential execution of the 16 quality test cases, Groq's free-tier rate limits (8,000 TPM) may trigger fallback to `openai/gpt-oss-20b` or a transient delay.
2. **Simulation Mode:** The "Approve & Send" button simulates an SMTP transmission and updates React UI state; it does not dispatch real outward emails over SES/SendGrid.
