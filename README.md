# IB-Taxil

A privacy-first, browser-based Israeli tax return generator for Interactive Brokers (IBKR) accounts.

IB-Taxil fetches your IBKR trading data, converts all amounts to ILS using Bank of Israel representative exchange rates, calculates your capital gains tax and dividend tax under Israeli law, and produces a pre-filled tax form ready to submit to the Israeli Tax Authority (ITA).

**All processing happens in your browser. Nothing is stored on any server.**

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Development)](#getting-started-development)
- [Environment Variables](#environment-variables)
- [Running the Cloudflare Worker Locally](#running-the-cloudflare-worker-locally)
- [Testing](#testing)
- [Internationalization (i18n)](#internationalization-i18n)
- [Tax Calculation Logic](#tax-calculation-logic)
- [Data Flow](#data-flow)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

- **Two import paths** — connect via IBKR Flex Query API, or upload an exported XML/CSV file directly
- **Automatic currency conversion** — fetches daily USD→ILS rates from the Bank of Israel (BOI) SDMX API
- **Israeli tax calculation** — capital gains (25%), dividends (25%), and foreign income, with foreign tax credit offsets
- **Bilingual UI** — Hebrew (RTL) and English, switchable at runtime via next-intl
- **Dark / light mode**
- **Export** — download a pre-filled PDF tax form and a full Excel breakdown workbook
- **On-screen ITA field guide** — maps calculated values to the exact ITA portal fields to enter when filing
- **Zero data retention** — no backend, no database, no analytics

---

## How It Works

```
User → [Step 1] Select tax year
     → [Step 2] Import data (API or file upload)
     → [Step 3] Review trades & dividends, trigger calculation
     → [Step 4] View tax summary with BOI-converted ILS amounts
     → [Step 5] Download PDF / Excel, or use on-screen ITA field guide
```

### IBKR API path

Because browsers cannot call the IBKR Flex Web Service directly (CORS restriction), a thin Cloudflare Worker proxy forwards requests:

```
Browser → Cloudflare Worker → IBKR Flex API
                           ← XML report
Browser ← XML report (CORS headers added)
```

The proxy does not log or store anything — it is a pass-through relay. Source code is in `workers/ibkr-proxy/`.

### File upload path

Users download their Flex Query XML or Activity Statement CSV from the IBKR Client Portal directly and drop the file into the app. No proxy is involved.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| i18n | next-intl 4 |
| XML parsing | fast-xml-parser |
| CSV parsing | PapaParse |
| Decimal arithmetic | decimal.js |
| PDF generation | jsPDF |
| Excel generation | ExcelJS |
| Testing | Vitest + @testing-library/react |
| Proxy | Cloudflare Workers (Wrangler 3) |
| Deployment | Vercel (app) + Cloudflare Workers (proxy) |

---

## Project Structure

```
ib-taxil/
├── app/
│   ├── layout.tsx                  # Root layout (ThemeProvider)
│   └── [locale]/
│       ├── layout.tsx              # Locale layout (NextIntlClientProvider, Navbar)
│       └── page.tsx                # Entry point — renders WizardShell
│
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx              # Language + dark/light toggle
│   │   └── ThemeProvider.tsx       # Dark mode context
│   ├── wizard/
│   │   ├── WizardShell.tsx         # Manages wizard state (step, data, result)
│   │   ├── Step1TaxYear.tsx        # Year picker
│   │   ├── Step2Import.tsx         # Import container (API card + file upload card)
│   │   ├── Step3Review.tsx         # Trade/dividend review + calculate button
│   │   ├── Step4Summary.tsx        # Tax summary + breakdown
│   │   └── Step5Export.tsx         # Export options
│   ├── import/
│   │   ├── IBKRApiCard.tsx         # Flex Query token + Query ID form + 7-step guide
│   │   ├── FileUploadCard.tsx      # Drag-and-drop file upload zone
│   │   └── PrivacyModal.tsx        # Plain-language privacy explanation modal
│   ├── review/
│   │   ├── SummaryCards.tsx        # Trades / Gains / Losses / Dividends count cards
│   │   └── TradeTable.tsx          # Sortable, filterable trade + dividend table
│   ├── summary/
│   │   ├── TaxSummaryHero.tsx      # Net capital gain / dividends / tax liability hero
│   │   └── TaxBreakdown.tsx        # Collapsible per-trade and per-dividend breakdown
│   └── export/
│       └── ExportPanel.tsx         # PDF / Excel download buttons + ITA field guide
│
├── lib/
│   ├── ibkr/
│   │   ├── types.ts                # Trade, Dividend, ForeignIncome, IBKRData interfaces
│   │   ├── parser-xml.ts           # Parses IBKR Flex Query XML → IBKRData
│   │   └── parser-csv.ts           # Parses IBKR Activity Statement CSV → IBKRData
│   ├── boi/
│   │   ├── types.ts                # ExchangeRate, RatesMap types
│   │   └── rates.ts                # Fetches BOI SDMX API, builds date→rate map
│   ├── tax/
│   │   ├── types.ts                # TaxResult, CapitalGainLine, DividendLine interfaces
│   │   ├── calculator.ts           # Core tax calculation (capital gains + dividends)
│   │   └── decimal.ts              # Decimal.js helpers (add, mul, pct, formatIls, …)
│   └── reports/
│       ├── pdf.ts                  # Generates PDF via jsPDF
│       └── excel.ts                # Generates Excel workbook via ExcelJS
│
├── messages/
│   ├── en.json                     # English translations (all UI strings)
│   └── he.json                     # Hebrew translations (all UI strings)
│
├── workers/
│   └── ibkr-proxy/
│       ├── src/index.ts            # Cloudflare Worker — CORS proxy for IBKR API
│       ├── wrangler.toml           # Worker config (name, allowed origin)
│       └── package.json
│
├── __tests__/                      # Vitest test files (mirrors src structure)
├── __mocks__/
│   └── next-intl.ts                # Manual mock for useTranslations in tests
│
├── i18n.ts                         # next-intl config (locales: en, he)
├── next.config.ts                  # Next.js config with next-intl plugin
├── vitest.config.ts                # Vitest config (jsdom, path aliases)
└── vitest.setup.ts                 # Test setup (jest-dom, localStorage polyfill)
```

---

## Getting Started (Development)

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
# 1. Clone the repository
git clone <repo-url>
cd ib-taxil

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/en` by default. Switch to Hebrew at `/he`.

---

## Environment Variables

Create a `.env.local` file in the project root if you need to override defaults:

```bash
# URL of the IBKR proxy worker.
# Defaults to a placeholder value — override this to point at your deployed
# Cloudflare Worker or at the local worker dev server.
NEXT_PUBLIC_PROXY_URL=http://localhost:8787
```

This variable is only needed for the IBKR API (Flex Query token) import path. The file upload path works without it.

---

## Running the Cloudflare Worker Locally

The Cloudflare Worker proxies IBKR Flex API calls to work around browser CORS restrictions.

```bash
# 1. Install worker dependencies
cd workers/ibkr-proxy
npm install

# 2. Start the local worker dev server
npm run dev
# Worker is now available at http://localhost:8787
```

Then tell the Next.js app to use the local worker:

```bash
# In the project root
NEXT_PUBLIC_PROXY_URL=http://localhost:8787 npm run dev
```

Or add it permanently to `.env.local`:

```bash
NEXT_PUBLIC_PROXY_URL=http://localhost:8787
```

The worker already permits any `localhost` / `127.0.0.1` origin without additional configuration — the `ALLOWED_ORIGIN` restriction in `wrangler.toml` only applies to production traffic.

### Worker endpoints

| Query parameters | Description |
|---|---|
| `?action=send&t=<token>&q=<queryId>` | Phase 1 — submits the Flex Query request, returns an XML response containing a reference code |
| `?action=get&q=<referenceCode>` | Phase 2 — fetches the generated XML report using the reference code |

---

## Testing

```bash
# Run all tests once
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch
```

Tests use **Vitest** with **@testing-library/react** and **jsdom**. All component tests run in a simulated browser environment.

### Test conventions

- Test files live in `__tests__/` and mirror the source directory structure
- `next-intl` is mocked via `__mocks__/next-intl.ts` — it reads the real `messages/en.json` translations so component tests assert against actual English strings, not translation keys
- External API modules (`@/lib/boi/rates`, `@/lib/ibkr/parser-xml`, etc.) are mocked per test file using `vi.mock()`
- The `localStorage` global is polyfilled in `vitest.setup.ts` to work around a Node.js v25 incompatibility with jsdom

### Adding tests for a new component

1. Create `__tests__/components/<path>/<ComponentName>.test.tsx`
2. Add `vi.mock('next-intl')` at the top if the component uses `useTranslations`
3. Mock any external lib modules the component depends on
4. Assert against the English strings defined in `messages/en.json`

---

## Internationalization (i18n)

The app uses **next-intl 4** with two locales: `en` (English, LTR) and `he` (Hebrew, RTL). The locale is part of the URL path (`/en/`, `/he/`) and the layout applies `dir="rtl"` automatically for Hebrew.

### Adding or changing a string

1. Add the key to **both** `messages/en.json` and `messages/he.json`
2. Use it in the component:

```tsx
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('myNamespace')
  return <p>{t('myKey')}</p>
}
```

3. For strings with dynamic values:

```json
{ "greeting": "Hello, {name}!" }
```
```tsx
t('greeting', { name: 'Shaked' })  // → "Hello, Shaked!"
```

4. For strings with inline markup (bold, code spans, etc.) use `t.rich()`:

```json
{ "intro": "Go to <code>clientportal.ibkr.com</code> and sign in." }
```
```tsx
t.rich('intro', {
  code: (chunks) => <span className="font-mono bg-slate-100 px-1 rounded">{chunks}</span>
})
```

### Namespace conventions

Each feature area has its own namespace key in the JSON files:

| Namespace | Component(s) |
|---|---|
| `app` | Root metadata |
| `nav` | `Navbar` |
| `wizard` | `WizardShell` (step labels, back button) |
| `step1` | `Step1TaxYear` |
| `step2` | `Step2Import` |
| `ibkrApi` | `IBKRApiCard` |
| `fileUpload` | `FileUploadCard` |
| `privacyModal` | `PrivacyModal` |
| `step3Review` | `Step3Review` |
| `summaryCards` | `SummaryCards` |
| `tradeTable` | `TradeTable` |
| `step4` | `Step4Summary` |
| `taxHero` | `TaxSummaryHero` |
| `taxBreakdown` | `TaxBreakdown` |
| `step5` | `Step5Export` |
| `exportPanel` | `ExportPanel` |

---

## Tax Calculation Logic

All monetary values are stored and computed as **decimal strings** (never JavaScript floats) using `decimal.js` to avoid floating-point precision errors. Helper functions live in `lib/tax/decimal.ts`.

### Capital Gains

1. For each **sell** trade: `gainLossIls = gainLossUsd × BOI_rate_on_sale_date`
2. Sum all gains; sum all losses separately
3. `netCapitalGainIls = max(totalGains − totalLosses, 0)` — losses offset gains but cannot produce a negative result
4. `capitalGainsTaxIls = netCapitalGainIls × 25%`

### Dividends

For each dividend payment:

1. `grossIls = amountUsd × BOI_rate_on_payment_date`
2. `withheldIls = withheldTaxUsd × BOI_rate_on_payment_date`
3. `israeliTaxDue = grossIls × 25%`
4. `creditApplied = min(withheldIls, israeliTaxDue)` — foreign withholding tax credit, capped at the Israeli liability
5. `netTaxDue = israeliTaxDue − creditApplied`

### Exchange rates

Rates are fetched from the **Bank of Israel SDMX API** for the full calendar year. If a trade or dividend falls on a weekend or Israeli holiday (no rate published), the calculator walks back up to 7 days to find the nearest prior business day rate.

### Tax rates

All rates are constants in `lib/tax/calculator.ts`:

```ts
const CAPITAL_GAINS_RATE  = '25'  // 25%
const DIVIDEND_RATE       = '25'  // 25%
const FOREIGN_INCOME_RATE = '25'  // 25%
```

> **Disclaimer:** This tool is a calculation aid. Always verify results with a licensed Israeli tax advisor before filing.

---

## Data Flow

```
IBKR Flex XML / CSV
        │
        ▼
  parser-xml.ts / parser-csv.ts
        │  IBKRData { trades[], dividends[], foreignIncome[] }
        ▼
  calculator.ts  ←  BOI exchange rates (RatesMap)
        │
        │  TaxResult { capitalGainLines[], dividendLines[], totals… }
        ▼
  TaxSummaryHero + TaxBreakdown  (display)
        │
        ▼
  pdf.ts / excel.ts  (export)
```

### Key types

**`IBKRData`** (`lib/ibkr/types.ts`) — raw parsed IBKR data:
- `trades: Trade[]` — all buy and sell transactions
- `dividends: Dividend[]` — dividend payments with withholding tax
- `foreignIncome: ForeignIncome[]` — other foreign income

**`TaxResult`** (`lib/tax/types.ts`) — calculated tax output:
- `netCapitalGainIls`, `capitalGainsTaxIls`
- `totalDividendsIls`, `dividendsTaxIls`
- `totalForeignTaxCreditIls`, `totalTaxLiabilityIls`
- `capitalGainLines[]`, `dividendLines[]` — per-item breakdown for display and export

---

## Deployment

### Next.js app → Vercel

```bash
# One-time: link the project
npx vercel link

# Deploy to production
npx vercel --prod
```

Set `NEXT_PUBLIC_PROXY_URL` to your deployed Cloudflare Worker URL in the Vercel project environment variables dashboard.

### Cloudflare Worker → Cloudflare

```bash
cd workers/ibkr-proxy

# One-time: authenticate
npx wrangler login

# Deploy
npm run deploy
```

Before deploying, update `ALLOWED_ORIGIN` in `workers/ibkr-proxy/wrangler.toml` to match your production Next.js domain:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-app.vercel.app"
```

---

## Contributing

### Development workflow

1. **Branch** — create a feature branch from `master`
2. **Code** — follow the conventions below
3. **i18n** — any new user-facing string must be added to both `messages/en.json` and `messages/he.json`
4. **Tests** — add or update tests in `__tests__/`; run `npm test` to verify
5. **Type check** — run `npx tsc --noEmit` to catch type errors
6. **PR** — open a pull request against `master`

### Coding conventions

- **Immutability** — never mutate objects in place; always return new copies with spread or `Object.assign`
- **Decimal strings** — all monetary values are plain strings (`"1234.56"`), never JS `number`; use helpers from `lib/tax/decimal.ts` for arithmetic
- **No `console.log`** in committed code
- **File size** — keep files under ~400 lines; split by responsibility when they grow
- **Error handling** — handle errors explicitly at every boundary; provide user-friendly messages in the UI

### Adding a new data source format

1. Create `lib/ibkr/parser-<format>.ts`
2. Export a function: `(input: string) => IBKRData`
3. Add a file type check in `components/import/FileUploadCard.tsx`
4. Add tests in `__tests__/lib/ibkr/parser-<format>.test.ts`

### Adding a new export format

1. Create `lib/reports/<format>.ts`
2. Export: `generate<Format>(result: TaxResult, taxYear: number): Promise<void>`
3. Add a button in `components/export/ExportPanel.tsx` with the corresponding i18n keys in `messages/en.json` and `messages/he.json`

### Running the full stack locally

```bash
# Terminal 1 — Cloudflare Worker proxy
cd workers/ibkr-proxy && npm run dev

# Terminal 2 — Next.js app
NEXT_PUBLIC_PROXY_URL=http://localhost:8787 npm run dev
```
