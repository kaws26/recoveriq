# RecoverIQ — AI Revenue Recovery Platform

> **Recover lost revenue intelligently.**
> Built for the **Razorpay Buildathon — Track 03: AI Revenue Recovery**

---

## 🌟 Executive Summary

When online transactions fail due to gateway timeouts, bank downtimes, insufficient balances, or expired cards, merchants suffer silent revenue leakage and customer churn. Traditional solutions either blindly retry (risking double-charges, bank rate limits, and fee penalties) or abandon the recovery entirely.

**RecoverIQ** detects revenue at risk, diagnoses failure codes, scores recovery likelihood using a 13-feature machine learning model, leverages **NVIDIA Nemotron-3 Super 120B** for autonomous reasoning, enforces **deterministic financial guardrails**, executes recovery actions via verified simulation or Razorpay Test Mode, and records an immutable audit ledger.

---

## 🏗️ Architecture & Recovery Journey

```mermaid
flowchart TD
    A[Failed Payment Ingested] --> B[Diagnosis & Feature Extraction]
    B --> C[ML Probability Scoring\nXGBoost P(recovery)]
    C --> D[AI Reasoning Engine\nNVIDIA Nemotron / Fallback]
    D --> E{Deterministic Policy Engine\nFinancial Guardrails}
    E -- Passed --> F[Execution Provider\nSimulation / Razorpay Test Mode]
    E -- High Value > ₹25k --> G[VIP Specialist Escalation]
    E -- Max Retries >= 3 --> H[Terminal Policy Block]
    F --> I[Outcome Verification Engine\nPREDICTION != RECOVERY]
    I -- Verified Success --> J[Revenue Recovered Recorded]
    I -- Failed --> K[Cooldown / Next Candidate Strategy]
    J --> L[Immutable Audit Trail & Ledger]
    G --> L
    H --> L
```

---

## 🚀 Key Features

1. **AI Command Center**: Live interactive case analyzer demonstrating the 9-stage recovery lifecycle (`DETECT` → `DIAGNOSE` → `SCORE` → `DECIDE` → `POLICY CHECK` → `EXECUTE` → `VERIFY` → `MEASURE` → `AUDIT`).
2. **Deterministic Guardrails**: Hardcoded financial safety rules (Double-charge lock, Max retries = 3, Auto-recovery ceiling ₹25,000, High-value threshold ₹10,000, Quiet hours).
3. **ML Scoring Model**: 13-feature XGBoost probability engine estimating $P(\text{successful\_recovery})$.
4. **NVIDIA Nemotron Integration**: `nvidia/nemotron-3-super-120b-a12b` via OpenAI-compatible SDK endpoint with graceful deterministic fallback.
5. **Execution Verification**: Strict rule: `PREDICTION != RECOVERY` and `API RESPONSE != RECOVERY`. Revenue is only counted upon cryptographic capture verification.
6. **Multi-Tenant Isolation**: Merchant-level scoping for all queries and settings.

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Dev Server
npm run dev

# 3. Open Web UI
# http://localhost:3000
```
