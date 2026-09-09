import type { Country } from '../../types/country'
import { formatNumber } from '../../utils/formatters'
export function CountryCard({ country, timezone }: { country: Country; timezone: string }) {
  return <>
    <p className="official-name">{country.officialName}</p>
    <dl className="country-details">
      <div><dt>Capital</dt><dd>{country.capital ?? 'Não informada'}</dd></div>
      <div><dt>População</dt><dd>{formatNumber(country.population)}</dd></div>
      <div><dt>Idiomas</dt><dd>{country.primaryLanguage ?? 'Não informados'}</dd></div>
      <div><dt>Moeda</dt><dd>{country.currencies.map(currency => `${currency.name} (${currency.code})`).join(', ') || 'Não informada'}</dd></div>
      <div><dt>Fuso do destino</dt><dd>{timezone}</dd></div>
      <div><dt>Código ISO</dt><dd>{country.countryCode}</dd></div>
    </dl>
    {country.currencies.length > 1 && <p className="source">Conversão com {country.currency?.code}: primeira moeda em ordem de código ISO.</p>}
    <p className="source">REST Countries · fusos do país: {country.timezones.join(', ') || 'não informados'}</p>
  </>
}
