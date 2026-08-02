# Scope is the investment portion only, emitted as a published, versioned contract

This tool computes the **investment portion** of the Israeli annual return (capital gains, dividends, interest, foreign tax credit, and the capital-income share of surtax) — not the full טופס 1301, which needs salary, deductions, credit points, and personal data the tool never sees. It says so plainly to the user rather than implying a finished, signable return.

A separate downstream tool will later assemble the full 1301 by consuming this tool's output. Therefore the Filing Package is a **structured, versioned data contract** — a stable machine-readable artifact — alongside the human-readable PDF/Excel/on-screen guide. The contract is a first-class output, not a byproduct of the UI.

Trade-off: we take on the cost of designing and versioning an output schema now, before the consumer exists, to avoid a later rewrite when the full-1301 tool needs a clean seam. Accepted because the boundary between "investment portion" and "full return" is deliberate and long-lived (see ADR-0006 for why we still ask limited salary data — solely to compute capital surtax, not to file it).

Verified form mapping (research 2026-08-01): capital gains → **טופס 1322 (נספח ג׳)** and **טופס 1325 (נספח ג(1))** for securities with no withholding at source (the IBKR case); foreign dividends/interest and the foreign tax credit → **טופס 1324 (נספח ד׳)**; plus the foreign-income lines of the main **טופס 1301**. (An earlier assumption that 1324 was the securities-detail form was wrong — 1324 is the foreign-income/FTC appendix.) Per-year field/box numbers still need confirmation against each tax-year PDF.
