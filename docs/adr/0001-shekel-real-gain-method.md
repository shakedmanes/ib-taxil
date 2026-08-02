# Capital gains use the shekel real-gain method, not IBKR's USD P&L

Israeli law taxes the *real gain in shekels* on a foreign security: cost is converted at the purchase-date BOI rate and proceeds at the sale-date rate, so exchange-rate movement between buy and sell is part of the taxable gain. We therefore compute `gainIls = proceedsUsd × rate(saleDate) − costUsd × rate(openDate)` per closed lot, rather than taking IBKR's ready-made `fifoPnlRealized` (a single-currency USD figure) and converting it at one date — the latter under-reports gains by tens of percent when USD/ILS has moved.

Consequences: every realized sale must carry its lot's **open date**, so we depend on IBKR closed-lot detail (see ADR-0002), and the BOI rate set must span **from the earliest open date**, not just the tax year.

Open question flagged for primary-source verification: whether the pure currency component on a foreign security is fully taxable or partly relieved (the inflationary/linkage question). Mainstream advisor practice and ITA broker reporting (טופס 867) use the plain shekel-gain method adopted here.
