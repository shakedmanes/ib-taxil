function normaliseArray(v: unknown): Record<string, unknown>[] {
  if (!v) return []
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [v as Record<string, unknown>]
}

/** True iff the parsed Flex doc carries per-lot closed-lot detail. */
export function hasClosedLotDetail(parsed: unknown): boolean {
  const statements = flexStatements(parsed)
  return statements.some(stmt => {
    const lots = normaliseArray(stmt.Trades?.Lot)
      .filter(l => String(l.levelOfDetail ?? 'CLOSED_LOT') === 'CLOSED_LOT')
    const trades = normaliseArray(stmt.Trades?.Trade)
    return lots.length > 0 || trades.some(t => String(t.levelOfDetail) === 'CLOSED_LOT') || Boolean(stmt.ClosedLots)
  })
}

/** True iff the parsed Flex doc contains any trade rows at all. */
export function hasAnyTrade(parsed: unknown): boolean {
  const statements = flexStatements(parsed)
  return statements.some(stmt =>
    normaliseArray(stmt.Trades?.Trade).length > 0 || normaliseArray(stmt.Trades?.Lot).length > 0)
}

// fast-xml-parser yields dynamically-shaped nodes; `any` is the untyped-XML boundary.
/* eslint-disable @typescript-eslint/no-explicit-any */
function flexStatements(parsed: unknown): Record<string, any>[] {
  const doc = parsed as Record<string, any>
  return normaliseArray(doc?.FlexQueryResponse?.FlexStatements?.FlexStatement)
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Heuristic: an IBKR Activity Statement CSV rather than a Flex Query. */
export function looksLikeActivityStatement(input: string): boolean {
  return /^Statement,Header,/m.test(input) && !input.includes('FlexQueryResponse')
}
