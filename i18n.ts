import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['en', 'he'] as const
type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'en'
  if (!locales.includes(locale as Locale)) notFound()
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
