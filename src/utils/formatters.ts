export function formatNumber(value: number): string { return new Intl.NumberFormat('pt-BR').format(value) }
export function formatCurrency(value: number, currency: string): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value) }
export function temperature(celsius: number, unit: 'C' | 'F'): string { return `${Math.round(unit === 'F' ? celsius * 9 / 5 + 32 : celsius)}°${unit}` }
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}
