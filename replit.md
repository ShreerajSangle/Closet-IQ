# ClosetIQ

## Overview

ClosetIQ is a full-stack personal wardrobe management and outfit combination app built specifically for Shreeraj. It generates scientifically-scored outfit combinations based on color harmony, skin tone (#CC9674), eye color (#1F1919), and hair color (#0A0B0B).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Wouter routing
- **State**: TanStack Query (via Orval-generated hooks)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: Groq API (llama3-70b) — on-demand outfit explanations only
- **Font**: Satoshi from Fontshare CDN

## Key Files

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all API shapes)
- `lib/db/src/schema/` — Drizzle DB schema (wardrobe_items, outfits, user_profile tables)
- `artifacts/api-server/src/routes/` — API route handlers (wardrobe, outfits, profile)
- `artifacts/api-server/src/lib/outfitGenerator.ts` — Outfit generation algorithm
- `artifacts/api-server/src/lib/groqExplainer.ts` — Groq AI integration
- `artifacts/api-server/src/lib/gapAdvisor.ts` — Gap analysis logic
- `artifacts/closetiq/src/` — React frontend

## Pages

- `/` — Dashboard: stats, Generate Outfits CTA, recently worn, wardrobe quick-view
- `/closet` — Masonry grid of all wardrobe items with add/edit/delete
- `/outfits` — Generated outfit combinations with score, save, mark worn, AI explain
- `/history` — Chronological worn outfit log
- `/gap-advisor` — Wardrobe gap analysis and buying recommendations
- `/profile` — Shreeraj's color profile and style preferences

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## User Color Profile (Fixed — do not edit)

- Skin tone: #CC9674 (warm medium)
- Eye color: #1F1919 (near-black)
- Hair color: #0A0B0B (deep black)

## Outfit Scoring Algorithm

Score = 40% color harmony + 25% skin tone affinity + 20% style coherence + 15% occasion match + layering bonus/penalty. Only outfits scoring 60+ are shown.

## Notes

- After changing openapi.yaml, run `pnpm --filter @workspace/api-spec exec orval --config ./orval.config.ts` then fix `lib/api-zod/src/index.ts` to only export from `./generated/api` (not types)
- Groq AI is called ONLY on user click of "Why this works?" — never automatically
- AI explanations are cached in the DB so Groq is never called twice for the same outfit
