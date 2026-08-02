'use client'

import { useTranslations } from 'next-intl'
import type { Explanation } from '@/lib/tax/explain'

// Renders a domain Explanation (ADR-0005). The engine emits a language-agnostic
// { code, params }; this is the single place that turns it into localized prose.
export function Explain({ explanation }: { explanation: Explanation }) {
  const t = useTranslations()
  return (
    <p className="text-sm text-slate-600 dark:text-slate-300">
      {t(explanation.code, explanation.params)}
    </p>
  )
}
