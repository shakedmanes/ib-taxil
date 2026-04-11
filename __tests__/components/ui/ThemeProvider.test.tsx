import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/ui/ThemeProvider'

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light theme', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('toggles to dark and back', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    fireEvent.click(screen.getByText('toggle'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('persists theme to localStorage on toggle', () => {
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    fireEvent.click(screen.getByText('toggle'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('reads stored theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('throws when useTheme is used outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider')
    consoleError.mockRestore()
  })
})
