import type { TaxResult } from '@/lib/tax/types'

export function Step4Summary({
  onNext,
}: {
  result: TaxResult
  taxYear: number
  onNext: () => void
}) {
  return (
    <div>
      <button onClick={onNext}>Next</button>
    </div>
  )
}
