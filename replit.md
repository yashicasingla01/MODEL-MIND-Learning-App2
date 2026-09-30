# MODEL MIND

Your Course. Your Sources. Your Learning Path. A local-first study workspace for grounded tutoring, adaptive practice, timed mock tests, topic mastery, and next-step recommendations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/model-mind run dev` — run the MODEL MIND web app
- `pnpm --filter @workspace/model-mind run typecheck` — typecheck the web app
- `pnpm --filter @workspace/model-mind run build` — build the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/model-mind/src/App.tsx` — routes, dashboard, materials, tutor, quizzes, mock tests, mastery, and evaluation screens
- `artifacts/model-mind/src/lib/model.ts` — source parsing, local persistence, citations, retrieval, question creation, and grading
- `artifacts/model-mind/src/index.css` — app visual system and responsive styles
- `artifacts/model-mind/index.html` — document and social metadata

## Architecture decisions

- Study data is kept in the current browser's local storage; PDF and PowerPoint text extraction happens in the browser.
- Tutor answers are extractive source search, not a generative model. If no matching passage exists, the tutor abstains.
- Short-answer scoring uses a visible keyword check. Numerical grading is limited to numeric facts found in the stored source text.
- Uploaded video bytes are not retained or transcribed. Users can attach timestamped transcript notes to a video source.

## Product

- Import PDF, PPTX, and text sources, and add timestamped lecture notes.
- Ask source-grounded questions with page, slide, or transcript citations.
- Generate MCQ, short-answer, or numerical practice, take mixed timed tests, and review topic-level progress.

## User preferences

No additional project-wide preferences recorded.

## Gotchas

- Scanned PDFs need OCR; this local MVP only reads embedded PDF text.
- Keep the sample course clearly labeled as demo content.
- When changing the sample course data, update its saved local version so returning preview sessions see the current sample.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
