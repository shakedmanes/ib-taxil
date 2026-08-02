import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Step2Import } from '@/components/wizard/Step2Import'
import { IBKRApiCard } from '@/components/import/IBKRApiCard'

vi.mock('next-intl')

describe('Step2Import', () => {
  const setup = () => {
    const onData = vi.fn()
    const onNext = vi.fn()
    render(<Step2Import taxYear={2024} onData={onData} onNext={onNext} />)
    return { onData, onNext }
  }

  it('renders the import heading', () => {
    setup()
    expect(screen.getByText('Import your IBKR data')).toBeInTheDocument()
  })

  it('opens and closes the PrivacyModal', () => {
    setup()
    fireEvent.click(screen.getByText('Learn more →'))
    expect(screen.getByText('How your data is protected')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Got it'))
    expect(screen.queryByText('How your data is protected')).not.toBeInTheDocument()
  })
})

describe('IBKRApiCard', () => {
  it('renders the connect heading', () => {
    render(<IBKRApiCard taxYear={2024} onData={vi.fn()} onError={vi.fn()} />)
    expect(screen.getByText('Connect via IBKR API')).toBeInTheDocument()
  })

  it('validates that both token and query id are provided', () => {
    const onError = vi.fn()
    render(<IBKRApiCard taxYear={2024} onData={vi.fn()} onError={onError} />)
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(onError).toHaveBeenCalledWith('Please enter both your Flex Query token and Query ID.')
  })

  it('still validates when only the token is provided', async () => {
    const onError = vi.fn()
    render(<IBKRApiCard taxYear={2024} onData={vi.fn()} onError={onError} />)
    await userEvent.type(screen.getByPlaceholderText('Paste your token here'), 'mytoken')
    fireEvent.click(screen.getByText('Fetch My Data →'))
    expect(onError).toHaveBeenCalledWith('Please enter both your Flex Query token and Query ID.')
  })
})
