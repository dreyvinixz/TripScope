import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon } from '@hugeicons/core-free-icons'
import type { Resource } from '../types/destination'
import { Loading } from './Loading/Loading'
import { ErrorMessage } from './ErrorMessage/ErrorMessage'
export function ResourcePanel<T>({ title, resource, children, className = '', onRetry }: {
  title: string; resource: Resource<T>; children: (data: T) => ReactNode; className?: string; onRetry?: () => void
}) {
  return <section className={`panel ${className}`} aria-label={title} aria-busy={resource.status === 'loading'}>
    <h3>{title}</h3>
    {resource.status === 'loading' ? <Loading label={`Carregando ${title}`} /> :
      resource.status === 'error' ? <><ErrorMessage message={resource.message} />{onRetry && <button className="resource-retry" onClick={onRetry}><HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.7} aria-hidden="true" /> Tentar novamente</button>}</> : children(resource.data)}
  </section>
}
