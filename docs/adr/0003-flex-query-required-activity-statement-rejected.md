# One data requirement (Flex Query + closed lots), two delivery methods; Activity Statement rejected

The product keeps two import paths — "Connect via API" and "Upload a file" — but both require the *same* underlying data: a Flex Query configured with Trades, Closed Lots, and Cash Transactions. The paths differ only in delivery (live Flex Web Service fetch vs. a saved Flex Query file). The generic IBKR Activity Statement is **not** accepted: it lacks per-lot open dates and would silently produce wrong or missing capital gains. If a user uploads an Activity Statement (detectable by the absent closed-lot section), the tool rejects it and shows how to build a correct Flex Query, rather than half-processing it. No degraded "dividends-only" mode.

Consequence: the "how to set up your Flex Query" onboarding guide is the most important piece of UX — a user cannot succeed without a correctly configured query.
