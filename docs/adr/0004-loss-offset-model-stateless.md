# Full same-year loss offsetting, with manual prior-year losses and stateless carry-forward

Capital losses are offset in legal order (§92): a **current-year** loss offsets current-year capital gains first, then same-year dividends and interest from other securities taxed at ≤25% — not merely floored at zero against gains as the original code did (which over-reported dividend tax in losing-trade years). Prior-year losses are supported via an explicit, well-explained manual input, because the tool is stateless and cannot know them. Any unused loss is computed and displayed as a carry-forward figure the user records themselves.

Verified refinement (research 2026-08-01, §92 carry-forward rule): a **Brought-Forward Loss (prior years) and the Carry-Forward Loss (to future years) may offset ONLY capital gains — never dividends or interest.** Only a *current-year* loss reaches current-year dividends/interest. The model must keep these two loss kinds distinct; a carried loss that lands on dividend income is a correctness error.

Trade-off: staying stateless (no cross-year storage, matching the privacy stance) means the user hand-carries the loss number between years. Accepted deliberately; the mitigation is heavy UX explanation of what to enter and what to save. A future dev must not revert this to gains-only flooring — that is a legal under/over-statement, not a simplification.
