# Security Policy

## Reporting a vulnerability

If you discover a security or privacy vulnerability in IB-Taxil, please report it
**privately** — do not open a public issue or pull request that discloses it.

- Use GitHub's **[Private vulnerability reporting](https://github.com/shakedmanes/ib-taxil/security/advisories/new)**
  (Security → Report a vulnerability), or
- Email **maneshaked@gmail.com** with the details.

Please include:

- a description of the issue and its impact,
- steps to reproduce (or a proof of concept),
- affected version / commit, and
- any suggested remediation.

We will acknowledge your report as soon as reasonably possible and work with you
on a fix and coordinated disclosure. Please give us a reasonable window to
address the issue before any public disclosure.

## Scope notes

IB-Taxil is a client-side tool that processes financial data in the browser.
Reports we are especially interested in:

- any path where user financial data leaves the browser unexpectedly,
- injection or parsing vulnerabilities in the IBKR XML/CSV importers,
- issues in the optional IBKR proxy worker (`workers/ibkr-proxy/`),
- dependency vulnerabilities with a practical exploit path.

Please note that **incorrect tax calculations are not security issues** — report
those as normal bugs (they are still important to us). See also the
[DISCLAIMER](./DISCLAIMER.md).
