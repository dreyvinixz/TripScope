import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CurrencyConverter } from '../../src/components/CurrencyConverter/CurrencyConverter'
import type { CurrencyQuote } from '../../src/types/currency'
import { convertBrlToTarget } from '../../src/utils/currency'

const quote: CurrencyQuote = { baseCurrency: 'BRL', targetCurrency: 'JPY', rate: 29.42, quotedAt: '2026-09-18' }

describe('CurrencyConverter', () => {
  it('calcula o valor convertido sem nova cotação por tecla', async () => {
    const user = userEvent.setup()
    render(<CurrencyConverter quote={quote} />)
    const input = screen.getByLabelText('Quanto você quer levar? (BRL)')

    await user.clear(input)
    await user.type(input, '1.000,50')

    expect(convertBrlToTarget(1000.5, quote)).toBeCloseTo(29434.71, 2)
    expect(screen.getByText('JPY')).toBeInTheDocument()
  })

  it('aceita zero e exibe erro para vazio ou negativo', async () => {
    const user = userEvent.setup()
    render(<CurrencyConverter quote={quote} />)
    const input = screen.getByLabelText('Quanto você quer levar? (BRL)')

    await user.clear(input)
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um valor entre R$ 0 e R$ 1.000.000.')

    await user.type(input, '-1')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('JPY')).toBeInTheDocument()
  })
})
