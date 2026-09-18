import { useState } from 'react'
import type { CurrencyQuote } from '../../types/currency'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { convertBrlToTarget } from '../../utils/currency'
import { parseBrl } from '../../utils/validation'

export function CurrencyConverter({ quote }: { quote: CurrencyQuote }) {
  const [value, setValue] = useState('1000')
  const amount = parseBrl(value)
  return <>
    <label htmlFor="brl-amount">Quanto você quer levar? (BRL)</label>
    <div className="amount-input"><span aria-hidden="true">R$</span><input id="brl-amount" inputMode="decimal"
      value={value} onChange={event => setValue(event.target.value)} aria-invalid={amount === null}
      aria-describedby={amount === null ? 'currency-error' : 'currency-disclaimer'} /></div>
    {amount === null ? <p id="currency-error" className="error-message" role="alert">Informe um valor entre R$ 0 e R$ 1.000.000.</p> :
      <output className="converted" aria-live="polite" htmlFor="brl-amount">≈ {formatCurrency(convertBrlToTarget(amount, quote), quote.targetCurrency)} <small>{quote.targetCurrency}</small></output>}
    <p id="currency-disclaimer" className="source">Referência indicativa; não inclui impostos nem tarifas.</p>
    <p className="source">{quote.targetCurrency === 'BRL' ? 'Mesma moeda · taxa 1:1' : `Frankfurter · cotação de ${formatDate(quote.quotedAt)}`}</p>
  </>
}
