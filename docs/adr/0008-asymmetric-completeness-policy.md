# Out-of-scope items are quarantined; missing in-scope data blocks the result

The tool treats two failure kinds oppositely, because they are opposite problems:

- **Out-of-scope items** (options, bonds, unrecognized cash types) are a permanent v1 boundary. The in-scope result is computed and presented normally, and these items are **quarantined** — listed explicitly as "NOT included, report separately." Blocking the whole result because the user also holds options would be hostile.
- **Missing data for an in-scope item** (a stock sale with no closed-lot open date, or an unavailable BOI rate) is a *fixable* defect that would otherwise make the in-scope total silently incomplete. This **blocks** the final result with a very clear, specific fix-it guide (e.g. "3 sales lack closed-lot detail — re-run your Flex Query including the Closed Lots section, step by step"). A partial capital-gains total is never presented as final.

Tax-year mismatch is handled by a third path: include items by realization/receipt date in the selected year, and **warn-and-filter** if the file spans other years or misses the selected one.

Trade-off / warning to future devs: do not "improve UX" by computing partial totals when in-scope data is missing — that reintroduces the silent-wrong-number failure this whole design exists to prevent. The friendliness lever is the *clarity of the fix-it guidance*, not relaxing the block.
