'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IBKRApiCard } from '@/components/import/IBKRApiCard'
import { FileUploadCard } from '@/components/import/FileUploadCard'
import { PrivacyModal } from '@/components/import/PrivacyModal'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props {
  taxYear: number
  onData: (data: IBKRData) => void
  onNext: () => void
}

export function Step2Import({ taxYear, onData, onNext }: Props) {
  const t = useTranslations('step2')
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleData = (data: IBKRData) => {
    onData(data)
    onNext()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
        {t('title')}
      </h2>
      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
        {t('taxYear', { year: taxYear })}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">{t('dismiss')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IBKRApiCard taxYear={taxYear} onData={handleData} onError={setError} />
        <FileUploadCard onData={handleData} onError={setError} />
      </div>

      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-xs text-green-700 dark:text-green-300 text-center">
        {t('privacyBanner')}{' '}
        <button onClick={() => setShowModal(true)} className="underline font-semibold">
          {t('learnMore')}
        </button>
      </div>

      {showModal && <PrivacyModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
