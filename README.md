# Aetheris Health

**AI-Powered Digital Healthcare Ecosystem** — connecting patients to instant dermatological triage, licensed doctors, and verified medicine, all in one platform.

Built by **Danhaire Medical Services** | Founder: Ibrahim Hussaini Danhaire
NextGen Innovation Challenge 2026 — National Showcase, Abuja

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [The Four Portals](#the-four-portals)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Build Status](#build-status)
- [Development Workflow](#development-workflow)
- [Team](#team)
- [License](#license)

---

## Overview

Aetheris Health is a single web platform that splits into **four independently-authenticated portals** — Patient, Doctor, E-Pharmacy (Partner), and Admin — all sharing one backend and one design system. Patients get AI-assisted dermatological triage, can book licensed specialists, and purchase verified medicine, all with a persistent medical history and integrated payments.

## The Problem

- Long travel distances and high costs to reach qualified medical practitioners
- Limited access to specialist and dermatology expertise, especially in underserved/rural areas
- No verifiable channel for genuine medication, leading to unsafe self-sourcing
- Delayed triage and self-medication drive preventable, higher-cost medical emergencies

## Our Solution

AI-assisted dermatology triage, specialist video/voice/chat booking, QR-verified e-pharmacy, GPS-based provider discovery, integrated payments (Paystack), and a persistent medical history — one continuous patient journey instead of fragmented, single-purpose tools.

---

## The Four Portals

### 🧑‍⚕️ Patient Portal
AI dermatology consultation, specialist booking, nearby doctor/pharmacy discovery, e-pharmacy marketplace, wallet, medical history archive.

### 👨‍⚕️ Doctor Portal
Appointment management, patient consultation (video/voice/chat), earnings dashboard, wallet, professional research chatbot.

### 💊 E-Pharmacy Portal (Partner/Pharmacist)
Medicine catalogue management, order fulfillment, delivery coordination, patient messaging, commission tracking.

### 🛡️ Admin Portal
User/account management across all roles, platform-wide analytics, support ticket handling, audit logs, privilege control.

Each portal has its own login/signup flow and is strictly access-controlled — no user can view or act outside their assigned role, enforced server-side on every request, not just hidden in the UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React, TypeScript |
| Styling | Tailwind CSS — custom health-tech design system (dark mode, glassmorphism) |
| Backend | Next.js API Routes (Node.js) |
| Database | MongoDB (via MongoDB Atlas) + Mongoose ODM |
| Authentication | Clerk (role-based access control) |
| AI | Groq API (dermatology-focused triage; previously Gemini — see [Migration Notes](#build-status)) |
| Payments | Paystack (card + bank transfer, Nigeria) |
| Maps (planned) | OpenStreetMap / Leaflet |

### Design System
- Deep Navy Blue `#023047`
- Dark Background `#000814`
- Medical Cyan `#219EBC`
- Gold Accent `#FFB703`
- White `#FFFFFF`
- Style: glassmorphism cards, rounded corners, soft shadows, dark-mode default

---

## Project Structure

```
aetheris-health/
├── app/
│   ├── patient/            # Patient portal pages
│   ├── doctor/              # Doctor portal pages
│   ├── pharmacy/            # E-Pharmacy portal pages (role: "partner")
│   ├── admin/                # Admin portal pages
│   ├── api/
│   │   ├── ai/chat/          # Dermatology AI consultation endpoint
│   │   ├── appointments/     # Booking endpoints
│   │   ├── doctors/          # Doctor directory endpoint
│   │   ├── payment/paystack/ # Payment init/verify/webhook
│   │   └── dev/seed-roles/   # Dev-only test data seeding
│   ├── sign-in/, sign-up/    # Clerk auth pages
│   └── middleware.ts         # Role-based route protection
├── components/
│   ├── ui/                   # Shared design-system primitives
│   ├── patient/, doctor/, pharmacy/, admin/  # Portal-specific components
├── models/                   # Mongoose schemas (User, Patient, Doctor, Partner,
│                                Admin, Wallet, Appointment, AIReport, Payment...)
├── lib/
│   ├── db.ts                 # MongoDB connection
│   ├── paystack.ts           # Paystack helper + validation
│   └── ai/guardrails.ts      # AI response validation/safety layer
└── .env.local                # Environment config (never committed)
```

---

## Database Schema

Core collections in MongoDB: `users`, `patients`, `doctors`, `partners`, `admins`, `wallets`, `appointments`, `aireports`, `payments`, and (planned) `medicines`, `pharmacy_orders`, `notifications`, `support_tickets`, `audit_logs`.

Each role (`patient`, `doctor`, `partner`, `admin`) has a dedicated collection linked 1:1 to a central `User` record via `user_id`. Full field-level schema is defined in `/models`.

---

## Getting Started

### Prerequisites
- Node.js (LTS version)
- A MongoDB Atlas account and cluster
- A Clerk account (for authentication)
- A Groq API key (for AI consultation)
- A Paystack account with test-mode API keys

### Installation

```bash
git clone <repo-url>
cd aetheris-health
npm install
```

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) below — get actual values from the project owner, never commit this file).

```bash
npm run dev
```

Visit `http://localhost:3000`. Confirm the terminal reports the app is running on port 3000 with no fallback port — if it doesn't, check for and kill any stray Node processes before continuing.

---

## Environment Variables

```env
# Database
MONGODB_URI=                     # MongoDB Atlas standard (non-SRV) connection string

# Authentication (Clerk)
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# AI (Groq)
GROQ_API_KEY=

# Payments (Paystack — TEST keys only in development)
PAYSTACK_SECRET_KEY=              # sk_test_...
PAYSTACK_PUBLIC_KEY=              # pk_test_...

# Dev-only test data seeding
DEV_SEED_ROLES=true
DEV_SEED_SECRET=
DOCTOR_CLERK_ID=
PATIENT_CLERK_ID=
PARTNER_CLERK_ID=
ADMIN_CLERK_ID=
UPDATE_CLERK_METADATA=true
```

> ⚠️ **Note on `MONGODB_URI`:** this project uses the **standard (non-SRV)** connection string format (`mongodb://...` with explicit shard hosts), not `mongodb+srv://`. This was a deliberate fix for a network-specific DNS issue. If your network handles SRV lookups fine, `mongodb+srv://` may also work for you — but don't change the shared default without checking with the team first.

> ⚠️ **Note on Paystack keys:** the app validates that keys start with `sk_test_`/`pk_test_` and will fail early if a live key is used. Keep it that way until we're deliberately ready for production.

---

## Build Status

Full, current, honest status of every feature — see the companion documents in the repo root:
- **`AETHERIS_HEALTH_Project_Roadmap.md`** — plain-language breakdown of every portal, feature, and technology choice, for the whole team including non-technical stakeholders.
- **`AETHERIS_HEALTH_Team_Handoff.md`** — detailed technical status, environment setup, and a record of debugging history (notably the AI provider migration from Gemini to Groq, and the local dev environment fixes around MongoDB Atlas connectivity).

**Quick summary:**
| Area | Status |
|---|---|
| Auth & role-based routing (all 4 portals) | ✅ Done, verified |
| Patient dashboard | ✅ Done |
| Doctor booking flow (end-to-end, DB-verified) | ✅ Done |
| Paystack payment integration | ✅ Done, verified (success + failure paths) |
| AI dermatology consultation | ✅ In progress (Ahmed) |
| E-Pharmacy marketplace | ⬜ Not started |
| Doctor/Partner/Admin full feature sets | ⬜ Not started |
| Telemedicine (video/voice calling) | ⬜ Not started, provider not yet chosen |
| Maps/geolocation | ⬜ Not started |

---

## Development Workflow

- Each contributor works on a feature branch: `git checkout -b feature/short-description`
- Open a Pull Request before merging to `main`, even for small changes
- **Always tag another team member on any PR touching `middleware.ts`, files under `/models`, or shared config** — these are foundational and easy to silently break for someone else
- Run `npm run build` locally before opening a PR — it must pass with zero errors
- Test actual runtime behavior (not just build success) before marking any feature complete — click through it, check the Network tab, and verify data lands correctly in MongoDB Atlas

---

## Team

| Name | Role |
|---|---|
| **Ibrahim Hussaini Danhaire** | Founder, Danhaire Medical Services — Project Owner |
| **MD Sanusi Shafii** | Technical Lead / Build Direction |
| **Ahmed** | Technical Collaborator |

---

## License

**Confidential — Internal & Development Use Only.** This project and its source code are the property of Danhaire Medical Services. Not licensed for external use, distribution, or reproduction without written permission from the project owner.
