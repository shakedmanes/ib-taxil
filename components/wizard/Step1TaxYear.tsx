export function Step1TaxYear({
  onNext,
}: {
  taxYear: number
  onTaxYearChange: (y: number) => void
  onNext: () => void
}) {
  return (
    <div>
      <button onClick={onNext}>Next</button>
    </div>
  )
}
