# ITA Field Codes (investment portion)

Numbered field codes on the Israeli annual return and its appendices, for the
figures this tool produces. Encoded in `lib/reports/field-codes.ts` and rendered
by the filing walkthrough (Step 7) and the export field guide.

**Verified against the official gov.il PDFs for tax years 2024 and 2025.** The
codes have been stable across years, but for any year other than 2024/2025 the
UI marks them "unverified — confirm for {year}".

## Sources (official, gov.il)

- **1301** (main annual return, 2024): `Service_Pages_Income_tax_annual-report-2024_1301-2024.pdf` — updated 2.2025.
- **1322** (נספח ג — securities capital gains, 2024): `Service_Pages_Income_tax_annual-report-2024_itc1322-2024.pdf` — updated 11.2024.
- **1325** (נספח ג(1) — per-lot detail, no withholding, 2025): `Service_Pages_Income_tax_annual-report-2026_1325-2025-ACC.pdf` — updated 12.2025.
- **1324** (נספח ד — foreign income & foreign tax, 2024): `Service_Pages_Income_tax_annual-report-2024_itc1324-2024.pdf` — updated 10.2024.

All under `https://www.gov.il/BlobFolder/service/reporting-and-payment-<year>-annual-tax-report-for-individuals/he/`.

## Mapping

| Figure | Form 1301 field | נספח ד (1324) foreign-tax box | Notes |
|---|---|---|---|
| Securities sale proceeds (turnover) | **256** (line 37) | 439 income / 422 tax | Carried from נספח ג/ג(1)/ג(2). |
| Foreign dividend 25% (§125ב) | **141** (line 17) | 462 income / **431** tax | Regular portfolio dividend. |
| Substantial-holder dividend 30% | **055** (line 18) | 455 income / **413** tax | 10%+ holder. |
| Foreign interest 25% (§125ג) | **157** (line 15) | 457 income / **417** tax | Securities/broker interest, foreign currency. |
| Total foreign income (excl. capital gain) | **290** (line 38) | — | Attach נספח ד. |
| Capital gain — detail | per-lot on **1325** | — | Columns א(cost)/ב(index-FX)/ג(adjusted)/ד(proceeds); ד−ג = real gain. |
| Capital gain — net by rate | **1322**, 25%/30% column | — | 1325 total flows here; tax computed on 1322. Turnover code 56 on 1322 → 1301 field 256. |
| Surtax (מס יסף §121ב) | *system-computed* | — | No filer amount field; mark the §121ב(ה) over-threshold checkbox on 1301 p.1. |

### Cross-verification
Form 1324 explicitly states each foreign-income line "הסכום צורף להכנסות בשדות
… בטופס 1301", which matches the 1301 line codes above (141/241/341 for dividend
25%, 157/257/357 for interest 25%, 055/212/312 for dividend 30%). The three codes
per line are: combined-spouses / registered-spouse / spouse — the tool cites the
primary code; the correct column depends on filing status.

## Still needs licensed sign-off
- Whether IBKR broker interest belongs on the 25% securities-interest line (157)
  vs. the deposit-interest line (142). We use 157.
- Exact 1322 cell code for the net taxable gain at 25% (turnover→256 is verified).
- Reconfirm all codes when a new tax-year form is published.
