'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Step1TaxYear } from './Step1TaxYear'
import { Step2Import } from './Step2Import'
import { Step3Review } from './Step3Review'
import { Step4Summary } from './Step4Summary'
import { Step5Export } from './Step5Export'
import type { IBKRData } from '@/lib/ibkr/types'
import type { TaxResult } from '@/lib/tax/types'

export function WizardShell() {
  const t = useTranslations('wizard')
  const [step, setStep] = useState(1)
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1)
  const [ibkrData, setIbkrData] = useState<IBKRData | null>(null)
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null)

  const steps = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')]

  const next = () => setStep(s => Math.min(s + 1, 5))
  const back = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div>
      {/* Progress bar */}
      <ol className="flex gap-1 mb-8" role="list">
        {steps.map((label, i) => (
          <li key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                i + 1 <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
            <span className="text-xs text-slate-500 hidden sm:block">{label}</span>
          </li>
        ))}
      </ol>

      {/* Step content */}
      <div>
        {step === 1 && (
          <div data-testid="wizard-step-1">
            <Step1TaxYear taxYear={taxYear} onTaxYearChange={setTaxYear} onNext={next} />
          </div>
        )}
        {step === 2 && (
          <div data-testid="wizard-step-2">
            <Step2Import taxYear={taxYear} onData={setIbkrData} onNext={next} />
          </div>
        )}
        {step === 3 && ibkrData && (
          <div data-testid="wizard-step-3">
            <Step3Review data={ibkrData} taxYear={taxYear} onResult={setTaxResult} onNext={next} />
          </div>
        )}
        {step === 4 && taxResult && (
          <div data-testid="wizard-step-4">
            <Step4Summary result={taxResult} taxYear={taxYear} onNext={next} />
          </div>
        )}
        {step === 5 && taxResult && (
          <div data-testid="wizard-step-5">
            <Step5Export result={taxResult} taxYear={taxYear} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 && (
          <button
            onClick={back}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline"
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}
