# Tax Research Findings — Investment Portion (IB-Taxil)

Verification of the IB-Taxil domain model against primary/authoritative Israeli tax sources: the Income Tax Ordinance (פקודת מס הכנסה [נוסח חדש], תשכ"א-1961), the Israel Tax Authority (רשות המסים / gov.il), official ITA forms, and the US–Israel Income Tax Treaty. Where a primary source could not be quoted verbatim online, a reputable Israeli tax-advisor write-up was used and the underlying statutory section recorded. Hebrew passages are quoted with English translation.

Research date: 2026-08-01. This file is research support, not tax advice; items flagged **PROFESSIONAL REVIEW** must be confirmed by a licensed מייצג/CPA before the tool claims "100% correct."

## Summary Table

| # | Item | Verdict vs. assumption | Confidence |
|---|------|------------------------|-----------|
| 1 | FX / inflationary component on foreign securities | CONFIRMED | High |
| 2 | Lot-matching method (FIFO) | REFINED | Medium |
| 3 | Loss offsetting (§92) | CONFIRMED | High |
| 4 | Treaty withholding caps | REFINED | High (div) / Medium (interest, REIT) |
| 5 | Foreign tax credit basket (per-country) | CONFIRMED | High |
| 6 | Rate date for dividends/interest | CONFIRMED (receipt date) | Medium |
| 7 | Capital-gains rate 25% / 30% | CONFIRMED | High |
| 8 | Dividend rate 25% / 30% | CONFIRMED | High |
| 9 | Interest rate 25% (15% case) | CONFIRMED + REFINED | High |
| 10 | Surtax (מס יסף) + 2025 +2% capital surtax | CONFIRMED | High |
| 11 | ITA form identifiers | REFINED | Medium–High |
| 12 | Output rounding | CONFIRMED (nearest whole shekel) | Medium |

---

## Item 1 — FX / inflationary component on foreign securities

**Rule (established):** For an individual selling a foreign-currency-denominated security, the taxable base is the **shekel real gain**: proceeds (תמורה) converted to NIS at the Bank of Israel representative rate (שער יציג) on the **sale date**, minus cost (יתרת המחיר המקורי) converted at the representative rate on the **purchase date**. The currency movement is therefore **fully inside** the taxable gain. There is **no separate inflationary/linkage relief (סכום אינפלציוני) for the currency component** for an individual: under §88, when a security is acquired in foreign currency, the *foreign exchange rate* is substituted for the CPI ("מדד") in the inflationary-amount computation — so the "inflationary amount" is measured against the currency, not the Israeli CPI, and there is no additional exemption carving out the currency gain. Practically, the FX gain is taxed at the same 25%/30% real-gain rate.

**Sources:**
- Ordinance §88 definition of "מדד": "לגבי נכס שנרכש במטבע חוץ... יראו כמדד את שער המטבע שבו נרכש הנכס" (for an asset acquired in foreign currency, the exchange rate of the currency in which the asset was acquired is treated as the index). Text collated at Wikisource — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; official consolidated PDF — https://www.gov.il/BlobFolder/legalinfo/law_pkudat_mas_hachnasa/he/... (פקודת מס הכנסה [נוסח חדש]).
- capitax.co.il computation description: "יש לחשב את ההפרש בין התמורה בש"ח (לפי השער היציג של המטבע הרלוונטי במועד המכירה) לבין עלות הרכישה בש"ח (לפי השער היציג במועד הרכישה)" — https://www.capitax.co.il/content/1/218 (difference between NIS proceeds at sale-date representative rate and NIS cost at purchase-date representative rate).
- mena.co.il: "25% מס על רווחי הון... על הרווח הריאלי" and, for foreign securities, "מחשבים את השינוי בשער החליפין מרכישת הנייר עד מכירתו" — https://www.mena.co.il/מיסוי-שוק-ההון/מיסוי-ניירות-ערך/
- §91 (rate on real gain), §101 (deemed-sale / election rules).

**Per-year values:** No year-specific values; the method and 25%/30% rate are stable 2022–2025.

**Confidence:** High. The shekel-real-gain method and the §88 currency-as-index substitution are consistently stated across the ITA computation regulations and multiple advisor sources.

**PROFESSIONAL REVIEW:** Confirm there is no residual individual exemption on the pure currency component and that IBKR proceeds/cost are converted at the correct BOI representative rate per leg. Loss caveat (see Item 3): a *loss* arising purely from currency depreciation on a security is treated differently in some ITA positions — verify with a מייצג before treating an FX-driven loss as fully deductible.

---

## Item 2 — Lot-matching method

**Rule (as best established):** Israeli law/ITA guidance does **not** publish an explicit statutory "FIFO mandatory" rule for identical marketable securities in the way U.S. regs do. In practice the ITA computation of gain per §88/§91 operates on "יתרת המחיר המקורי" per lot, and the widely accepted convention (and the ITA's default expectation, mirroring broker/bank withholding practice) is **FIFO** (נכנס ראשון יוצא ראשון). Accepting the broker's configured method is acceptable **when that method is FIFO**; a non-FIFO method (e.g. specific-ID / HIFO) is not clearly supported and should not be relied on without professional confirmation.

**Sources:**
- No primary ITA circular found stating a mandatory method; Israeli bank/broker withholding at source operates on a FIFO basis, which the annual return is expected to match. General FIFO-as-default background: cross-jurisdiction sources (e.g. law.cornell.edu/wex/fifo_accounting) — but these are **not** Israeli-authoritative.
- Ordinance §88 (per-lot "יתרת המחיר המקורי") — https://he.wikisource.org/wiki/פקודת_מס_הכנסה

**Per-year values:** None.

**Confidence:** Medium. FIFO is the practical default but I could not locate a first-party ITA statement mandating it in writing online.

**PROFESSIONAL REVIEW:** REQUIRED. Confirm with a מייצג/CPA that (a) FIFO is the ITA-expected method for identical securities, and (b) accepting IBKR's configured lot method is acceptable only when it resolves to FIFO. Flag any IBKR account configured to a non-FIFO basis.

---

## Item 3 — Loss offsetting (§92)

**Rule (established):** Under §92 of the Ordinance:
- **(a) Capital gains:** A capital loss offsets same-year capital gains (real gain), Israeli or foreign. §92(a)(1).
- **(b) Dividends and (c) interest from securities:** §92(a)(4) permits a securities capital loss to offset same-year **interest or dividends** — from the *same* security regardless of rate, and from *other* securities **only if the tax rate on that interest/dividend does not exceed 25% for an individual** (23% for a company). Interest/dividends taxed above these rates cannot absorb the loss.
- **Ordering:** Loss is offset first against capital gains (real gain), then against betterment (שבח מקרקעין); the interest/dividend absorption applies within the same year subject to the rate cap. For foreign-source losses there is a priority order (foreign gains first).
- **Carry-forward:** An unused loss carries forward **indefinitely** to subsequent years but may then be offset **only against capital gains** (real gain) and betterment (not against future interest/dividends), provided a return (דוח) was filed for the loss year (requirement since 2006).

**Sources:**
- Ordinance §92 — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; Hilan legal DB — https://www.hilan.co.il/.../פקודת-מס-הכנסה.../חלק-ה-רווחי-הון/
- t.m.l. explainer, quoting §92(a)(4) 25%/23% condition and same-year cross-offset — https://www.tamal.co.il/articles/קיזוז-הפסדים-לצרכי-מס-כולל-ניירות-ערך-ו/ : "כנגד ריבית או דיבידנד מניירות ערך אחרים, בתנאי ששיעור המס על ההכנסה אינו עולה על 23% בחברה או 25% ביחיד."
- ITA circular 10/2025 on capital-loss offsetting — https://www.naye.co.il/.../חוזר-מס-הכנסה-מס-10-2025/ (and y-tax analysis https://y-tax.co.il/capital-loss-offsetting/).
- rami arie (ralc.co.il) — https://www.ralc.co.il/...סעיף-92...aspx

**Per-year values:** None (rate cap tracks the 25% individual capital rate, stable 2022–2025).

**Confidence:** High.

**PROFESSIONAL REVIEW:** Recommended to confirm exact same-year ordering when both dividends and interest are present and to confirm the tool applies the ≤25% gate before absorbing a loss into dividends/interest. Review ITA circular 10/2025 for any 2025 nuance.

---

## Item 4 — Treaty withholding caps (US–Israel Income Tax Treaty, 1975, as amended by 1993 Protocol)

**Rule (established):**
- **Dividends — Article 12.** Maximum US withholding on **portfolio dividends** paid to an Israeli-resident individual is **25%**. The reduced **12.5%** rate is for a **company** that owns at least the threshold voting interest (direct-dividend / substantial corporate ownership) — it does **not** apply to an individual merely holding ≥10%. (Note: US domestic law under the treaty typically results in a **15%** treaty rate applied on Form W-8BEN in practice for qualified dividends, but the treaty *cap* is 25%; verify the actual withheld rate on IBKR statements.)
- **Interest — Article 13.** General maximum US withholding on interest is **17.5%**; reduced rates apply (≈10% for interest paid to financial institutions; 0% for certain government-backed debt).
- **REITs / PTPs:** The treaty text does not carve out REIT distributions at the reduced dividend rate; REIT dividends and PTP (publicly traded partnership) distributions are commonly withheld at higher US statutory rates (often 37%/up to the maximum) and may exceed the treaty cap — treat withholding above the treaty cap cautiously.

**Sources:**
- IRS treaty PDF — https://www.irs.gov/pub/irs-trty/israel.pdf (Articles 12 Dividends, 13 Interest).
- JCT explanation of 1993 Protocol — https://www.taxnotes.com/research/federal/legislative-documents/congressional-joint-committee-prints/full-text-jcts-explanation-of-1993-protocol-to-united-states/14b4m
- taxesforexpats guide (article-mapped): Dividends Art. 12 = 25% portfolio / 12.5% substantial corporate; Interest Art. 13 = 17.5% general, 10% financial institutions, 0% government debt — https://www.taxesforexpats.com/country-guides/israel/us-israel-tax-treaty.html
- PwC withholding summary — https://taxsummaries.pwc.com/israel/corporate/withholding-taxes

**Per-year values:** Treaty caps are stable across 2022–2025.

**Confidence:** High for the dividend 25%/12.5% article mapping; Medium for interest sub-rates and REIT/PTP treatment.

**PROFESSIONAL REVIEW:** Confirm the *actual* US rate applied to the client's IBKR account (W-8BEN 15% vs. treaty 25% cap) and REIT/PTP over-withholding handling before classifying anything as non-creditable "over-withholding."

---

## Item 5 — Foreign tax credit basket (per source country / per basket)

**Rule (established):** Israel grants a foreign tax credit for foreign taxes on foreign income (§§199–210). The credit ceiling is computed on a **"סל" (basket) basis: per source country AND per income type** (employment, business, capital gains, dividends, interest, rent, royalties). Foreign tax on one basket cannot be credited against Israeli tax on another basket (e.g. foreign tax on employment income cannot offset Israeli tax on capital gains). Within the same country and same income type, income is **pooled**. Credit limit = Israeli tax attributable to that basket of foreign income. Excess credit (עודף זיכוי) may be **carried forward up to 5 years**, CPI-indexed, and only within the same source/basket (§205א). §207ב allows foreign tax paid within 24 months of year-end to count for that year.

**Sources:**
- Ordinance §§199–210, esp. §199 ("הכנסות חוץ"), §204 (mechanism / baskets), §205א (5-year carry-forward), §207ב — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; gov.il consolidated PDF.
- Grant Thornton tax guide §17.4 "זיכוי בגין מס זר" — https://taxguide.grantthornton.co.il/article/17-4-זיכוי-בגין-מס-זר/
- b.s.h. CPA foreign-tax-credit guide — https://www.bshcpa.co.il/foreign-tax-credit-israel/ ("מס זר ששולם על הכנסת עבודה אינו מקוזז כנגד מס ישראלי על רווח הון"; carry-forward 5 years per §205א).
- Reporting via טופס 1324 (נספח ד) — https://www.zscpa.co.il/טופס-1324/

**Per-year values:** None.

**Confidence:** High.

**PROFESSIONAL REVIEW:** Recommended to confirm the tool computes the ceiling per country×basket (not aggregated) and handles 5-year עודף זיכוי carry-forward correctly.

---

## Item 6 — Rate date for dividends/interest conversion

**Rule (established):** A foreign dividend or interest payment is converted to NIS at the Bank of Israel representative rate (שער יציג) on the **date the income arises — i.e. the payment/receipt (pay) date** of the dividend/interest, consistent with the cash-basis recognition of investment income for individuals. (For capital gains, the two-legged rule applies: proceeds at the **sale date**, cost at the **purchase date** — Item 1.)

**Sources:**
- Ordinance §100א/§88 rate-conversion principles; capitax computation note — https://www.capitax.co.il/content/1/218
- General principle (income on receipt): advisor materials — https://www.greeninvoice.co.il/magazine/מס-דיבידנד/ ; https://www.ucan2.co.il/מס-דיבידנד/

**Per-year values:** None.

**Confidence:** Medium. The receipt/payment-date rule is the accepted convention and follows from cash-basis recognition, but I did not locate a single primary ITA citation stating the exact rate date verbatim for dividends/interest (as opposed to the well-cited sale-date/purchase-date rule for capital gains).

**PROFESSIONAL REVIEW:** REQUIRED to confirm whether the pay date (vs. settlement/ex date) governs the שער יציג for foreign dividends and interest, and how IBKR pay-date timestamps map to the BOI daily rate.

---

## Item 7 — Capital-gains rate

**Rule (established):** Individual real capital gain on securities is taxed at a maximum **25%**; **30%** if the seller is a **בעל מניות מהותי** (substantial shareholder — a holder of ≥10% of some means of control, at sale or in the preceding 12 months). §91(b).

**Sources:**
- Ordinance §91(b): "יחיד יהיה חייב במס על רווח הון ריאלי... בשיעור שלא יעלה על 25%... ואם הוא בעל מניות מהותי — 30%" — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; Hilan Part E — https://www.hilan.co.il/.../חלק-ה-רווחי-הון/
- mena.co.il, meitav confirmations.

**Per-year values:** 25% / 30% for **2022, 2023, 2024, 2025** (unchanged). Note the separate 2025 +2% capital surtax — Item 10.

**Confidence:** High.

**PROFESSIONAL REVIEW:** Confirm substantial-holder detection (≥10% test incl. 12-month lookback).

---

## Item 8 — Dividend rate

**Rule (established):** Dividend to an individual taxed at **25%**; **30%** for a בעל מניות מהותי. §125ב.

**Sources:**
- Ordinance §125ב — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; Hilan Part H (חלק ז' שיעורי המס) — https://www.hilan.co.il/.../חלק-ז-שיעורי-המס/
- PwC / advisor confirmations.

**Per-year values:** 25% / 30% for **2022–2025** (unchanged). Plus 2025 +2% capital surtax — Item 10.

**Confidence:** High.

**PROFESSIONAL REVIEW:** None specific beyond substantial-holder detection.

---

## Item 9 — Interest rate

**Rule (established + refined):** Individual tax on interest is generally **25%** where the asset is **linked to the CPI or to foreign currency** (real interest) — which covers **foreign-currency interest income from IBKR**. A **15%** rate applies under §125ג only where the asset is **not** linked to an index or to foreign currency (nominal shekel interest, e.g. unlinked shekel deposits), taxed on the full nominal amount. Foreign-currency-denominated interest therefore falls in the **25%** bucket.

**Sources:**
- Ordinance §125ג — https://he.wikisource.org/wiki/פקודת_מס_הכנסה ; Hilan Part H — https://www.hilan.co.il/.../חלק-ז-שיעורי-המס/
- Regulations "ניכוי מריבית, מדיבידנד ומרווחים מסוימים", תשס"ו-2005 — https://www.nevo.co.il/law_html/law01/999_549.htm
- bizportal explainer of 15% vs 25% (linked/foreign-currency = 25%, unlinked shekel = 15%) — https://www.bizportal.co.il/guides/news/article/20036858

**Per-year values:** 25% (linked/FX) / 15% (unlinked shekel) for **2022–2025** (unchanged). Plus 2025 +2% capital surtax — Item 10.

**Confidence:** High.

**PROFESSIONAL REVIEW:** Confirm all IBKR interest (USD/foreign-currency and broker credit interest) is treated as 25% (foreign-currency-linked), not 15%.

---

## Item 10 — Surtax (מס יסף), incl. 2025 additional capital-income surtax

**Rule (established):**
- **Base surtax §121ב:** additional **3%** on the portion of an individual's total **taxable income** (הכנסה חייבת) exceeding the annual threshold. Applies to all income including capital gains, dividends, interest, betterment.
- **2025 additional capital-income surtax:** The Economic Efficiency (Arrangements) Law for 2025 (חוק ההסדרים, published 26 Dec 2024; Amendment 276) added a further **2%** on **capital-source income** exceeding the same threshold — applicable to capital gains, dividends, interest, rent, royalties, and real-estate betterment (שבח). **Effective from tax year 2025.** The 2% is measured on **capital income above the threshold** (not total income), stacking on top of the base 3% — so investment income above the threshold can bear up to **5%** surtax in total.

**Per-year thresholds and rates:**

| Year | Base surtax rate | Threshold (הכנסה חייבת) | Additional capital surtax |
|------|-----------------|--------------------------|---------------------------|
| 2022 | 3% | 663,240 ₪ | — (none) |
| 2023 | 3% | 698,280 ₪ | — (none) |
| 2024 | 3% | 721,560 ₪ | — (none) |
| 2025 | 3% | 721,560 ₪ | **+2% on capital income > 721,560 ₪** |

(Threshold frozen at 721,560 ₪ for 2025–2027.)

**Sources:**
- Ordinance §121ב — https://he.wikisource.org/wiki/פקודת_מס_הכנסה
- ITA implementation directive on מס נוסף — https://www.capitax.co.il/content/2/3171
- Wikipedia מס יסף (per-year thresholds) — https://he.wikipedia.org/wiki/מס_יסף
- b.s.h. CPA per-year thresholds — https://www.bshcpa.co.il/מס-יסף/
- y-tax 2025 analysis (2% additional, 721,560 ₪, capital sources, §121ב / Amendment 276) — https://y-tax.co.il/מס-נוסף-על-הכנסות-גבוהות-מס-יסף-בשנת-2025/
- PwC Arrangements Law 2025 — https://www.pwc.com/il/he/tax/tax-news-2024/law_of_arrangements_2025.html ; malam — https://www.malam-payroll.com/מס-על-הכנסות-גבוהות...

**Confidence:** High.

**PROFESSIONAL REVIEW:** Recommended to confirm the exact interaction of the two thresholds (both at 721,560 ₪ for 2025) and the precise definition of "capital income" for the +2% (e.g. whether specific exempt items are excluded), and to confirm no transitional/apportionment rule for 2025.

---

## Item 11 — ITA form identifiers (investment portion)

**Rule (established + refined):**
- **טופס 1301** — main annual return for an individual ("דין וחשבון על ההכנסה"), reporting Israeli and foreign income; contains the lines for foreign dividends and foreign interest (income sourced from abroad).
- **טופס 1322 — נספח ג'** — capital gains from marketable securities (רווח הון מניירות ערך). *(Matches the assumption.)*
- **טופס 1325 — נספח ג(1)** — capital gain from marketable securities **on which tax was not withheld at source** (relevant for foreign brokers like IBKR where no Israeli withholding occurred). *(New: this, not 1324, is the securities-detail-without-withholding form.)*
- **טופס 1324 — נספח ד'** — **foreign income and foreign tax paid** (הכנסות מחוץ לישראל והמס ששולם עליהן) — i.e. the **foreign-tax-credit** appendix. *(Refinement: the item assumed 1324 was the "securities detail"; it is actually the foreign-income / foreign-tax-credit appendix.)*

**Sources:**
- ITA 2025 return service (forms) — https://www.gov.il/he/service/reporting-and-payment-2025-annual-tax-report-for-individuals ; 1325 (2025) PDF — https://www.gov.il/BlobFolder/service/.../1325-2025.pdf
- 1322 נספח ג' explainers — https://taxes-refund.co.il/טופס-1322... ; https://www.mytax.co.il/טופס-1322/
- 1324 נספח ד' (foreign income + foreign tax) — https://www.zscpa.co.il/טופס-1324/
- Forms index (all years) — https://www.haimasher.com/טפסים-מס-הכנסה

**Per-year values:** Same form numbers across 2022–2025; field/box numbers are re-set annually — verify against the specific tax-year form PDF.

**Confidence:** Medium–High on form numbers; Medium on exact field/box labels (these vary by year).

**PROFESSIONAL REVIEW:** REQUIRED. Confirm mapping: capital gains → 1322 (נספח ג') and 1325 (נספח ג(1)) for foreign/no-withholding lots; foreign dividends/interest and FTC → 1324 (נספח ד'); and the exact 1301 line numbers for foreign dividends/interest for each tax year. Update the domain model's assumption that 1324 is "securities detail."

---

## Item 12 — Output rounding

**Rule (established):** ITA amounts are handled in **whole shekels**, rounded to the **nearest** shekel, with **half a shekel rounded up** (0.5 → up). This follows the general rounding convention (חוק עיגול סכומים, תשמ"ה-1985 and צו מס הכנסה (כללים לעיגול סכומים), התשמ"ו-1986): "סכום של חצי שקל יעוגל כלפי מעלה" (a half-shekel is rounded up), amounts below half a shekel are dropped, half or more counts as a full shekel.

**Sources:**
- חוק עיגול סכומים, תשמ"ה-1985 — https://www.nevo.co.il/law_html/law01/p179k1_001.htm ; Wikisource — https://he.wikisource.org/wiki/חוק_עיגול_סכומים
- צו מס הכנסה (כללים לעיגול סכומים), התשמ"ו-1986 — https://www.hilan.co.il/.../צו-מס-הכנסה-כללים-לעיגול-סכומים-התשמו-1986/

**Per-year values:** None.

**Confidence:** Medium. The nearest-whole-shekel / half-up convention is well supported; whether every individual field on 1301/1322/1324 is rounded (vs. some carried in agorot) should be checked against the specific form instructions.

**PROFESSIONAL REVIEW:** Recommended to confirm the ITA electronic-filing (SHAAM) rounding expectation for each reported field.

---

## Cross-cutting notes

- Several primary texts (Wikisource, IRS treaty PDF, some gov.il PDFs) could not be quoted verbatim by the fetch tool; statutory content was corroborated across the official consolidated Ordinance PDF (gov.il), the Hilan/Nevo legal databases, and multiple licensed-advisor write-ups that cite the underlying sections. Section numbers (§88, §91, §92, §121ב, §125ב, §125ג, §§199–210, §205א) are consistent across those sources.
- Items flagged **PROFESSIONAL REVIEW / REQUIRED**: 2 (FIFO), 6 (dividend/interest rate date), 11 (form/field mapping). Items with recommended (non-blocking) professional confirmation: 1, 3, 4, 5, 7, 10, 12.

---

This file's path: `docs/tax-research-findings.md`
