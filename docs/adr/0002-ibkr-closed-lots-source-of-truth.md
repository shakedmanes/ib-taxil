# IBKR Closed Lots are the source of truth for open dates and lot matching

Correct capital gains (ADR-0001) need each closed lot's open date and cost basis. We take these from IBKR's **Closed Lots** section rather than recomputing lot matching ourselves, because self-recomputation would require the investor's entire multi-year buy history, which a single tax-year export does not contain. The Flex Query must be configured to include Closed Lots; if that section is absent, the tool refuses to compute capital gains and tells the user how to add it, rather than guessing.

Lot-matching method: we accept IBKR's configured method (default FIFO), display it, and warn if it is not FIFO — leaving the method choice with IBKR rather than overriding it. (Verify: confirm FIFO is the ITA-expected method for identical securities.)

Consequence: the generic Activity Statement CSV, which lacks per-lot open dates, cannot produce capital gains — see ADR-0003.
