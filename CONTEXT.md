# IB-Taxil

A privacy-first, browser-based tool that turns an individual Israeli investor's Interactive Brokers (IBKR) activity into the figures needed for their annual Israeli tax return. This glossary fixes the domain language so the tax model stays precise and legally faithful.

## Language

### Income types (what the tool computes)

**Capital Gain**:
The taxable gain on a realized sale of a security, expressed as a [Real Gain] in shekels under Israeli law. In scope for v1: long positions in stocks and ETFs.
_Avoid_: profit, P&L, gain/loss (ambiguous about currency and realization).

**Real Gain** (רווח ריאלי):
A realized gain measured in shekels as `proceedsUsd × rate(saleDate) − costUsd × rate(openDate)` per [Closed Lot] — proceeds converted at the sale-date BOI rate, cost at the purchase-date rate. This is the taxable base; the FX movement between the two dates is part of it. Never computed by converting a USD P&L figure at a single date.

**Closed Lot**:
The unit of capital-gain calculation: a specific quantity of a security that was bought on one [Open Date] and later sold, realizing a [Real Gain]. One sale order may close several lots opened on different dates.

**Open Date**:
The purchase date of a [Closed Lot], used to select the BOI rate for the cost leg. Mandatory for every realized sale; a sale whose open date is unknown cannot be computed.

**Dividend**:
A distribution paid on a held security, taxed in Israel with a credit for foreign tax withheld at source (see [Foreign Tax Credit]). In scope for v1.

**Interest**:
Broker/cash interest received on idle balances (IBKR "Broker Interest Received" and similar), taxed at 25%, eligible for [Foreign Tax Credit] if tax was withheld, and offsettable by [Capital Loss]. A distinct income type — never merged into [Capital Gain] or [Dividend]. Bond coupon interest is **not** included (it travels with bond support, an [Out-of-Scope Instrument]).

**Out-of-Scope Instrument**:
Any imported IBKR record the tool does not yet compute correctly — currently options/derivatives, bonds and bond coupons, short positions, private forex gains, and any unrecognized cash-transaction type. The tool must **detect and flag** these and refuse to produce a number for them, never silently fold them into another bucket. New income types are added by extending the model at this seam, not by widening an existing bucket. The v1 computed model is exactly three types — [Capital Gain], [Dividend], [Interest] — plus this detection.

### Scope & output

**Investment Portion**:
The boundary of what this tool computes: everything an Israeli annual return needs **about the user's IBKR investments** — capital gains, dividends, interest, foreign tax credit, and the capital-income share of surtax. It explicitly excludes the rest of the return (salary, deductions, credit points, personal status) and never claims to be a complete טופס 1301.

**Filing Package**:
The tool's output for the [Investment Portion]: the pre-filled capital-gains appendix, the exact 1301 investment-line values, the foreign-tax-credit and surtax figures, and the plain-language portal field guide. Emitted both human-readably (PDF/Excel/on-screen) **and** as a structured, versioned data contract so a future full-1301 tool can consume it directly.

### Tax year

**Tax Year**:
The Israeli calendar tax year the return covers. It selects which row of rates/thresholds applies (rates are keyed by year, so adding an upcoming year is a one-row, verified change) and defines the realization year for a [Capital Gain] (by sale date). v1 supports a verified range (2022–2025) and refuses years outside it rather than applying unverified rates.

### Import sources

**Flex Query**:
An IBKR-configured export (delivered via the Flex Web Service API or as a downloaded file) that can include a **Closed Lots** section with per-lot open dates and cost basis. The only source that supports correct [Capital Gain] computation. Must be configured to include Trades, Closed Lots, and Cash Transactions.

**Activity Statement**:
The simpler report most users download from the IBKR portal (typically CSV). Lacks per-lot open dates, so it **cannot** support [Capital Gain] and is limited to [Dividend] / [Interest]. Not a substitute for a [Flex Query].

### Currency

**Representative Rate** (שער יציג):
The Bank of Israel's official daily rate for a currency, used to convert every amount to shekels at the rate for **that instrument's own currency** and the relevant date. For a date BOI published no rate (weekend/holiday), the last previously-published rate is used. A currency BOI does not publish is unsupported → the line is an [Out-of-Scope Instrument].
_Avoid_: FX rate, spot rate, market rate.

**Quarantine**:
Setting an [Out-of-Scope Instrument] aside from the computed totals and listing it explicitly as "not included — report separately," so the in-scope result can still be presented without ever absorbing an uncomputed item. Distinct from **blocking**, which halts the whole result when *in-scope* data is missing (a fixable defect) until the user corrects the source export.

**Explanation**:
The plain-language, non-expert account that accompanies **every** figure the tool outputs — what it is, how it was derived (inputs, rate, date), and what the user should do with it. Explanations are part of the domain output (each result line carries its own), not decoration added in the UI. See ADR-0005.

### Losses

**Capital Loss**:
A negative [Real Gain] on a realized sale *in the current year*. Offset in legal order (§92(a)): first against current-year [Capital Gain], then against same-year [Dividend] and [Interest] from *other* securities taxed at ≤25%. This dividend/interest reach applies **only to current-year losses**.

**Brought-Forward Loss**:
A capital loss from a **prior** tax year the investor carries into this year. By §92's carry-forward rule it may offset **only current-year [Capital Gain]** — *not* current-year dividends or interest (unlike a current-year [Capital Loss]). Entered manually by the user (the tool is stateless and cannot know it), and clearly explained so the user knows what to enter and where to find it on last year's return.

**Carry-Forward Loss**:
The unused loss remaining after all current-year offsets, carried to future years — where it too may offset **only capital gains**, not dividends/interest. The tool computes and displays it but does not store it; the user records it for next year (and may only carry it if a return was filed for the loss year).

### Parties & status

**Substantial Holder** (בעל מניות מהותי):
An individual holding ≥10% of a specific company, whose [Capital Gain] and [Dividend] from *that company* are taxed at 30% instead of the default 25%. The tool cannot infer this; the user declares it **per holding** via an optional advanced control, and the declaration feeds both the dividend and the capital-gain rate for that ticker. Default for every holding is non-substantial (25%).

**Surtax** (מס יסף):
An additional tax on annual taxable income above a year-specific threshold: a base rate on all income over the threshold, plus (from 2025) an extra rate on the capital-income portion. Assessed on **total** income from all sources, so the tool stacks the IBKR capital income on top of the user-supplied **Other Income** to find the portion above the threshold. Optional: skipped with a warning if the user doesn't supply other income.

**Other Income**:
The user's total annual taxable income from sources outside IBKR (chiefly salary, read from form 106 / תלוש). A manual input used only to compute [Surtax]; never stored.

**Foreign Tax Credit**:
A credit for tax withheld abroad (e.g. US dividend withholding), offset against the Israeli tax due on the same income. Computed **per source-country basket** — foreign tax and Israeli liability are pooled within a country, so excess on one line can cover a shortfall on another — capped at the Israeli liability and (per treaty) at the rate the source country was entitled to levy. Where source country can't be determined, falls back to a per-line `min(actualWithheld, israeliTaxDue)` with a flag. Every credit line is explained to the user.
_Avoid_: withholding refund, tax rebate.

**Over-Withholding**:
Foreign tax withheld above the treaty-entitled rate for that income type — for US income: **25%** on portfolio dividends (Art. 12), **17.5%** on interest (Art. 13). The excess is not credited in Israel and not lost — the investor reclaims it from the source country. The tool flags the affected line and explains the reclaim, never silently absorbing it into the credit. (Because the interest cap is 17.5% < the 25% Israeli rate, interest can leave a residual Israeli liability even when foreign tax was withheld.)

**Excess Credit** (עודף זיכוי):
[Foreign Tax Credit] within a country/basket that exceeds the Israeli liability on that basket. Carried forward up to 5 years (CPI-indexed, §205א) within the same source/basket. Being stateless, the tool computes and displays it as a carry-forward figure the user records themselves, rather than storing it.
