# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with workspaces under `packages/`:
  - `packages/web` — core browser VAD (TypeScript, Jest).
  - `packages/react` — React hook/components wrapper.
- Examples for local integration under `examples/` (bundler, Next.js, React).
- `test-site/` — manual test UI used during development.
- Documentation in `docs/` (MkDocs); config in `mkdocs.yml`.
- Large model assets (`*.onnx`) are checked in at repo root for development and CDN bundling.

## Build, Test, and Development Commands
- Root scripts (run at repo root):
  - `npm install` — install workspace deps.
  - `npm run build` — build all workspaces.
  - `npm run test` | `npm run test:coverage` — run Jest (coverage for `packages/web`).
  - `npm run typecheck` — `tsc --noEmit` across packages and test site.
  - `npm run format` | `npm run format-check` — Prettier format/check.
  - `npm run dev` — live dev of `test-site/` with auto‑rebuild (see `scripts/dev.sh`).
  - `npm run build-test-site` | `npm run serve-test-site` — bundle and serve `test-site/`.
- Package scripts:
  - `packages/web`: `npm run build` (webpack scripts), `npm test`.
  - `packages/react`: `npm run build` (tsc).
- Docs (requires Poetry): `poetry install`, `poetry run mkdocs serve` or `poetry run mkdocs build`.

## Coding Style & Naming Conventions
- Language: TypeScript (ES2019+). Indentation: 2 spaces.
- Prettier enforced (no semicolons) with `prettier-plugin-organize-imports`.
- Filenames: `kebab-case.ts` (e.g., `frame-processor.ts`). React components: PascalCase.
- Variables/functions: camelCase; exported types/interfaces: PascalCase.

## Testing Guidelines
- Framework: Jest (ts-jest, jsdom). Config: `packages/web/jest.config.js`.
- Test files: `**/?(*.)+(spec|test).ts` under `packages/web/tests`.
- Coverage (global thresholds): branches 20%, functions 25%, lines 40%, statements 40%.
- Run locally: `npm run test:coverage`. Keep/raise coverage; avoid regressions.

## Commit & Pull Request Guidelines
- Keep commits focused; reference issues in messages when applicable.
- Open PRs with a clear description and linked issues.
- Follow `.github/pull_request_template.md` checklist:
  - Pass typecheck and formatting (`npm run typecheck`, `npm run format`).
  - Verify behavior on the test site (`npm run dev`); update `test-site/` if needed.
- CI uses Node 18.x for build, format check, typecheck, and tests; ensure these pass.

## Security & Configuration Tips
- When bundling, ensure ONNX and ORT wasm assets are copied to your `dist/` (see `test-site/build.sh`).
- Do not commit secrets; use environment variables or CI secrets for publishing.

