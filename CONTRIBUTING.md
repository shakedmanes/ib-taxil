# Contributing to IB-Taxil

Thanks for your interest in improving IB-Taxil! This project helps Israeli
investors prepare the investment portion of their tax return, so **correctness
and clarity matter more than speed**. Please read this guide before opening a PR.

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](./LICENSE) and that you have read the [DISCLAIMER](./DISCLAIMER.md).

## Table of contents

- [Ground rules](#ground-rules)
- [Development setup](#development-setup)
- [Project conventions](#project-conventions)
- [Testing](#testing)
- [How to add a new tax year](#how-to-add-a-new-tax-year)  ⭐ most common contribution
- [How to add a new import format](#how-to-add-a-new-import-format)
- [How to add a new export format](#how-to-add-a-new-export-format)
- [Internationalization (i18n)](#internationalization-i18n)
- [Commit & PR process](#commit--pr-process)

## Ground rules

- **No unsourced tax numbers.** Any rate, threshold, or ITA field code must cite
  an official source (a `gov.il` form PDF, the Income Tax Ordinance, or an
  official ITA publication). Put the source in the code comment or in `docs/`.
- **Money is never a JS `number`.** All monetary values are decimal **strings**,
  computed with the helpers in [`lib/tax/decimal.ts`](./lib/tax/decimal.ts).
  Round only at the output boundary (see [ADR-0009](./docs/adr/0009-precision-and-rate-fallback.md)).
- **Every figure is explainable.** Engine outputs carry an `Explanation`
  (`{ code, params }`) so the UI can tell the user *why* a number is what it is
  (see [ADR-0005](./docs/adr/0005-explainability-is-first-class.md)).
- **Immutability.** Never mutate inputs; return new objects.

## Development setup

**Prerequisites:** Node.js 20+, npm 10+.

```bash
git clone https://github.com/shakedmanes/ib-taxil.git
cd ib-taxil
npm install
npm run dev        # http://localhost:3000  (redirects to /en; Hebrew at /he)
```

Common scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Re-run tests on change |
| `npx tsc --noEmit` | Type-check |
| `npm run lint` | Lint |
| `npm run build` | Production build |

## Project conventions

- **Small, focused files** (~200–400 lines; 800 max). Organize by domain
  (`lib/tax`, `lib/ibkr`, `lib/boi`, `lib/reports`), not by type.
- **Pure engine.** Everything under `lib/tax` is pure and framework-free — no
  React, no `fetch`. The engine takes parsed data + a rates map and returns an
  `EngineOutput`. This is what makes it unit-testable.
- **No `console.log`** in committed code.
- **Errors are explicit.** Validate at boundaries; surface user-friendly issues
  rather than throwing into the UI (see the `BlockedResult` pattern).

## Testing

We follow test-driven development and aim for **80%+ coverage**. Every behavior
change needs a test.

```bash
npm test
```

- Test files live in `__tests__/` and mirror the source tree.
- `next-intl` is mocked via `__mocks__/next-intl.ts`, which reads the real
  `messages/en.json`, so component tests assert against real English strings.
- Engine tests should assert **exact** decimal-string values, not floats.

## How to add a new tax year

This is the most common maintenance task — do it when the ITA publishes a new
year's constants (or to *confirm* a year the engine is currently treating as
"provisional").

1. **Add a verified row** to `RATE_TABLE` in [`lib/tax/rates.ts`](./lib/tax/rates.ts):

   ```ts
   2026: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25',
           interestRate: '25', surtaxThresholdIls: '<official>', surtaxBaseRate: '3',
           capitalSurtaxRate: '2' },
   ```

   Source each value (especially the inflation-indexed `surtaxThresholdIls` and
   any rate change from new legislation) in the surrounding comment.

2. **Confirm the ITA field codes** for that year against the official form PDFs
   and add the year to `VERIFIED_YEARS` in
   [`lib/reports/field-codes.ts`](./lib/reports/field-codes.ts). Update
   [`docs/ita-field-codes.md`](./docs/ita-field-codes.md) with your sources.

3. **Run the tests.** `SUPPORTED_YEARS`, `LATEST_KNOWN_YEAR`, and the year picker
   update automatically from `RATE_TABLE`. Add/adjust assertions in
   `__tests__/lib/tax/rates.test.ts`.

> **Why "provisional" exists:** until a year is added here, the engine still lets
> users compute it by carrying the latest confirmed year forward, clearly flagged
> as provisional. Adding the verified row is what turns that estimate into a
> confirmed calculation. Never hard-code a rate you haven't sourced.

## How to add a new import format

1. Create `lib/ibkr/parser-<format>.ts` exporting `(input: string) => IBKRData`.
2. Add detection in `components/import/FileUploadCard.tsx` (and `lib/ibkr/detect.ts`).
3. Add tests in `__tests__/lib/ibkr/parser-<format>.test.ts`.

## How to add a new export format

1. Create `lib/reports/<format>.ts` exporting `generate<Format>(pkg: FilingPackage): Promise<Blob>`.
2. Wire a button into `components/export/ExportPanel.tsx` with i18n keys.
3. Add tests in `__tests__/lib/reports/<format>.test.ts`.

## Internationalization (i18n)

Every user-facing string must exist in **both** `messages/en.json` and
`messages/he.json`. Hebrew is RTL — verify layout in `/he`. Keys are grouped by
feature namespace. Engine `Explanation` codes map to keys under `explain.*` /
`block.*`.

## Commit & PR process

- Branch from `master`.
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Before opening a PR: `npm test` and `npx tsc --noEmit` must pass, and any new
  string must be in both locale files.
- Describe **what changed and why**, and cite sources for any tax-number change.
- Security issues: do **not** open a public issue — see [SECURITY.md](./SECURITY.md).
