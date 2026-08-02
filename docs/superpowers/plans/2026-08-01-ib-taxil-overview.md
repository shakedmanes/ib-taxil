# IB-Taxil Rebuild — Master Plan Index

The full plan to make IB-Taxil produce the **correct investment portion** of an Israeli tax return from IBKR data, as decided in the grilling session (see `CONTEXT.md`, `docs/adr/0001–0009`) and verified in `docs/tax-research-findings.md`.

## The five plans (in dependency order)

| # | Plan | File | Delivers | Depends on |
|---|------|------|----------|-----------|
| A | Tax calculation engine | [2026-08-01-tax-engine.md](./2026-08-01-tax-engine.md) | Pure, tested engine: types, verified rate table, capital gains, losses, dividends, interest, FTC basket, surtax, orchestrator | — |
| B | IBKR parsing | [2026-08-01-ibkr-parsing.md](./2026-08-01-ibkr-parsing.md) | Flex XML → `IBKRData` (closed lots, dividends, interest, quarantine); Activity Statement rejected | A (types) |
| C | BOI rates | [2026-08-01-boi-rates.md](./2026-08-01-boi-rates.md) | Multi-currency, multi-year `RatesMap` | A (types) |
| D | Filing Package & exports | [2026-08-01-filing-package-exports.md](./2026-08-01-filing-package-exports.md) | Versioned contract + PDF/Excel/field map | A |
| E | Six-step UI flow | [2026-08-01-ui-flow.md](./2026-08-01-ui-flow.md) | Wizard wiring engine + parser + rates + exports, bilingual, blocked/quarantine UX | A, B, C, D |

## Recommended build sequence

1. **A** first — it's pure, has zero external dependencies, and encodes the verified law. Everything else consumes its types.
2. **B** and **C** in parallel — both only need A's types; they feed the engine real data and rates.
3. **D** — needs A's `TaxResult`.
4. **E** last — integrates A–D end to end; this is where `tsc` goes fully green (A alone intentionally leaves old consumers broken until B/E migrate them).

## Correctness gate (do not skip)

`docs/tax-verification-checklist.md` lists the rules verified against primary sources and the **◐ items still needing a licensed מייצג/CPA sign-off**: FIFO acceptability, dividend/interest rate-date, per-year ITA form field numbers, the exact 2025 +2% capital-surtax scope, and the FX-driven-loss caveat. The engine is built to be correct; these constants/mappings are the last mile before the tool may claim "100% correct." They are isolated as data (rate table, field map, treaty caps) so sign-off changes touch data, not logic.

## Traceability

Every plan's Self-Review maps its tasks back to the ADRs (0001 real-gain method · 0002 closed-lots source · 0003 Flex-only import · 0004 loss offsetting · 0005 explanations · 0006 surtax · 0007 scope + contract · 0008 quarantine/block · 0009 precision) and to `CONTEXT.md` glossary terms.

## Out of scope for this rebuild (future)

The separate downstream tool that consumes the Filing Package to assemble the full טופס 1301 (ADR-0007), and future income types (options, bonds, shorts, forex) added at the Out-of-Scope seam.
