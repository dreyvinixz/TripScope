import type { ReactNode } from 'react'
import type { Resource } from '../types/destination'
import { Loading } from './Loading/Loading'
import { ErrorMessage } from './ErrorMessage/ErrorMessage'
export function ResourcePanel<T>({ title, resource, children, className = '' }: {
  title: string; resource: Resource<T>; children: (data: T) => ReactNode; className?: string
}) {
  return <section className={`panel ${className}`} aria-label={title} aria-busy={resource.status === 'loading'}>
    <h3>{title}</h3>
    {resource.status === 'loading' ? <Loading label={`Carregando ${title}`} /> :
      resource.status === 'error' ? <ErrorMessage message={resource.message} /> : children(resource.data)}
  </section>
}
