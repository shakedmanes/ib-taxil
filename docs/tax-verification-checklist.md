# Tax Verification Checklist

Status of the domain model against Israeli tax law. Full research with sources is in [tax-research-findings.md](./tax-research-findings.md) (researched 2026-08-01). Status: ☑ verified · ◐ verified but needs licensed מייצג/CPA sign-off before "100% correct" · ☐ open.

- ☑ **FX / inflationary component (ADR-0001).** Confirmed (High): full shekel real gain is taxable; §88 substitutes the FX rate for the CPI for foreign-currency assets — no individual exemption on the currency component. ◐ Caveat: an FX-driven *loss* may be treated differently by some ITA positions — confirm before treating a purely currency-driven loss as fully deductible.
- ◐ **Lot-matching method (ADR-0002).** FIFO is the practical default but **no primary ITA circular mandating it was found** (Medium). Needs מייצג sign-off; flag any IBKR account not on FIFO.
- ☑ **Loss cross-offset (ADR-0004).** Confirmed (High, §92(a)(4)): current-year securities losses offset same-year gains, then dividends/interest from *other* securities only if taxed ≤25% (individual). **Refinement:** losses *carried forward* to future years may offset only capital gains — not future dividends/interest. So a **Brought-Forward Loss offsets only current-year capital gains**, while a **current-year loss** can also reach current-year dividends/interest.
- ◐ **Treaty withholding caps.** Dividends Art. 12 = **25%** portfolio cap for individuals (12.5% is corporate-only) — High. Interest Art. 13 = **17.5%** general (≈10% financial institutions, 0% gov debt) — Medium. REIT/PTP often over-withheld — Medium. Confirm actual IBKR W-8BEN rate (often 15% on dividends) vs treaty cap before flagging Over-Withholding.
- ☑ **Foreign tax credit basket (§§199–210).** Confirmed (High): ceiling per source country × income basket, pooled within a country/type; **excess credit (עודף זיכוי) carries forward 5 years, CPI-indexed** (§205א).
- ◐ **Dividend/interest rate date.** Receipt/payment (pay) date governs the שער יציג (Medium — accepted convention, no single verbatim primary citation). Confirm pay vs settle/ex date and IBKR timestamp mapping.
- ☑ **Capital-gains rate (§91b).** 25% / 30% substantial holder — confirmed, unchanged 2022–2025.
- ☑ **Dividend rate (§125ב).** 25% / 30% — confirmed, unchanged 2022–2025.
- ☑ **Interest rate (§125ג).** Foreign-currency/linked interest (the IBKR case) = **25%**; the 15% rate is only for *unlinked shekel* interest. Confirmed (High).
- ☑ **Surtax threshold & rates (§121ב) (ADR-0006).** Base 3% over threshold — **2022: ₪663,240 · 2023: ₪698,280 · 2024–2025: ₪721,560**. **2025 Arrangements Law (Amendment 276) adds +2% on capital-source income over ₪721,560, effective tax year 2025** (→ up to 5% on investment income). Confirmed (High). ◐ Confirm exact "capital income" definition for the +2% and any 2025 transitional rule.
- ◐ **ITA form identifiers (ADR-0007).** **Corrected:** 1322 = נספח ג׳ (securities capital gains); **1325 = נספח ג(1)** (securities gains with *no* withholding at source — the IBKR case); **1324 = נספח ד׳** (foreign income + foreign tax credit); 1301 main return foreign dividend/interest lines. Form numbers Medium–High; per-year field/box numbers vary — verify against each tax-year PDF.
- ◐ **Output rounding (ADR-0009).** Nearest whole shekel, half rounded up (חוק עיגול סכומים 1985 / צו 1986) — Medium. Confirm per-field on the e-filing (SHAAM) forms.

## Before "100% correct" can be claimed
A licensed מייצג/CPA must sign off — at minimum the ◐ items above: FIFO acceptability, treaty caps vs actual IBKR withholding, dividend/interest rate date, the 1301/1322/1324/1325 field mapping per year, and the 2025 +2% capital-surtax scope.
