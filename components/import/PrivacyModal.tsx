'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props { onClose: () => void }

export function PrivacyModal({ onClose }: Props) {
  const t = useTranslations('privacyModal')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-2xl"
          aria-label={t('close')}
        >×</button>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('title')}</h2>
        <p className="text-slate-500 text-sm mb-6">{t('subtitle')}</p>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section1Title')}</h3>
            <p>{t('section1Body')}</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section2Title')}</h3>
            <p>{t('section2Body')}</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section3Title')}</h3>
            <p>{t('section3Body')}</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section4Title')}</h3>
            <p>{t('section4Body')}</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section5Title')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('section5Item1')}</li>
              <li>{t('section5Item2')}</li>
              <li>{t('section5Item3')}</li>
              <li>{t('section5Item4')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t('section6Title')}</h3>
            <p>{t('section6Body')}</p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {t('gotIt')}
        </button>
      </div>
    </div>
  )
}
