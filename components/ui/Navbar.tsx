'use client'

import { useTheme } from '@/components/ui/ThemeProvider'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')

  const switchLocale = () => {
    const next = locale === 'en' ? 'he' : 'en'
    const withoutLocale = pathname.replace(`/${locale}`, '')
    router.push(`/${next}${withoutLocale}`)
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-slate-900 dark:bg-slate-950">
      <span className="text-white font-bold text-lg">IB-Taxil</span>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-slate-400 hover:text-white text-sm transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          onClick={switchLocale}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          {t('language')}
        </button>
      </div>
    </nav>
  )
}
