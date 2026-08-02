# Full precision internally, round to whole shekels only at output; last-published BOI rate

All monetary computation runs at full `decimal.js` precision from parse through calculation; rounding happens **only at output boundaries**, where final form-field values are rounded to **whole shekels** (exact ITA rounding rule is a verify item). The original code rounded mid-pipeline (via `toIls` on intermediates), which lets rounding error accumulate across many trades — this design forbids that.

For currency conversion, a date with no published Bank of Israel representative rate (weekend/holiday) uses the **last previously-published rate**, with no arbitrary look-back cap — a prior rate always exists, and a fixed cutoff could spuriously fail a valid computation.

Trade-off: intermediate values are less "clean" to eyeball (long decimals), but totals are exact to the last agora before the single final rounding. A future dev must not reintroduce mid-pipeline rounding for tidiness.
