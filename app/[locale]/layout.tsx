import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const isHebrew = locale === 'he'

  return (
    <div dir={isHebrew ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-slate-950">
      <NextIntlClientProvider messages={messages}>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </NextIntlClientProvider>
    </div>
  )
}
