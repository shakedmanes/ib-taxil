'use client'

import { useTranslations } from 'next-intl'
import type { UserInputs } from '@/lib/tax/user-inputs'

interface Props {
  inputs: UserInputs
  onChange: (inputs: UserInputs) => void
  onNext: () => void
  onBack: () => void
}

// Two optional, in-memory-only inputs the engine cannot derive from IBKR data
// (ADR-0004 / ADR-0006): a prior-year capital loss carried in, and total other
// annual income (undefined = skip surtax). Both are heavily explained.
export function Step4Details({ inputs, onChange, onNext, onBack }: Props) {
  const t = useTranslations('step4Details')

  const setBroughtForward = (value: string) =>
    onChange({ ...inputs, broughtForwardLoss: value.trim() === '' ? '0' : value })

  const setOtherIncome = (value: string) =>
    onChange({ ...inputs, otherIncomeIls: value.trim() === '' ? undefined : value })

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('title')}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('subtitle')}</p>

      <div className="space-y-6">
        <div>
          <label htmlFor="brought-forward-loss" className="block font-semibold text-sm text-slate-900 dark:text-white mb-1">
            {t('broughtForwardLabel')}
          </label>
          <p className="text-xs text-slate-500 mb-2">{t('broughtForwardHelp')}</p>
          <input
            id="brought-forward-loss"
            type="text"
            inputMode="decimal"
            defaultValue={inputs.broughtForwardLoss === '0' ? '' : inputs.broughtForwardLoss}
            onChange={e => setBroughtForward(e.target.value)}
            placeholder="0"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="other-income" className="block font-semibold text-sm text-slate-900 dark:text-white mb-1">
            {t('otherIncomeLabel')}
          </label>
          <p className="text-xs text-slate-500 mb-2">{t('otherIncomeHelp')}</p>
          <input
            id="other-income"
            type="text"
            inputMode="decimal"
            defaultValue={inputs.otherIncomeIls ?? ''}
            onChange={e => setOtherIncome(e.target.value)}
            placeholder={t('otherIncomePlaceholder')}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
