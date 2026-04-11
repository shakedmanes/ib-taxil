'use client'

import { useEffect } from 'react'

interface Props { onClose: () => void }

export function PrivacyModal({ onClose }: Props) {
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
          aria-label="Close"
        >×</button>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">How your data is protected</h2>
        <p className="text-slate-500 text-sm mb-6">Plain-language explanation — no technical jargon.</p>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">What is a Flex Query token?</h3>
            <p>A Flex Query token is a read-only key that IBKR generates for you. It can <strong>only</strong> download reports from your account. It <strong>cannot</strong> place trades, withdraw money, or change any settings. Think of it as a key that only opens the filing cabinet — it cannot touch the cash register.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">What data is fetched?</h3>
            <p>We only request your trade history, dividend payments, and withholding taxes for the selected tax year. Nothing else is requested or downloaded.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Where does my data go?</h3>
            <p>Your data goes from IBKR directly into your browser's memory. It never touches our servers in a form we can read, log, or store. The moment you close this tab, all data is gone.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">What is the "proxy" you use?</h3>
            <p>Your browser cannot call IBKR directly due to a web security restriction called CORS. We use a tiny relay (called a proxy) that forwards your request to IBKR and sends the response back to your browser. The relay does not log, store, or read the content — it is a dumb pipe. The code is open source and publicly auditable.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">What we never do</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Store your token or financial data on any server</li>
              <li>Log request contents</li>
              <li>Share or sell data to any third party</li>
              <li>Use your data for anything other than generating your tax summary</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">How do I revoke the token?</h3>
            <p>Log in to IBKR → Account Management → Reports → Flex Queries → Delete the query token at any time. We recommend doing this after you've generated your tax report.</p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
