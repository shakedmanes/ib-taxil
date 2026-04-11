import type { IBKRData } from '@/lib/ibkr/types'

export function Step2Import({
  onNext,
}: {
  taxYear: number
  onData: (d: IBKRData) => void
  onNext: () => void
}) {
  return (
    <div>
      <button onClick={onNext}>Next</button>
    </div>
  )
}
