import type { IBKRData } from '@/lib/ibkr/types'
import type { TaxResult } from '@/lib/tax/types'

export function Step3Review({
  onNext,
}: {
  data: IBKRData
  taxYear: number
  onResult: (r: TaxResult) => void
  onNext: () => void
}) {
  return (
    <div>
      <button onClick={onNext}>Next</button>
    </div>
  )
}
