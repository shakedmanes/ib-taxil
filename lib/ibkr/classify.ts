const SECURITY_ASSETS = new Set(['STK', 'FUND', 'ETF'])

export function classifyAsset(assetCategory: string): 'security' | 'out-of-scope' {
  return SECURITY_ASSETS.has((assetCategory || '').toUpperCase()) ? 'security' : 'out-of-scope'
}

export function classifyCashType(type: string): 'dividend' | 'withholding' | 'interest' | 'out-of-scope' | 'ignore' {
  const t = (type || '').trim()
  if (t === 'Dividends' || t === 'Payment In Lieu Of Dividends') return 'dividend'
  if (t === 'Withholding Tax') return 'withholding'
  if (t === 'Broker Interest Received') return 'interest'
  if (t === 'Bond Interest') return 'out-of-scope'
  return 'ignore'
}
