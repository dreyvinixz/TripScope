export function normalizeCityInput(value: string): string { return value.trim().replace(/\s+/g, ' ') }
export function isValidTripDuration(days: number): boolean { return Number.isInteger(days) && days >= 1 && days <= 14 }
// Entrada brasileira: 1.000,50 ou 1000,50; aceita também 1000.50.
export function parseBrl(value: string): number | null {
  const text = value.trim()
  if (!/^(?:\d+(?:[.,]\d{1,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)$/.test(text)) return null
  const normalized = text.includes(',') || /^\d{1,3}(?:\.\d{3})+$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.') : text
  const amount = Number(normalized)
  return amount >= 0 && amount <= 1_000_000 ? amount : null
}
