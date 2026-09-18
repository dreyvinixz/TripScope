export function Loading({ label = 'Carregando dados' }: { label?: string }) {
  return <div className="loading" role="status" aria-live="polite" aria-atomic="true"><span className="sr-only">{label}</span><div className="skeleton" /><div className="skeleton short" /></div>
}
