function normaliseArray(v: unknown): Record<string, unknown>[] {
  if (!v) return []
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [v as Record<string, unknown>]
}

/** True iff the parsed Flex doc carries per-lot closed-lot detail. */
export function hasClosedLotDetail(parsed: unknown): boolean {
  const doc = parsed as Record<string, any>
  const stmt = doc?.FlexQueryResponse?.FlexStatements?.FlexStatement
  if (!stmt) return false
  const trades = normaliseArray(stmt.Trades?.Trade)
  return trades.some(t => String(t.levelOfDetail) === 'CLOSED_LOT') || Boolean(stmt.ClosedLots)
}

/** True iff the parsed Flex doc contains any trade rows at all. */
export function hasAnyTrade(parsed: unknown): boolean {
  const doc = parsed as Record<string, any>
  const stmt = doc?.FlexQueryResponse?.FlexStatements?.FlexStatement
  if (!stmt) return false
  return normaliseArray(stmt.Trades?.Trade).length > 0
}

/** Heuristic: an IBKR Activity Statement CSV rather than a Flex Query. */
export function looksLikeActivityStatement(input: string): boolean {
  return /^Statement,Header,/m.test(input) && !input.includes('FlexQueryResponse')
}
