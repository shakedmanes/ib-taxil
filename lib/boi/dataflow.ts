const BASE = 'BOI.STATISTICS/EXR'
const FLOWS: Record<string, string> = {
  USD: 'RER_USD_ILS', EUR: 'RER_EUR_ILS', GBP: 'RER_GBP_ILS',
  JPY: 'RER_JPY_ILS', CHF: 'RER_CHF_ILS', CAD: 'RER_CAD_ILS', AUD: 'RER_AUD_ILS',
}
export const SUPPORTED_CURRENCIES = Object.keys(FLOWS)
export function dataflowFor(currency: string): string {
  const flow = FLOWS[currency?.toUpperCase()]
  if (!flow) throw new Error(`Unsupported currency for BOI rates: ${currency}`)
  return `${BASE}/${flow}/1.0`
}
