# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **yarn** (see `yarn.lock`).

- `yarn dev` — run the Next.js dev server
- `yarn build` — production build (`next build`)
- `yarn start` — run the production build
- `yarn lint` — `next lint` (note: `next.config.js` sets `eslint.ignoreDuringBuilds: true`, so lint is not gated in CI builds)

There is no test runner configured in this repo.

One-off maintenance script: `node scripts/backfill-clerk-user-meta.mjs` (requires env loaded; uses `dotenv`).

## Architecture

This is **Lucida**, a Next.js 15 (App Router, React 19) SaaS for teachers to generate AI exams, share them with students, and scan/grade paper answer sheets via OMR. UI copy is Portuguese (pt-BR).

### Stack

- **Next.js App Router** under `src/app` with path alias `@/* → ./src/*`
- **Auth:** Clerk (`@clerk/nextjs`) — gated in `src/middleware.ts` for `/dashboard(.*)`, `/api/payment(.*)`, `/payment(.*)`. In production, unauthenticated users are redirected to `https://app.lucidaexam.com/sign-in` rather than the local sign-in.
- **DB:** MongoDB via Mongoose. Always call `connectToDB()` from `src/lib/mongodb.ts` at the top of any API handler that touches the DB — it caches the connection on `global.mongoose` to survive serverless cold starts.
- **Models** (`src/models`): `User`, `Class`, `Student`, `Exam`, `Result`, `ScanResult`, `Integration`. Models use the `mongoose.models.X || mongoose.model(...)` pattern — always keep this guard when adding or editing models so hot-reload doesn't throw OverwriteModelError.
- **Payments:** Stripe (`/api/create-checkout-session`, `/api/webhooks/stripe`). User plans live on `User.subscription.plan` with enum `trial | monthly | semi-annual | annual | admin | custom`. Plan gating (e.g. exam creation quota) is enforced inside API routes — see `PLAN_LIMITS` in `src/app/api/exam/route.ts`.
- **AI:** OpenAI SDK for exam generation (exam route and related helpers).
- **UI:** shadcn/ui on Radix primitives under `src/components/ui`, Tailwind, `next-themes` for dark mode, Poppins/Inter fonts, `sonner` + custom toaster. Global providers are wired in `src/app/layout.tsx` (ClerkProvider → ThemeProvider → TooltipProvider → Toaster).
- **Analytics:** PostHog (rewrites under `/ingest/*` in `next.config.js` proxy to `us.i.posthog.com`), Vercel Analytics + Speed Insights, Google Tag Manager.

### Major feature surfaces

- **Dashboard** (`src/app/dashboard/*`) — authenticated teacher workspace. Layout is `DashboardShell` (`src/components/dashboard/dashboard-shell.tsx`). Sub-routes: `overview`, `exams`, `classes`/`turmas`, `students`, `scan`, `corrigir`, `analytics`, `billing`, `help`.
- **Exam creation flow** (`src/components/create-exam/*`): upload → customize → preview → generated. Source materials accepted include PDF (`pdf-parse`) and DOCX (`mammoth`). Export to DOCX (`docx`) and PDF (`jspdf`).
- **Public exam taking** (`src/app/exam/[shareId]/page.tsx`) — unauthenticated students open exams via `shareId` (unique sparse index on `Exam.shareId`); results are posted via `/api/exam/*` endpoints.
- **OMR scan** (`src/app/dashboard/scan`, `src/components/scan/*`, `src/app/api/scan/*`) — teacher uploads/photographs a filled answer sheet. `src/app/api/scan/route.ts` forwards to an external OMR service. Two modes:
  - Default: POST to `NEXT_PUBLIC_API_URL` (the `lucida-api` backend) at `/omr/scan`.
  - If `NEXT_PUBLIC_OMR_DIRECT_URL` is set, calls the Python OMR service's `/process` directly and `mapDirectOmrToResult` reshapes the response to the `lucida-api` format. Both modes produce a `ScanResult` document with detected answers, grading, and optional student-code resolution via `src/lib/student-resolve.ts`.
- **Integrat integration** (`src/app/api/integrat/*`, `Integration` model, `User.integrationId`/`integratPartnerToken`) — third-party class roster sync.

### API route conventions

All server routes live under `src/app/api/**/route.ts`. They typically:
1. `await auth()` from `@clerk/nextjs/server` and 401 on missing `userId`
2. `await connectToDB()`
3. Scope queries by `userId` (most collections store the Clerk user id as a string on `userId`)
4. Return `NextResponse.json({ status, ... })` with HTTP codes

The scan route in particular sets `export const maxDuration = 60` and a 50 MB body parser limit for image uploads — mirror that pattern for other long-running or large-payload routes.

### Students and codes

`Student.code` is a 7-digit string (`CODE_REGEX = /^[0-9]{7}$/`), unique per `classId`. `matricula` is unique per `userId` (sparse). Student resolution during OMR scanning goes through `src/lib/student-resolve.ts` (`resolveStudentsByCodeBatch`).

## Environment

Copy `.env.exemple` to `.env.local`. Required keys: Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), `OPENAI_API_KEY`, `MONGODB_URI`, Gmail SMTP (`GMAIL_USER`, `GMAIL_APP_PASSWORD`), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + per-plan price IDs), `NEXT_PUBLIC_API_URL` (lucida-api backend), and optional `NEXT_PUBLIC_OMR_DIRECT_URL` / `NEXT_PUBLIC_CLERK_ALLOWED_ORIGIN` (comma-separated tunnel origins for dev).

## Related services

This client is one piece of a larger system — it talks to a separate **`lucida-api`** backend (for OMR and other server work) and a Python **OMR service** (directly when `NEXT_PUBLIC_OMR_DIRECT_URL` is set). When debugging scan/grade flows, confirm which of the two OMR paths is active before blaming client code.
