'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Step1TaxYear } from './Step1TaxYear'
import { Step2Import } from './Step2Import'
import { Step3Review } from './Step3Review'
import { Step4Details } from './Step4Details'
import { Step5Summary } from './Step5Summary'
import { Step6Export } from './Step6Export'
import { neededCurrencies, dateSpan } from '@/lib/boi/plan'
import { fetchRatesMap } from '@/lib/boi/rates'
import { calculateTax } from '@/lib/tax/calculator'
import type { IBKRData } from '@/lib/ibkr/types'
import type { UserInputs } from '@/lib/tax/user-inputs'
import type { EngineOutput } from '@/lib/tax/types'

const STEP_COUNT = 6

// Owns all wizard state and orchestrates parseFlexXml → fetchRatesMap →
// calculateTax. Everything is in-memory only (privacy-first, ADR-0004/0006).
export function WizardShell() {
  const t = useTranslations('wizard')

  const [step, setStep] = useState(1)
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1)
  const [data, setData] = useState<IBKRData | null>(null)
  const [inputs, setInputs] = useState<UserInputs>({ substantialHoldings: [], broughtForwardLoss: '0' })
  const [output, setOutput] = useState<EngineOutput | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

  const next = () => setStep(s => Math.min(s + 1, STEP_COUNT))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const toggleSubstantial = (ticker: string) =>
    setInputs(prev => ({
      ...prev,
      substantialHoldings: prev.substantialHoldings.includes(ticker)
        ? prev.substantialHoldings.filter(x => x !== ticker)
        : [...prev.substantialHoldings, ticker],
    }))

  // Calculation gate: runs when leaving the details step.
  const runCalculation = async () => {
    if (!data) return
    setCalculating(true)
    setCalcError(null)
    try {
      const currencies = neededCurrencies(data)
      const { start, end } = dateSpan(data, taxYear)
      const rates = currencies.length > 0 ? await fetchRatesMap(currencies, start, end) : {}
      setOutput(calculateTax(data, rates, taxYear, inputs))
      setStep(5)
    } catch (err: unknown) {
      setCalcError(err instanceof Error ? err.message : t('calcErrorFallback'))
    } finally {
      setCalculating(false)
    }
  }

  const steps = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5'), t('step6')]

  return (
    <div>
      <ol className="flex gap-1 mb-8" role="list">
        {steps.map((label, i) => (
          <li key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full ${i + 1 <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <span className="text-xs text-slate-500 hidden sm:block">{label}</span>
          </li>
        ))}
      </ol>

      {calcError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {calcError}
        </div>
      )}

      {step === 1 && (
        <Step1TaxYear taxYear={taxYear} onTaxYearChange={setTaxYear} onNext={next} />
      )}
      {step === 2 && (
        <Step2Import taxYear={taxYear} onData={setData} onNext={next} />
      )}
      {step === 3 && data && (
        <Step3Review
          data={data}
          taxYear={taxYear}
          substantialHoldings={inputs.substantialHoldings}
          onToggleSubstantial={toggleSubstantial}
          onNext={next}
          onBack={back}
        />
      )}
      {step === 4 && (
        <Step4Details
          inputs={inputs}
          onChange={setInputs}
          onNext={runCalculation}
          onBack={back}
        />
      )}
      {step === 5 && output && (
        <Step5Summary output={output} onNext={next} onBack={() => setStep(4)} />
      )}
      {step === 6 && output?.status === 'ok' && (
        <Step6Export result={output} onBack={() => setStep(5)} />
      )}

      {calculating && (
        <p className="mt-4 text-center text-sm text-slate-500">{t('calculating')}</p>
      )}
    </div>
  )
}
