# Disclaimer

**Read this before using IB-Taxil or relying on anything it produces.**

IB-Taxil is a free, open-source software tool that helps individual investors
organize Interactive Brokers (IBKR) data and estimate the *investment portion* of
an Israeli individual income-tax return. It is provided **"AS IS"**, without
warranty of any kind, as a convenience and educational aid only.

## 1. Not professional advice

IB-Taxil does **not** provide tax, legal, accounting, investment, or financial
advice, and using it does **not** create any advisor–client, accountant–client,
or fiduciary relationship. Its output is an automated estimate, not a filed
return and not a professional opinion.

**You must have your results reviewed by a licensed Israeli tax professional
(רו״ח / יועץ מס) before you file anything with the Israel Tax Authority.**

## 2. No warranty

To the maximum extent permitted by law, the authors and contributors make **no
representations or warranties** of any kind — express or implied — about the
accuracy, completeness, reliability, timeliness, legality, or fitness for a
particular purpose of the software or its output. Tax law, exchange rates, ITA
form field numbers, and published constants change; the software may contain
errors, omissions, or out-of-date assumptions. See the **"AS IS"** and warranty
disclaimer in [`LICENSE`](./LICENSE) (Apache License 2.0, Sections 7–8).

## 3. Limitation of liability

To the maximum extent permitted by law, in no event shall the authors or
contributors be liable for any claim, damages, tax, penalty, interest, loss, or
other liability — whether in contract, tort, or otherwise — arising from, out of,
or in connection with the software or the use of, or reliance on, its output.
**You use IB-Taxil entirely at your own risk, and you are solely responsible for
what you report and file.**

## 4. Scope limitations

IB-Taxil covers only the *investment portion* of a return derived from IBKR
closed-lot data — capital gains, foreign dividends, foreign interest, foreign tax
credit, and surtax on that income. It does **not** compute a complete return. In
particular it does not handle salary/employment income, business or freelance
income, Israeli-source securities, real estate, pensions/provident funds,
cryptocurrency, options/derivatives, other brokers or accounts, or personal
credits and deductions (נקודות זיכוי / ניכויים). It assumes the IBKR data you
provide is complete and correct for the account it came from.

## 5. Provisional (future-year) estimates

For a tax year whose official ITA constants have not yet been published, the
engine carries the most recent confirmed year's constants forward and labels the
result **"provisional."** Provisional numbers are estimates only and **must** be
re-checked against that year's official figures (surtax threshold, rates, and any
legislative change) before use.

## 6. No affiliation

IB-Taxil is an independent project. It is **not** affiliated with, authorized by,
endorsed by, or sponsored by the **Israel Tax Authority (רשות המסים)**,
**Interactive Brokers**, the **Bank of Israel**, or any government body. All
product names, trademarks, and registered trademarks are the property of their
respective owners and are used for identification only.

## 7. Data and privacy

IB-Taxil is designed to process your data in your browser. It does not sell your
data. However, no software is perfectly secure, and you remain responsible for
safeguarding your own financial information and for how you deploy or host the
software.

## 8. Jurisdiction of the tax logic

The tax logic targets Israeli individual income tax and assumes Israeli tax
residency. It is not applicable to other jurisdictions and may be wrong for your
specific facts (e.g. new immigrant / returning-resident benefits, non-residency,
or special rulings).

---

By using IB-Taxil you acknowledge that you have read and agree to this disclaimer
and to the terms of the [`LICENSE`](./LICENSE).
