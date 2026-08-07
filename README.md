# IB-Taxil

> Turn your Interactive Brokers activity into the investment figures for your
> Israeli individual tax return — privately, in your browser.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/shakedmanes/ib-taxil/actions/workflows/ci.yml/badge.svg)](https://github.com/shakedmanes/ib-taxil/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-131_passing-brightgreen.svg)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-86%25_lines-brightgreen.svg)](#testing)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![i18n: he + en](https://img.shields.io/badge/i18n-עברית_%7C_English-informational.svg)](#internationalization-i18n)

IB-Taxil takes an Interactive Brokers (IBKR) **Flex Query** export, converts every
amount to shekels using **Bank of Israel** representative rates, applies the
Israeli tax rules for investment income, and hands you **form-ready numbers** plus
a step-by-step guide to where each one goes on the ITA forms.

**Everything runs in your browser. No account, no backend database, no analytics.**

> [!IMPORTANT]
> IB-Taxil is a **calculation aid, not tax advice**, and it covers only the
> *investment portion* of a return. Its numbers are estimates you must verify with
> a licensed Israeli tax professional (רו״ח / יועץ מס) before filing. It is not
> affiliated with the Israel Tax Authority, Interactive Brokers, or the Bank of
> Israel. **Please read the [full disclaimer](./DISCLAIMER.md).**

---

## Table of contents

- [What it does](#what-it-does)
- [What it does *not* do](#what-it-does-not-do)
- [Supported tax years](#supported-tax-years)
- [How it works](#how-it-works)
- [Tax methodology](#tax-methodology)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License & legal](#license--legal)

## What it does

- 📥 **Import** — upload an IBKR Flex Query XML/CSV, or pull it via the Flex Web
  Service (through an optional CORS proxy). A built-in guide walks you through
  generating a Flex Query with the required **Closed Lots** section.
- 💱 **Convert** — fetches daily **USD→ILS** (and other) Bank of Israel rates and
  applies the correct representative rate for each open and sale date, with the
  last-published-rate fallback for weekends/holidays.
- 🧮 **Calculate** the investment portion under Israeli law:
  - **Capital gains** on the *shekel real gain* (§§88/91) at 25% / 30%
  - **Loss offsetting** (§92): current losses against gains, then income; plus
    brought-forward losses and carry-forward
  - **Foreign dividends** (§125ב) and **interest** (§125ג)
  - **Foreign tax credit** per country basket (§§199–210) with treaty caps and a
    5-year excess carry-forward (§205א)
  - **Surtax / מס יסף** (§121ב), including the 2025 capital surtax (Amendment 276)
  - **Whole-shekel rounding** per *חוק עיגול סכומים* (nearest, half up)
- 🔎 **Review** every closed lot, marked in-year vs. other years, with a full
  per-trade breakdown — and an *explanation* for every figure.
- 📤 **Export** a filled **PDF**, an **Excel** workbook, and a **JSON** package.
- 📝 **File** — an optional deep walkthrough maps each value to the exact field on
  forms **1301**, **נספח ג (1322)**, **נספח ג(1) (1325)**, and **נספח ד (1324)**.
- 🌐 **Bilingual** Hebrew (RTL) + English, with dark/light mode.

## What it does *not* do

IB-Taxil computes **only** the investment portion derived from IBKR closed-lot
data. It does **not** produce a complete return. Out of scope: salary/employment
income, business/freelance income, Israeli-source securities, real estate,
pensions/provident funds, crypto, options/derivatives, other brokers, and personal
credits/deductions (נקודות זיכוי / ניכויים). It assumes the IBKR data you give it
is complete for that account. See the [DISCLAIMER](./DISCLAIMER.md).

## Supported tax years

| Year | Engine | ITA field codes | Notes |
|------|:------:|:---------------:|-------|
| **2025** | ✅ confirmed | ✅ verified | includes the 2% capital surtax (Amendment 276) |
| **2024** | ✅ confirmed | ✅ verified | |
| 2026+ | 🟡 provisional | ⚠️ unverified | computed by carrying 2025 constants forward — **flagged for confirmation** |
| ≤ 2023 | ⛔ blocked | — | not supported |

**Provisional years:** when a year's official constants aren't published yet, the
engine still computes it by carrying the latest confirmed year forward and labels
the result *provisional* (the inflation-indexed surtax threshold and any new
legislation must be confirmed). Promoting a provisional year to *confirmed* is a
one-row change — see [How to add a new tax year](./CONTRIBUTING.md#how-to-add-a-new-tax-year).

## How it works

```
Step 1  Choose the tax year
Step 2  Import IBKR data (file upload or Flex API)
Step 3  Review trades, dividends & interest — flag substantial holdings
Step 4  Add details (brought-forward losses, other income for surtax)
Step 5  See the explained tax summary (fetches BOI rates & calculates)
Step 6  Export PDF / Excel / JSON
Step 7  (optional) Full ITA form-filling walkthrough
```

The engine is **pure and framework-free**: it takes parsed IBKR data plus a rate
map and returns an `EngineOutput` that is either a `TaxResult` (with an
`Explanation` on every figure) or a `BlockedResult` (with fix-it guidance and *no*
numbers, so partial/ambiguous data never yields a misleading total).

## Tax methodology

Design decisions are documented as ADRs in [`docs/adr/`](./docs/adr):

- [0001 — shekel real-gain method](./docs/adr/0001-shekel-real-gain-method.md)
- [0002 — IBKR closed lots as source of truth](./docs/adr/0002-ibkr-closed-lots-source-of-truth.md)
- [0004 — stateless loss-offset model](./docs/adr/0004-loss-offset-model-stateless.md)
- [0005 — explainability is first-class](./docs/adr/0005-explainability-is-first-class.md)
- [0007 — scope: investment portion](./docs/adr/0007-scope-investment-portion-with-published-contract.md)
- [0008 — asymmetric completeness policy](./docs/adr/0008-asymmetric-completeness-policy.md)
- [0009 — full precision, round only at output](./docs/adr/0009-precision-and-rate-fallback.md)

Field-code sourcing lives in [`docs/ita-field-codes.md`](./docs/ita-field-codes.md);
tax constants and their sources in [`docs/tax-research-findings.md`](./docs/tax-research-findings.md).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| i18n | next-intl 4 (en + he/RTL) |
| Money | decimal.js (values are decimal **strings**) |
| Parsing | fast-xml-parser · PapaParse |
| Export | jsPDF · ExcelJS |
| Rates | Bank of Israel SDMX API |
| Tests | Vitest + @testing-library/react |
| Proxy (optional) | Cloudflare Worker (IBKR Flex CORS relay) |

## Getting started

**Prerequisites:** Node.js 20+, npm 10+.

```bash
git clone https://github.com/shakedmanes/ib-taxil.git
cd ib-taxil
npm install
npm run dev          # http://localhost:3000  (→ /en; Hebrew at /he)
```

The **file-upload** path needs no configuration. The **IBKR API** path needs the
optional proxy (browsers can't call the Flex Web Service directly):

```bash
# terminal 1 — proxy
cd workers/ibkr-proxy && npm install && npm run dev   # http://localhost:8787
# terminal 2 — app
NEXT_PUBLIC_PROXY_URL=http://localhost:8787 npm run dev
```

## Testing

```bash
npm test               # run once (131 tests)
npm run test:watch     # watch mode
npm run test:coverage  # run with a V8 coverage report (→ ./coverage)
npm run typecheck      # tsc --noEmit
```

We follow TDD and target **80%+ coverage**. The pure engine (`lib/`) sits well
above that; current overall coverage is **~86% lines / ~83% statements**, with
enforced regression floors in `vitest.config.ts`. Engine tests assert exact
decimal-string results (never floats). `next-intl` is mocked against the real
`messages/en.json`, so component tests check real strings. A live end-to-end
reconciliation against a real Flex Query has verified every figure to the agora.

Every push and PR runs type-check, lint, tests, and coverage via
[GitHub Actions](./.github/workflows/ci.yml).

## Project structure

```
ib-taxil/
├── app/
│   ├── [locale]/            # localized layout + entry page (WizardShell)
│   └── api/boi-rates/       # server route → Bank of Israel SDMX
├── components/
│   ├── wizard/              # Step1TaxYear … Step7Filing + WizardShell
│   ├── import/              # FileUploadCard, IBKRApiCard, FlexGuide
│   ├── review/              # SummaryCards, TradeTable (year-aware)
│   ├── summary/             # TaxSummaryHero, TaxBreakdown
│   ├── export/              # ExportPanel
│   └── common/              # Explain (renders Explanation codes)
├── lib/
│   ├── ibkr/                # parser-xml/-csv, detect, classify, types
│   ├── boi/                 # dataflow, plan (date span), rates, lookup
│   ├── tax/                 # ⭐ pure engine
│   │   ├── calculator.ts    #   orchestrates the whole computation
│   │   ├── capital-gains.ts · losses.ts · dividends.ts · interest.ts
│   │   ├── foreign-tax-credit.ts · surtax.ts
│   │   ├── rates.ts         #   per-year constants + provisional-year logic
│   │   ├── decimal.ts       #   decimal-string helpers + roundShekels
│   │   └── explain.ts · types.ts · user-inputs.ts
│   └── reports/             # pdf, excel, filing-package, field-codes, field-map
├── messages/                # en.json · he.json
├── workers/ibkr-proxy/      # optional Cloudflare Worker (Flex CORS relay)
├── docs/adr/                # architecture decision records
└── __tests__/               # Vitest suite (mirrors src)
```

## Roadmap

- [x] Round exported **field values** to whole shekels (engine keeps full precision)
- [x] Wire **coverage reporting** + CI (GitHub Actions: type-check, lint, test, coverage)
- [ ] Add **2026** constants once the ITA publishes them (promote from provisional)
- [ ] Raise coverage floors toward 80% on branches/functions (UI components)
- [ ] Clear pre-existing lint debt, then make lint a hard CI gate
- [ ] More brokers / import formats beyond IBKR
- [ ] Additional source currencies and country baskets
- [ ] Broader income coverage where it can be sourced reliably

Have a request? Open a [feature request](./.github/ISSUE_TEMPLATE/feature_request.md).

## Contributing

Contributions are welcome — especially **sourced** tax-data updates. Start with
**[CONTRIBUTING.md](./CONTRIBUTING.md)**, which covers setup, conventions, testing,
and step-by-step guides (adding a tax year, an import format, or an export format).
Please also read the [Code of Conduct](./CODE_OF_CONDUCT.md). Report security or
privacy issues privately per the [Security Policy](./SECURITY.md).

Golden rules: **money is decimal strings**, **every figure is explainable**, and
**no tax number without an official source**.

## License & legal

- **License:** [Apache License 2.0](./LICENSE) (see also [`NOTICE`](./NOTICE)).
- **Disclaimer:** [DISCLAIMER.md](./DISCLAIMER.md) — no warranty, no liability, not
  tax advice, verify with a licensed professional before filing.

Exchange-rate data © Bank of Israel. Product names and trademarks belong to their
respective owners; IB-Taxil is an independent, unaffiliated project.
