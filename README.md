# Dermavant (Aetheris Health)

**Free Google Gemini-Powered Dermatology Triage & Digital Healthcare Ecosystem** — connecting patients to preliminary multimodal skin triage, licensed doctors, nearby clinics/pharmacies, and verified medicine in one platform.

**Author / Technical Lead:** Sanusi Shafii  
**Showcase Event:** GDG Yola DevFest 2026

---

## Overview

Access to dermatologists and verified medication is severely limited across many communities in Northern Nigeria and underserved regions. **Dermavant** combines free-tier Google AI tooling with a role-based digital health platform containing four access-controlled portals (**Patient**, **Doctor**, **E-Pharmacy Partner**, and **Admin**).

### Free Google Tools Architecture

Dermavant's AI and ML workflows depend exclusively on **free-tier Google tools**:

| Tool | Role in Dermavant |
|---|---|
| **Google Gemini API (Free Tier)** | Multimodal skin image + text triage (`gemini-4-hydrogen`), structured JSON guardrails, and doctor research assistant via `@google/genai` |
| **Gemini Embeddings (`gemini-embedding-2`)** | Vector RAG retrieval over 120+ condition-tagged dermatology reference chunks in `knowledge_base-1.json` |
| **Google AI Studio** | Prompt engineering, `responseSchema` prototyping, and free API key management |
| **Google Colab / Kaggle Free T4 GPU** | Experimental EfficientNet-B0 CNN notebooks (`notebooks/01_isic_lesion_risk_kaggle.ipynb`, `notebooks/02_scin_common_triage_kaggle.ipynb`) for clinician-review research |

> **Supporting free-tier web infrastructure:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Clerk (free tier RBAC), MongoDB Atlas (free tier M0), OpenStreetMap / Leaflet + Nominatim (free open maps & geocoding), and Paystack (test mode).

---

## Core Portals & Implemented Features

- **Patient Portal (`/patient/*`):** Multimodal AI dermatology consultation (text + voice input/TTS + image upload up to 3 MB), specialist booking, nearby doctors/pharmacies map discovery, e-pharmacy marketplace, wallet, and medical history with PDF export.
- **Doctor Portal (`/doctor/*`):** Appointment management, consultation room, multimodal Google Gemini Medical Research Chat with history, practice location editor, KYC, and earnings wallet.
- **E-Pharmacy Partner Portal (`/pharmacy/*`):** Medicine catalogue CRUD, inventory management, order fulfillment, KYC, and earnings wallet.
- **Admin Portal (`/admin/*`):** User management, KYC verification, platform stats/revenue, audit logs, and support ticket handling.
- **Credential uploads:** Doctor and pharmacy KYC supports private PDF/JPG/PNG documents up to 5 MB per file. The owner and authorized admins download documents through an authenticated route.

### Private KYC document storage

In the **Dermavant Vercel project**, create a **private** Blob store under **Storage** and enable its read-write token environment variable. Connect it to the environments where uploads will run; Vercel provides `BLOB_READ_WRITE_TOKEN`. Add that variable to `.env.local` for local development, and never commit its value. Redeploy after connecting the store. Uploads are rejected until the private store is configured.

---

## Getting Started

```bash
git clone https://github.com/sanusishafii989/Dermavant.git
cd Dermavant
npm install
npm run typecheck
npm run lint
npm test
npm run dev
```

---

## Author

**Sanusi Shafii** — Creator & Technical Lead  
Built for **GDG Yola DevFest 2026**
