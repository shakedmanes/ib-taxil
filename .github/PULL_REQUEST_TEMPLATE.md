<!-- Thanks for contributing! Please read CONTRIBUTING.md first. -->

## What & why

<!-- What does this change and why? Link any related issue (#123). -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Tax data / year update (rates, thresholds, ITA field codes)
- [ ] Refactor / docs / chore

## Tax-number sources (required if you touched any rate, threshold, or field code)

<!-- Cite the official gov.il PDF / ordinance section for every changed value. -->

## Checklist

- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] New user-facing strings added to **both** `messages/en.json` and `messages/he.json`
- [ ] Money handled as decimal strings (no JS floats); rounding only at output
- [ ] Added/updated tests for the change
- [ ] I have read the [DISCLAIMER](../DISCLAIMER.md) and my change does not present output as filed/authoritative tax advice
