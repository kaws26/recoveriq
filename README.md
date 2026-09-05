# RecoverIQ — Autonomous AI Revenue Recovery Platform

> **Turn payment drop-offs into captured revenue on complete autopilot.**  
> An enterprise-grade, AI-powered transaction failure intelligence, dynamic retry, and revenue reclamation engine built for digital merchants and subscription businesses.

[![Track: AI Revenue Recovery](https://img.shields.io/badge/Razorpay_Buildathon-Track_03:_AI_Revenue_Recovery-blue.svg)](https://razorpay.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Theme Support](https://img.shields.io/badge/Dark_Mode-Supported-indigo.svg)](#)

---

## 📑 Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. The Problem: The ₹40,000 Crore Silent Bleed](#2-the-problem-the-40000-crore-silent-bleed)
- [3. The RecoverIQ Solution](#3-the-recoveriq-solution)
- [4. The 9-Stage Recovery Lifecycle](#4-the-9-stage-recovery-lifecycle)
- [5. Core Product Capabilities](#5-core-product-capabilities)
  - [5.1 Executive Revenue Command Center](#51-executive-revenue-command-center)
  - [5.2 Intelligent Case Management & Drawer Inspector](#52-intelligent-case-management--drawer-inspector)
  - [5.3 AI Diagnostics & Recovery Studio](#53-ai-diagnostics--recovery-studio)
  - [5.4 Maker-Checker Financial Governance](#54-maker-checker-financial-governance)
  - [5.5 Deep Banking Rail & Cohort Analytics](#55-deep-banking-rail--cohort-analytics)
  - [5.6 Cryptographic Immutable Audit Ledger](#56-cryptographic-immutable-audit-ledger)
  - [5.7 Interactive Live Gateway Simulator](#57-interactive-live-gateway-simulator)
  - [5.8 Settings, Guardrails & Gateway Keys](#58-settings-guardrails--gateway-keys)
- [6. Machine Learning & Reasoning Engine](#6-machine-learning--reasoning-engine)
- [7. Deterministic Financial Safety Guardrails](#7-deterministic-financial-safety-guardrails)
- [8. System Architecture](#8-system-architecture)
- [9. Business Impact & ROI](#9-business-impact--roi)
- [10. Quick Start & Local Setup](#10-quick-start--local-setup)
- [11. Security, Privacy & RBI Compliance](#11-security-privacy--rbi-compliance)
- [12. Product Roadmap](#12-product-roadmap)

---

## 1. Executive Summary

In high-velocity digital economies like India, digital commerce loses **15% to 25% of all attempted transactions** due to transient network drop-offs, core banking server downtimes, UPI session timeouts, expired card mandates, or temporary balance shortfalls.

Merchants invest aggressively in performance marketing to acquire users. Yet, when a customer hits "Pay" and the bank server hiccups, that high-intent revenue bleeds away silently into a black hole.

**RecoverIQ** is an autonomous revenue recovery engine. It ingests failed transaction webhooks in real time, diagnoses root causes down to the core banking rail, scores recovery likelihood using a 13-feature ML model, reasons using frontier AI models (**NVIDIA Nemotron-3 Super 120B** / **Gemini**), enforces strict **deterministic financial guardrails**, and executes optimized recovery workflows (intelligent time-delayed retries, personalized 1-click payment links, and multi-rail fallbacks).

---

## 2. The Problem: The ₹40,000 Crore Silent Bleed

Traditional recovery methods deployed by merchants today fall into two deeply flawed extremes:

| Traditional Approach | How It Operates | Why It Destroys Value |
| :--- | :--- | :--- |
| **The Blind Retry** | Gateway fires an immediate, identical retry 10 seconds after failure. | Banks flag rapid repetitive hits as potential card testing/fraud. Cards get locked, acquirers impose penalty fees, and customer friction escalates. |
| **The Manual Fire drill** | Finance or CS teams pull a failed CSV export 4 days later and send manual emails. | By the time the email arrives, buyer intent is zero. Involuntary churn skyrockets, and customer conversion drops below 4%. |
| **Total Abandonment** | Merchants write off failed recurring payments or drops as "unrecoverable churn". | Direct loss of EBITDA and compressed Customer Lifetime Value (LTV). |

### Anatomy of Transaction Failures in India

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Root Causes of Payment Failures                      │
├────────────────────────┬───────────────────────────┬────────────────────┤
│ Failure Category       │ Typical Error Signatures  │ Recoverability     │
├────────────────────────┼───────────────────────────┼────────────────────┤
│ Bank Downtime          │ `BAD_REQUEST_GATEWAY_DOWN`│ HIGH (78% - 92%)   │
│ (Maintenance windows)  │ `BANK_SERVER_UNAVAILABLE` │ (Time-shifted)     │
├────────────────────────┼───────────────────────────┼────────────────────┤
│ NPCI / UPI Timeouts    │ `UPI_EXPIRY_TIMEOUT`      │ VERY HIGH (85%)    │
│ (Network latency)      │ `VPA_COLLECT_TIMEOUT`     │ (Instant PayLink)  │
├────────────────────────┼───────────────────────────┼────────────────────┤
│ Temporary Balance      │ `INSUFFICIENT_FUNDS`      │ MEDIUM (55% - 70%) │
│ (Pre-payday dry spells)│ `DECLINED_BY_ISSUER`      │ (Salary day retry) │
├────────────────────────┼───────────────────────────┼────────────────────┤
│ Mandate / 3DS Friction │ `RECURRING_MANDATE_EXPIRED│ HIGH (80%)         │
│ (RBI e-mandate lapses) │ `AUTH_STEP_UP_REQUIRED`   │ (Intent Link)      │
├────────────────────────┼───────────────────────────┼────────────────────┤
│ Hard Fraud / Lost Card │ `STOLEN_CARD`, `DO_NOT_HON│ ZERO (0%)          │
│ (Terminal blocks)      │ `FRAUD_SUSPECTED`         │ (Never retried)    │
└────────────────────────┴───────────────────────────┴────────────────────┘
```

---

## 3. The RecoverIQ Solution

RecoverIQ transforms transaction failures from a dead-end error log into a high-yield recovery pipeline:

1. **Non-Invasive Gateway Layer**: Plugs directly into payment gateways (Razorpay, Cashfree, Stripe) via webhooks and REST APIs.
2. **Context-Aware Dynamic Retries**: Understands bank maintenance cycles (e.g., HDFC/SBI scheduled maintenance between 1:00 AM – 3:30 AM) and holds retries until peak clearing hours (9:00 AM – 11:00 AM).
3. **Omnichannel Autonomous Recovery Links**: Automatically dispatches pre-authenticated 1-click Razorpay payment links via WhatsApp, SMS, and Email with dynamic payment method fallbacks (Card → UPI Intent / NetBanking).
4. **Bank-Grade Financial Governance**: Enterprise-grade Maker-Checker queue ensuring that high-value transactions (> ₹10,000 or custom ceiling) require merchant approval before firing.
5. **The Non-Negotiable Rule**: `PREDICTION != RECOVERY` and `API RESPONSE != RECOVERY`. Revenue is marked as "Recovered" **only** when verified through cryptographic capture status and bank settlement webhooks.

---

## 4. The 9-Stage Recovery Lifecycle

Every failed transaction follows a strict, observable 9-stage state machine:

```mermaid
flowchart TD
    S1[1. DETECT\nWebhook Ingestion & Payload Normalized] --> S2[2. DIAGNOSE\nBank Rail Health & Error Root-Cause Extraction]
    S2 --> S3[3. SCORE\n13-Feature ML Probability Model]
    S3 --> S4[4. AI REASON\nNVIDIA Nemotron / Gemini Strategy Formulation]
    S4 --> S5{5. POLICY CHECK\nDeterministic Guardrails & Ceilings}
    
    S5 -- Passed (< High Value) --> S6[6. EXECUTE\nDynamic Retry / Razorpay PayLink Dispatch]
    S5 -- Flagged (> High Value) --> S5A[5A. MAKER-CHECKER\nEscalated to Finance Team Queue]
    S5A -- Approved --> S6
    S5A -- Rejected --> S5B[Halted & Documented]
    
    S5 -- Terminal / Fraud --> S5C[Blocked: Zero False Retries]
    
    S6 --> S7[7. VERIFY\nCryptographic Capture Polling & Webhook Confirmation]
    S7 -- Capture Success --> S8[8. MEASURE\nEBITDA Reclaimed, Fees Saved, Churn Prevented]
    S7 -- Unsuccessful --> S7A[Backoff Cooldown / Candidate Strategy 2]
    
    S8 --> S9[9. AUDIT\nImmutable Hash-Chained Financial Ledger Entry]
    S5B --> S9
    S5C --> S9
```

1. **DETECT**: Ingests gateway failure webhooks within < 50ms, deduplicating events with deterministic idempotency keys.
2. **DIAGNOSE**: Parses raw gateway error strings, matching against historical downtime models for HDFC, SBI, ICICI, Axis, and NPCI UPI nodes.
3. **SCORE**: Computes continuous recovery probability $P(\text{recovery}) \in [0.00, 1.00]$ using a 13-feature gradient-boosted scoring model.
4. **AI REASON**: Passes structured telemetry to NVIDIA Nemotron-3 Super 120B / Gemini to select the optimal recovery strategy (e.g., `SMART_RETRY`, `MULTI_CHANNEL_PAYLINK`, `GATEWAY_REROUTE`).
5. **POLICY CHECK**: Validates hardcoded safety constraints:
   - Is amount $\ge$ High-Value Review Ceiling? (Trigger Maker-Checker)
   - Have retry attempts hit the hard limit of 3? (Halt permanently)
   - Is current time in Quiet Hours (10 PM – 8 AM)? (Schedule for morning)
   - Is an active idempotency lock present? (Prevent duplicate charges)
6. **EXECUTE**: Executes the action via live Razorpay API Test Mode or audited execution providers.
7. **VERIFY**: Confirms capture status via gateway poll & cryptographic webhook validation.
8. **MEASURE**: Calculates exact recovered revenue, merchant processing fee delta, and involuntary churn mitigation.
9. **AUDIT**: Commits an immutable, SHA-256 hash-chained record to the audit ledger for audit and compliance teams.

---

## 5. Core Product Capabilities

### 5.1 Executive Revenue Command Center (`/overview`)
- **Total Revenue at Risk**: Real-time ticker of all failed volume detected.
- **Recovered Capital (INR)**: Realized, verified funds recovered into merchant accounts.
- **Active Recovery Efficiency**: Current conversion rate of recoverable transactions (typically 68% - 74%).
- **AI Diagnostic Precision**: Accuracy benchmark of root-cause predictions versus verified bank settlement outputs.
- **Involuntary Churn Deflection**: Percentage of subscription accounts saved from silent churn.
- **Live Recovery Stream**: Real-time event ticker of auto-recoveries occurring across merchant checkout pipelines.

### 5.2 Intelligent Case Management & Drawer Inspector (`/cases`)
- **Multi-Faceted Filtering**: Filter by Failure Category, Recovery Stage, Method (UPI, Card, NetBanking), Priority, and Gateway.
- **Detailed Drawer Inspector**: Slide-out case drawer with:
  - Deep transaction metadata (Bank ARN, Customer VPA/Card BIN, RRN).
  - Visual 9-stage interactive recovery timeline.
  - Raw gateway response payloads and retry attempt history.
  - One-click manual triggers (Generate PayLink, Schedule Retry, Escalate).

### 5.3 AI Diagnostics & Recovery Studio (`/ai-studio`)
- **Interactive Recovery Sandbox**: Select any failed payment scenario (or create custom ones) and trace the full 9-step decision flow in real time.
- **AI Reasoning Output**: View the exact prompt, model output, and decision rationale generated by the AI reasoning engine.
- **Feature Contribution Graph**: Inspect the relative weights assigned by the 13-feature ML model that yielded the final confidence score.

### 5.4 Maker-Checker Financial Governance (`/maker-checker`)
- **Enterprise Approval Queue**: Dedicated portal for Senior Finance Managers and Controllers.
- **Risk Ceilings**: High-value transactions (default $\ge$ ₹10,000 or custom) automatically pause here.
- **Actionable Briefs**: Finance specialists review AI diagnostic summaries, customer Lifetime Value (LTV), and credit history before clicking **Approve Recovery** or **Reject / Terminate**.

### 5.5 Deep Banking Rail & Cohort Analytics (`/analytics`)
- **Failure Root Cause Distribution**: Breakdown across NPCI drop-offs, issuer downtime, insufficient balance, and 3DS friction.
- **Gateway & Issuer Benchmarks**: Comparative recovery rates across HDFC, SBI, ICICI, Axis, and Paytm.
- **Optimal Retry Hour Analysis**: Heatmap showing recovery success probability by time-of-day and day-of-week.
- **Cohort Retention Impact**: 30/60/90-day retention comparison between recovered vs. lost users.

### 5.6 Cryptographic Immutable Audit Ledger (`/audit-ledger`)
- **Tamper-Evident Ledger**: Every autonomous action, retry, and maker-checker sign-off writes a cryptographically linked record.
- **Verification Integrity**: Contains parent hash, record hash (SHA-256), timestamp, actor identity, and audit notes for external compliance auditors (SOC 2, ISO 27001).

### 5.7 Interactive Live Gateway Simulator (`/live-simulator`)
- **Synthetic Traffic Generator**: Injects realistic transaction failure scenarios at scale (Network drops, Bank server downs, 3DS authentication timeouts).
- **Chaos Mode**: Stress-tests autonomous recovery behavior during sudden surges in bank downtimes.

### 5.8 Settings, Guardrails & Gateway Keys (`/settings`)
- **Razorpay Integration**: Enter live Razorpay Test Key ID and Secret with instant connection verification.
- **Guardrail Sliders**:
  - Maximum Retry Cap (1, 2, or 3 attempts).
  - Recovery Time Window (24h, 48h, 72h).
  - High-Value Review Ceiling (INR).
  - Maximum Auto-Recovery Amount (INR).
- **Theme Preferences**: Seamless Light, Dark, or System mode toggle with dedicated high-contrast palettes.

---

## 6. Machine Learning & Reasoning Engine

### The 13-Feature Scoring Vector ($X$)

RecoverIQ computes recovery probability $P(\text{recovery})$ via a continuous scoring model trained on historical payment lifecycle data:

```
1.  Failure Code Class        (Categorical: Technical / Issuer / User / Risk)
2.  Payment Rail Subtype      (UPI Collect vs UPI Intent vs Credit vs Debit)
3.  Bank Health Index         (Rolling 15-minute success rate of issuing bank)
4.  Transaction Amount        (Log-scaled monetary value)
5.  Customer Tenure           (Months active with merchant)
6.  Historical Success Ratio  (Historical completed transactions / attempts)
7.  Time Since Last Success   (Hours since last successful transaction)
8.  Hour of Day (IST)         (Normalized cyclical feature)
9.  Day of Week               (Accounting for salary credit cycles)
10. Attempt Sequence Count    (First failure vs second retry)
11. Device / Client Channel   (Mobile Web vs Native Android vs iOS vs Desktop)
12. 3DS Step-Up History       (Historical OTP drop-off rate for cardholder)
13. Mandate State             (E-mandate active, pending, or expired)
```

### AI Reasoning Engine

- **Primary Engine**: NVIDIA Nemotron-3 Super 120B (`nvidia/nemotron-3-super-120b-a12b`) hosted via an OpenAI-compatible API interface.
- **Secondary Engine**: Google Gemini API via `@google/genai` TypeScript SDK.
- **Deterministic Heuristic Fallback**: Zero external dependency fallback ensuring 100% platform availability even during upstream LLM provider outages.

---

## 7. Deterministic Financial Safety Guardrails

While AI formulates strategy, **hard deterministic rules enforce execution boundaries**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │            RecoverIQ Deterministic Safety Matrix            │
 ├────────────────────────────┬────────────────────────────────┤
 │ Safety Guardrail           │ Hard Enforcement Logic         │
 ├────────────────────────────┼────────────────────────────────┤
 │ Double-Charge Lock         │ Idempotency token per (tx_id,  │
 │                            │ attempt_num); 60s mutex lock   │
 ├────────────────────────────┼────────────────────────────────┤
 │ Absolute Retry Limit       │ Strict hard ceiling = 3.       │
 │                            │ Halts permanently on Attempt 4 │
 ├────────────────────────────┼────────────────────────────────┤
 │ High-Value Threshold       │ Amount >= ₹10,000 requires      │
 │                            │ human Maker-Checker sign-off   │
 ├────────────────────────────┼────────────────────────────────┤
 │ Auto-Recovery Ceiling      │ Max autonomous limit = ₹25,000 │
 │                            │ Anything higher is escalated   │
 ├────────────────────────────┼────────────────────────────────┤
 │ Quiet Hours Policy         │ 10:00 PM - 8:00 AM IST:        │
 │                            │ SMS/WhatsApp outreach paused   │
 ├────────────────────────────┼────────────────────────────────┤
 │ Terminal Reason Guard      │ Zero retries on `LOST_CARD`,   │
 │                            │ `STOLEN_CARD`, `FRAUD_BLOCK`   │
 └────────────────────────────┴────────────────────────────────┘
```

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Browser (SPA)                              │
│   React 18 + TypeScript + Tailwind CSS v4 + Motion + Lucide Icons           │
│   Theme Context (Light / Dark / System) + Responsive Desktop & Mobile        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST API (Port 3000)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Full-Stack Express + Node.js Server                      │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────┐  ┌────────────────┐  │
│  │   Webhook Ingestor    │  │  13-Feature ML Scorer  │  │ Deterministic  │  │
│  │   (/api/webhooks/*)   │  │  P(recovery) Engine    │  │ Policy Engine  │  │
│  └──────────┬────────────┘  └───────────┬────────────┘  └───────┬────────┘  │
│             │                           │                       │           │
│  ┌──────────▼────────────┐  ┌───────────▼────────────┐  ┌───────▼────────┐  │
│  │  AI Reasoning Engine  │  │  Execution Provider    │  │ Immutable      │  │
│  │  (NVIDIA / Gemini)    │  │  (Razorpay / Simulated)│  │ Audit Ledger   │  │
│  └───────────────────────┘  └────────────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Business Impact & ROI

For a mid-market merchant processing **₹2 Crore (~$240k USD) monthly**:

| Metric | Before RecoverIQ | With RecoverIQ | Monthly Impact |
| :--- | :--- | :--- | :--- |
| **Gross Invoiced Volume** | ₹2,00,00,000 | ₹2,00,00,000 | Baseline |
| **Payment Failure Rate** | 18% (₹36,00,000 at risk) | 18% (₹36,00,000 at risk) | High failure rate |
| **Recovered Revenue** | ~₹3,50,000 (9.7% via manual email) | **₹25,92,000 (72% autonomous)** | **+₹22,42,000 / month** |
| **Involuntary Churn** | 8.2% monthly | **3.8% monthly** | **-53% churn reduction** |
| **Manual CS Hours Spent** | 85 hours / month | **< 3 hours / month** | **96% time saved** |
| **Annualized Net Reclaimed**| — | — | **~₹2.69 Crore / year** |

---

## 10. Quick Start & Local Setup

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/recoveriq.git
cd recoveriq

# Install dependencies
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env` if you wish to configure live third-party keys:
```bash
cp .env.example .env
```

```env
# Optional: Live Razorpay Test Mode Keys (can also be entered in Settings UI)
RAZORPAY_KEY_ID=rzp_test_yourKeyId
RAZORPAY_KEY_SECRET=yourKeySecret

# Optional: NVIDIA Nemotron Endpoint (gracefully falls back to heuristic engine)
NVIDIA_API_KEY=nvapi-yourApiKey
```

### 3. Start Development Server
```bash
npm run dev
```

The application will start at:
👉 **`http://localhost:3000`**

### 4. Production Build
```bash
npm run build
npm start
```

---

## 11. Security, Privacy & RBI Compliance

- **Zero Sensitive Card Data Storage**: RecoverIQ never stores Card PANs, CVVs, or OTPs. All card references rely on sanitized last-4 digits, card network brands, and masked BINs in compliance with RBI Tokenization mandates.
- **Masked PII**: Customer phone numbers and email addresses are masked by default (`ana***@gmail.com`, `+91 ••••• ••891`) across logs and views.
- **Scoped API Permissions**: Gateway keys are stored in encrypted server memory and used exclusively with read and payment-link write scopes.
- **Cryptographic Event Integrity**: Audit ledger records are linked via SHA-256 hashes to prevent log tampering or retrospective alteration.

---

## 12. Product Roadmap

- [x] **v1.0**: 9-Stage Recovery State Machine, 13-Feature ML Scoring, AI Studio.
- [x] **v1.1**: Enterprise Maker-Checker High-Value Governance Queue.
- [x] **v1.2**: Razorpay Test Mode Live API Connection & Webhook Ingestion.
- [x] **v1.3**: Cryptographic Tamper-Evident Audit Ledger.
- [x] **v1.4**: Full Dark Mode & High-Contrast Visual System.
- [ ] **v2.0**: Native WhatsApp Business Cloud API automated 1-click checkout templates.
- [ ] **v2.1**: Automated UPI Autopay Pre-Debit Notification (RBI compliance) auto-recovery scheduler.
- [ ] **v2.2**: Multi-Gateway Dynamic Routing (Seamless failover from Primary Gateway $\to$ Secondary Gateway on 5xx downtime).

---

<div align="center">
  <p><strong>RecoverIQ</strong> — Built with craftsmanship for the future of digital payments.</p>
  <p><sub>Developed for the Razorpay Buildathon 2026. All rights reserved.</sub></p>
</div>
