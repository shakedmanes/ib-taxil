# Every computed figure carries its own explanation and provenance in the domain output

The users are not tax experts and have no practice filing. Therefore explainability is a product requirement, not a UI nicety: every number the tool produces (a real gain, a credit, a net tax line, a carry-forward) is paired in the **domain output** with a plain-language explanation and its provenance — the inputs, the BOI rate and date used, and what the user should do with it. The types that carry results carry this explanation alongside the value; the UI renders it, but does not invent it.

Trade-off: result types are heavier and calculation code must assemble explanations as it computes, rather than returning bare numbers. Accepted because "correct but inscrutable" fails the product's core purpose — a user who can't understand a figure can't trust or file it. A future dev must not strip explanations down to raw numbers "for cleanliness"; the explanation is part of the contract.

Consequence: multi-currency conversion, over-withholding flags, loss offsetting, and substantial-holder rate choices each must surface a per-line human explanation, not just a value.
