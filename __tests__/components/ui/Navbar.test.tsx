import { render, screen } from '@testing-library/react'
import { Navbar } from '@/components/ui/Navbar'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en',
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe('Navbar', () => {
  it('renders IB-Taxil logo', () => {
    render(<Navbar />, { wrapper: Wrapper })
    expect(screen.getByText('IB-Taxil')).toBeInTheDocument()
  })

  it('has theme toggle button with aria-label', () => {
    render(<Navbar />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument()
  })

  it('has language toggle button with aria-label', () => {
    render(<Navbar />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: 'Switch language' })).toBeInTheDocument()
  })
})
