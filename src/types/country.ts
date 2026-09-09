export interface CountryCurrency { code: string; name: string; symbol?: string }
export interface Country {
  officialName: string
  commonName: string
  countryCode: string
  flagUrl: string
  capital: string | null
  population: number
  primaryLanguage: string | null
  currency: CountryCurrency | null
  currencies: CountryCurrency[]
  timezones: string[]
}
