import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CountryCard } from '../../src/components/CountryCard/CountryCard'
import type { Country } from '../../src/types/country'

const country: Country = {
  officialName: 'Japan', commonName: 'Japan', countryCode: 'JP', flagUrl: '', capital: 'Tokyo',
  population: 125124989, primaryLanguage: 'Japanese', currency: { code: 'CAD', name: 'Canadian dollar' },
  currencies: [
    { code: 'JPY', name: 'Japanese yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian dollar', symbol: '$' },
  ], timezones: ['UTC+09:00'],
}

describe('CountryCard', () => {
  it('exibe os dados factuais e sinaliza a regra para múltiplas moedas', () => {
    render(<CountryCard country={country} timezone="Asia/Tokyo" />)

    expect(screen.getByText('Tokyo')).toBeInTheDocument()
    expect(screen.getByText('Japanese')).toBeInTheDocument()
    expect(screen.getByText('Japanese yen (JPY), Canadian dollar (CAD)')).toBeInTheDocument()
    expect(screen.getByText(/Conversão com CAD/)).toBeInTheDocument()
    expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument()
  })

  it('exibe fallback para capital, idioma e moeda ausentes', () => {
    const sparse: Country = { ...country, capital: null, primaryLanguage: null, currency: null, currencies: [] }
    render(<CountryCard country={sparse} timezone="UTC" />)

    expect(screen.getAllByText('Não informada')).toHaveLength(2)
    expect(screen.getByText('Não informados')).toBeInTheDocument()
    expect(screen.getByText('UTC')).toBeInTheDocument()
  })
})
