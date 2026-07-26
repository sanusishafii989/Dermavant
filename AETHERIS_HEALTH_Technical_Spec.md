# Aetheris Health Ecosystem — Technical Specification
**Prepared from:** founder wireframes (9 photos), SRS v2.0, Investor One-Pager
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + Node/Express API + MongoDB + Clerk Auth
**Target:** Working MVP in 2–3 days

---

## 1. Project Scope Summary

Aetheris Health is **one main landing site** that branches into **four independently-authenticated portals**, all sharing a design system (Deep Navy `#023047`, Dark BG `#000814`, Medical Cyan `#219EBC`, Gold Accent `#FFB703`, glassmorphism cards, rounded corners, dark-mode default).

```
Main Website (Landing Page)
        │
        ├── Patient Portal
        ├── Doctor Portal
        ├── E-Pharmacy Portal (Pharmacist)
        └── Admin Portal
```

Each portal has its **own login/signup flow** (Clerk, with custom roles/metadata) but shares one MongoDB backend. A per-user **wallet** (funded via Paystack, later Korapay) is the financial backbone connecting consultations, AI suite fees, and pharmacy purchases.

---

## 2. The Four Portals & Core Features

### 2.1 Patient Portal
| Area | Features (from wireframes + SRS) |
|---|---|
| **Landing/Home** | Welcome message, service cards (AI Consultation, Clinical AI Suite, Nearby Doctors w/ GPS+distance, Nearby Pharmacies, Book Specialist, E-Pharmacy, Medical History, Emergency SOS), notification icon, wallet quick-balance, recent activity |
| **Profile** | Username, category, photo, phone, address, password reset, add/remove optional profile fields |
| **Find Doctor / Consultation** | Browse doctors, choose modality: **video / voice / chat**; symptoms & pain description shared with doctor pre-call |
| **Clinical AI Suite** | Upload skin image → pre-trained image model + knowledge-base JSON + **Gemini LLM** → ranked diagnosis, confidence, precautions → patient can continue chatting with the LLM for more detail/medicine guidance (always non-prescriptive per SRS §14.6) |
| **Specialist Booking** | Choose specialty → doctor → date/time → pay → confirmation |
| **E-Pharmacy (buy side)** | Search drug/product catalogue; if item not found **locally in-catalog, alert & route request to nearby pharmacist**; payment required per item before fulfilment; delivery tracking |
| **Wallet** | Top-up / withdraw via **Paystack or Korapay**, transaction history |
| **Medical History** | Consultation archive, AI reports (PDF), prescriptions |
| **Notifications, Logout** | Standard |

### 2.2 Doctor Portal
| Area | Features |
|---|---|
| **Profile** | Name, phone, email, main location, availability toggle, password reset, add/remove feature fields |
| **Home/Dashboard** | Wallet balance, upcoming appointments, monthly earnings total, incoming messages, ecosystem logo/branding |
| **Appointments** | Accept / reschedule with patient, view full patient details, start virtual consultation (video/voice/chat) |
| **In-Person Mode note** | For physical consults doctor maintains hospitality/policy standards (captured as a profile compliance flag, not code logic) |
| **Wallet** | **Instant withdrawal** of earnings, transaction ledger |
| **Doctor Research Chatbot** | Professional AI assistant (Gemini) to help doctors do quick clinical research — separate from patient-facing AI |
| **Notifications, Logout** | Standard |

### 2.3 E-Pharmacy Portal (Pharmacist)
| Area | Features |
|---|---|
| **Profile / Store Profile** | Pharmacist name, all pharmacy-relevant info, current condition/status of store, policy terms, **earning commission rate** display |
| **Home/Dashboard** | Welcome message, store item counts, catalogue summary, unique pharmacist menu bar |
| **Catalogue Management** | Add / update / remove drugs & products, set price, stock, expiry, QR verification code, images |
| **Orders / Messaging** | Receive patient demand messages, chat with patient (customer), coordinate **doorstep delivery** |
| **Wallet** | Earnings, commission tracking, withdrawal |
| **Notifications, Logout** | Standard |

### 2.4 Admin Portal
| Area | Features |
|---|---|
| **Admin Profile** | Name, email, phone, admin-level (UI level), password/detail reset |
| **Dashboard (Home)** | Whole-portal design/colour consistency control panel, platform stats |
| **Account Management** | Manage all Patients, Doctors, Pharmacists — view/edit managed info, verify credentials, suspend/delete |
| **Privilege & Privacy Control** | Role-based access control across whole system; every user accountable for their activity (audit log) |
| **Admin Wallet** | Platform revenue, commission tracking view |
| **Support System** | Inbound user queries/complaints queue, admin can respond or escalate |
| **Notifications, Logout** | Standard |

### Cross-Portal (from SRS, applies to all 4)
- JWT session via Clerk; BCrypt not needed (Clerk handles hashing) but Clerk sessions must map to Mongo `role`.
- Phone number masking in staff-facing views.
- 99.9% uptime target, <3s response, AI responses <10s (aspirational for MVP, not hard-gated).

---

## 3. Business Model Constants (bake into config, not hardcoded logic)
```
CLINICAL_AI_SUITE_FEE   = ₦3,000
CONSULT_FEE_VIDEO       = ₦5,000
CONSULT_FEE_VOICE       = ₦3,000
CONSULT_FEE_CHAT        = ₦2,000
SPECIALIST_COMMISSION   = 30%
PHARMACY_MARGIN         = ~25%
```

---

## 4. MongoDB Database Schema

Using Mongoose. Central `User` doc + role-specific extension collections (1:1), consistent with SRS §11.1.

```ts
// ===== users =====
User {
  _id: ObjectId,
  clerkId: string,           // unique, indexed
  fullName: string,
  email: string,             // unique, indexed
  phone: string,
  role: "patient" | "doctor" | "pharmacist" | "admin",
  profilePhoto?: string,
  gender?: string,
  dateOfBirth?: Date,
  country?: string,
  state?: string,
  city?: string,
  status: "active" | "suspended" | "pending_verification",
  createdAt: Date,
  updatedAt: Date
}

// ===== patients =====
Patient {
  _id: ObjectId,
  userId: ObjectId (ref User, unique),
  bloodGroup?: string,
  allergies?: string[],
  height?: number,
  weight?: number,
  medicalHistorySummary?: string,
  emergencyContact?: { name: string, phone: string },
  walletId: ObjectId (ref Wallet)
}

// ===== doctors =====
Doctor {
  _id: ObjectId,
  userId: ObjectId (ref User, unique),
  licenseNumber: string,
  specialization: string,
  hospital?: string,
  experienceYears: number,
  consultationFees: { video: number, voice: number, chat: number },
  rating: number (default 0),
  bio?: string,
  verificationStatus: "pending" | "verified" | "rejected",
  location: { type: "Point", coordinates: [lng, lat] },  // GeoJSON, 2dsphere index
  availableToday: boolean,
  onlineStatus: boolean,
  walletId: ObjectId (ref Wallet)
}

// ===== pharmacists (partners) =====
Pharmacist {
  _id: ObjectId,
  userId: ObjectId (ref User, unique),
  businessName: string,
  licenseNumber: string,
  ownerName: string,
  address: string,
  location: { type: "Point", coordinates: [lng, lat] },
  commissionRate: number,   // e.g. 0.25
  rating: number,
  verificationStatus: "pending" | "verified" | "rejected",
  storeStatus: "open" | "closed",
  walletId: ObjectId (ref Wallet)
}

// ===== admins =====
Admin {
  _id: ObjectId,
  userId: ObjectId (ref User, unique),
  adminLevel: "super" | "standard",
  permissions: string[]     // e.g. ["manage_users","manage_payments","manage_support"]
}

// ===== wallets =====
Wallet {
  _id: ObjectId,
  ownerId: ObjectId (ref User),
  ownerRole: "patient" | "doctor" | "pharmacist" | "admin",
  balance: number (default 0),   // store in kobo/lowest unit to avoid float error
  currency: "NGN",
  updatedAt: Date
}

// ===== wallet_transactions =====
WalletTransaction {
  _id: ObjectId,
  walletId: ObjectId (ref Wallet),
  type: "credit" | "debit",
  purpose: "topup" | "withdrawal" | "consultation_payment" | "ai_suite_payment"
          | "pharmacy_order" | "commission" | "refund",
  amount: number,
  reference: string (unique),   // Paystack/Korapay ref
  gateway: "paystack" | "korapay" | "internal",
  status: "pending" | "success" | "failed",
  relatedEntity?: { kind: string, id: ObjectId },
  createdAt: Date
}

// ===== appointments =====
Appointment {
  _id: ObjectId,
  patientId: ObjectId (ref Patient),
  doctorId: ObjectId (ref Doctor),
  date: Date,
  time: string,
  type: "video" | "voice" | "chat",
  fee: number,
  paymentStatus: "unpaid" | "paid" | "refunded",
  consultationStatus: "pending" | "accepted" | "rescheduled" | "completed" | "cancelled",
  meetingLink?: string,
  symptomsNote?: string,
  createdAt: Date
}

// ===== ai_reports =====
AIReport {
  _id: ObjectId,
  patientId: ObjectId (ref Patient),
  type: "chat_triage" | "clinical_ai_suite",
  inputSymptoms?: string,
  imagePath?: string,
  knowledgeBaseMatches?: string[],
  diagnosis: [{ condition: string, confidenceScore: number }],
  recommendation: string,
  followUpGuidance?: string,
  feePaid: number,
  generatedAt: Date
}

// ===== chat_messages ===== (AI + doctor-patient + pharmacist-patient, generic)
ChatMessage {
  _id: ObjectId,
  threadId: ObjectId,           // groups a conversation
  threadType: "ai_triage" | "doctor_patient" | "pharmacist_patient" | "doctor_ai_research",
  senderId: ObjectId,
  senderRole: string,
  content: string,
  attachments?: string[],
  readAt?: Date,
  createdAt: Date
}

// ===== medicines =====
Medicine {
  _id: ObjectId,
  pharmacistId: ObjectId (ref Pharmacist),
  name: string,
  brand?: string,
  category: string,
  price: number,
  quantity: number,
  expiryDate: Date,
  description?: string,
  qrCode: string,           // unique authenticity code
  image?: string,
  status: "active" | "out_of_stock" | "delisted",
  createdAt: Date,
  updatedAt: Date
}

// ===== pharmacy_orders =====
PharmacyOrder {
  _id: ObjectId,
  patientId: ObjectId (ref Patient),
  pharmacistId: ObjectId (ref Pharmacist),
  items: [{ medicineId: ObjectId, name: string, qty: number, unitPrice: number }],
  total: number,
  deliveryStatus: "pending" | "processing" | "dispatched" | "delivered" | "cancelled",
  paymentStatus: "unpaid" | "paid" | "refunded",
  deliveryAddress: string,
  trackingNumber?: string,
  createdAt: Date
}

// ===== drug_requests ===== (when patient searches and item not found)
DrugRequest {
  _id: ObjectId,
  patientId: ObjectId (ref Patient),
  drugName: string,
  notifiedPharmacistIds: [ObjectId],
  status: "open" | "fulfilled" | "closed",
  createdAt: Date
}

// ===== reviews =====
Review {
  _id: ObjectId,
  patientId: ObjectId (ref Patient),
  targetType: "doctor" | "pharmacist",
  targetId: ObjectId,
  rating: number (1-5),
  comment?: string,
  createdAt: Date
}

// ===== notifications =====
Notification {
  _id: ObjectId,
  userId: ObjectId (ref User),
  title: string,
  message: string,
  type: "appointment" | "payment" | "consultation" | "order" | "delivery"
      | "ai_report" | "emergency" | "support",
  status: "unread" | "read",
  createdAt: Date
}

// ===== support_tickets =====
SupportTicket {
  _id: ObjectId,
  userId: ObjectId (ref User),
  subject: string,
  message: string,
  status: "open" | "in_progress" | "resolved",
  adminResponse?: string,
  respondedBy?: ObjectId (ref Admin),
  createdAt: Date,
  updatedAt: Date
}

// ===== audit_logs =====
AuditLog {
  _id: ObjectId,
  actorId: ObjectId (ref User),
  actorRole: string,
  action: string,          // "user_suspended", "medicine_deleted", "payout_approved"...
  targetType?: string,
  targetId?: ObjectId,
  metadata?: object,
  createdAt: Date
}
```

**Indexes to add day 1:** `User.email` (unique), `User.clerkId` (unique), `Doctor.location` (2dsphere), `Pharmacist.location` (2dsphere), `Appointment.{patientId,doctorId,date}`, `Medicine.pharmacistId`, `WalletTransaction.reference` (unique).

---

## 5. Folder Structure

```
aetheris-health/
├── apps/
│   ├── web/                          # Next.js 15 app (all 4 portals)
│   │   ├── app/
│   │   │   ├── (marketing)/          # main landing page
│   │   │   │   └── page.tsx
│   │   │   ├── patient/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── consultation/page.tsx
│   │   │   │   ├── ai-suite/page.tsx
│   │   │   │   ├── booking/page.tsx
│   │   │   │   ├── pharmacy/page.tsx
│   │   │   │   ├── wallet/page.tsx
│   │   │   │   ├── history/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   ├── doctor/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── appointments/page.tsx
│   │   │   │   ├── consultation-room/[id]/page.tsx
│   │   │   │   ├── wallet/page.tsx
│   │   │   │   ├── research-chat/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   ├── pharmacy/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── catalogue/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── wallet/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── doctors/page.tsx
│   │   │   │   ├── pharmacists/page.tsx
│   │   │   │   ├── support/page.tsx
│   │   │   │   ├── audit-logs/page.tsx
│   │   │   │   └── profile/page.tsx
│   │   │   ├── sign-in/[[...rest]]/page.tsx
│   │   │   ├── sign-up/[[...rest]]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shared design-system primitives
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── pharmacy/
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── db.ts                 # mongoose connect
│   │   │   ├── clerk.ts
│   │   │   ├── paystack.ts
│   │   │   ├── gemini.ts
│   │   │   └── utils.ts
│   │   ├── models/                   # mongoose schemas (from section 4)
│   │   ├── middleware.ts             # Clerk route protection + role gating
│   │   ├── public/
│   │   └── tailwind.config.ts
│   └── api/                          # (optional separate Express service
│       │                               if you split BE from Next API routes)
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── middleware/
│       │   └── server.ts
│       └── package.json
├── packages/
│   └── shared-types/                 # TypeScript interfaces shared web+api
├── .env.local
├── package.json
└── README.md
```

> **Recommendation for a 2–3 day MVP:** skip the separate `apps/api` Express service. Use **Next.js Route Handlers** (`app/api/.../route.ts`) as your backend — same repo, same deploy, zero CORS config, and you still get full Node/Express-style control. Add a standalone Express service later only if you need long-running workers (e.g. AI image processing queue).

---

## 6. Step-by-Step Build Order

**Day 1 — Foundation & Patient Core**
1. Repo scaffold, Tailwind theme (colors/fonts from §6.2 of SRS), shared UI kit (Button, Card, Input, Modal, Sidebar, Navbar).
2. Clerk auth wired for 4 roles (custom `publicMetadata.role`), sign-in/up pages, middleware route protection per portal.
3. MongoDB connection + all Mongoose models from §4.
4. Patient: Home/dashboard shell, Profile, Wallet (Paystack top-up + verify webhook).

**Day 1–2 — Doctor & Booking Loop**
5. Doctor: profile, dashboard, availability toggle.
6. Specialist Booking flow end-to-end: choose doctor → slot → pay from wallet → appointment created → doctor sees it → accept/reschedule.
7. Notification model wired to booking events (in-app only for MVP; email/SMS later).

**Day 2 — AI Consultation + Pharmacy**
8. AI Consultation (text) using Gemini API — symptom chat → structured summary → stored `AIReport`.
9. Clinical AI Suite (image upload) — same pipeline + image input, fee deduction from wallet.
10. Pharmacist portal: catalogue CRUD, store profile.
11. Patient E-Pharmacy: browse/search catalogue, cart, pay, `PharmacyOrder` created; "not found" → `DrugRequest` fan-out to nearby pharmacists.

**Day 2–3 — Admin & Polish**
12. Admin: dashboard stats, user/doctor/pharmacist management (verify/suspend), Support ticket queue.
13. Geolocation: nearby doctors/pharmacies using `2dsphere` + browser geolocation API (Google Maps or Leaflet/OpenStreetMap for MVP — OSM is free, faster to ship).
14. Doctor–patient and pharmacist–patient chat (simple polling or Socket.io if time allows; polling is fine for MVP).
15. Doctor research chatbot (Gemini, separate system prompt, no patient data by default).
16. QA pass: role-gated routing, empty states, mobile responsiveness, seed demo data, deploy (Vercel + MongoDB Atlas).

---

## 7. Full Component Checklist

**Shared/UI kit:** Navbar, Sidebar (collapsible, portal-specific links), Card, Button, Modal, Toast, Avatar, Badge (status pill), StatCard, EmptyState, LoadingSkeleton, WalletBalanceWidget, NotificationBell+Dropdown, RatingStars.

**Patient:** LandingHero, ServiceCardGrid, DoctorCard, DoctorFilterBar, BookingCalendar/TimeSlotPicker, ConsultationTypeSelector, AIChatWindow, AIImageUploader, AIReportCard, MedicineCard, MedicineSearchBar, CartDrawer, DrugRequestForm, MedicalHistoryTimeline, WalletTopupModal, MapNearbyView.

**Doctor:** DoctorDashboardStats, AppointmentList/Card, AppointmentActionButtons (accept/reschedule), ConsultationRoom (video/voice/chat shell), PatientDetailPanel, EarningsChart, DoctorWalletWithdrawModal, ResearchChatWindow.

**Pharmacy:** PharmacyDashboardStats, MedicineForm (add/edit), InventoryTable, OrderList/Card, OrderStatusUpdater, PharmacistChatWindow, CommissionSummaryCard.

**Admin:** AdminDashboardStats, UserManagementTable (filter by role), VerificationQueue (doctors/pharmacists), SupportTicketList/Detail, AuditLogTable, PermissionEditor, PlatformRevenueChart.

**Backend/API routes (Next Route Handlers):** `/api/auth/*` (Clerk webhook sync), `/api/patients`, `/api/doctors`, `/api/doctors/nearby`, `/api/pharmacists`, `/api/pharmacists/nearby`, `/api/appointments`, `/api/ai/chat`, `/api/ai/image-analysis`, `/api/medicines`, `/api/orders`, `/api/drug-requests`, `/api/wallet/topup`, `/api/wallet/withdraw`, `/api/payment/paystack/init`, `/api/payment/paystack/verify` (+ webhook), `/api/notifications`, `/api/support-tickets`, `/api/admin/users`, `/api/admin/audit-logs`.

---

## 8. First Cursor Prompt (Foundation)

Paste this into Cursor as your very first prompt, in an empty repo:

```
I'm building "Aetheris Health" — an AI-powered digital healthcare ecosystem with FOUR
separate portals (Patient, Doctor, Pharmacist/E-Pharmacy, Admin) sharing one backend.

STACK: Next.js 15 (App Router, TypeScript), Tailwind CSS, MongoDB + Mongoose,
Clerk for authentication, deployed target Vercel + MongoDB Atlas.

TASK 1 — PROJECT FOUNDATION. Do the following, one step at a time, and show me
each file before moving to the next:

1. Scaffold a Next.js 15 project (App Router, TypeScript, Tailwind, ESLint) named
   "aetheris-health".

2. Set up the Tailwind theme in tailwind.config.ts with this design system:
   - Deep Navy Blue: #023047
   - Dark Background: #000814
   - Medical Cyan: #219EBC
   - Gold Accent: #FFB703
   - White: #FFFFFF
   Dark mode as default. Add utility classes/plugin support for a glassmorphism
   card style (semi-transparent bg, backdrop-blur, soft border, rounded-2xl,
   soft elevation shadow).

3. Install and configure Clerk (@clerk/nextjs). Create sign-in and sign-up pages
   at app/sign-in/[[...rest]]/page.tsx and app/sign-up/[[...rest]]/page.tsx.
   During sign-up, capture a custom field "role" with options: patient, doctor,
   pharmacist, admin — store it in Clerk publicMetadata.role.

4. Create middleware.ts using Clerk's middleware to protect four route groups:
   /patient/**, /doctor/**, /pharmacy/**, /admin/** — each only accessible to
   users whose publicMetadata.role matches. Redirect mismatched roles to their
   own portal's dashboard, and unauthenticated users to /sign-in.

5. Set up MongoDB connection: lib/db.ts using Mongoose with a cached connection
   pattern safe for Next.js hot reload (check for existing global.mongoose
   connection before creating a new one). Use env var MONGODB_URI.

6. Create the following Mongoose models in /models, matching this schema exactly
   (I'll paste the full field list — start with just User, Patient, Doctor,
   Pharmacist, Admin, and Wallet for now):

   [PASTE THE User / Patient / Doctor / Pharmacist / Admin / Wallet SCHEMAS
   FROM SECTION 4 OF MY SPEC HERE]

7. Create an API route at app/api/webhooks/clerk/route.ts that listens for
   Clerk's user.created webhook and creates a matching User document in
   MongoDB (plus the role-specific Patient/Doctor/Pharmacist/Admin doc and an
   empty Wallet), using the role from publicMetadata.

8. Build a shared UI kit in components/ui/: Button, Card (glassmorphism style),
   Input, Modal, Avatar, Badge, NotificationBell (static placeholder for now),
   and a Sidebar component that accepts a `links` prop so I can reuse it across
   all 4 portals with different nav items.

9. Build a bare-bones dashboard shell for each portal:
   app/patient/dashboard/page.tsx, app/doctor/dashboard/page.tsx,
   app/pharmacy/dashboard/page.tsx, app/admin/dashboard/page.tsx — each just
   shows the Sidebar + a welcome message with the logged-in user's name and
   role, pulled from Clerk's currentUser().

10. Build a simple main landing page at app/page.tsx with the Aetheris Health
    branding and four cards linking to /sign-in for each portal (Patient
    Portal, Doctor Portal, E-Pharmacy Portal, Admin Portal), per this note
    from my wireframes: "Each of these portals should have their login and
    signup unique feature."

After scaffolding, give me the exact .env.local variable names I need to fill
in (Clerk keys, MongoDB URI, etc.) and the commands to run the dev server.

Do not build any feature beyond what's listed above yet — this prompt is
ONLY the foundation. I will give you the next prompt for the Patient Wallet +
Paystack integration once this is working.
```

---

## 9. Notes / Open Decisions to Confirm Before Building
- **Video/voice calling:** SRS lists it as a requirement but no provider was named. For MVP, recommend a plug-in like Stream Video SDK or Daily.co (fastest to integrate) rather than building WebRTC from scratch.
- **Maps provider:** Wireframes/SRS mention both Google Maps and OpenStreetMap (fallback). For a 2–3 day MVP, start with OpenStreetMap + Leaflet (free, no billing setup) and swap to Google Maps later if needed.
- **Korapay vs Paystack:** notes mention both for wallet top-up/withdrawal. Build the wallet system gateway-agnostic (a `gateway` field on `WalletTransaction`) so you can start with Paystack only and add Korapay later without a schema change.
- **QR verification for medicines:** MVP can generate a QR code string/image referencing the `medicineId` — full blockchain/serialization verification is a post-MVP feature.
