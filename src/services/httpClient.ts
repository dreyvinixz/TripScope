import { z } from 'zod'

export type ErrorCode = 'network' | 'timeout' | 'unexpected-response' | 'unavailable' | 'not-found' | 'unsupported-currency' | 'cancelled'
export class ServiceError extends Error {
  constructor(readonly code: ErrorCode, message = code) { super(message); this.name = 'ServiceError' }
}
export async function requestJson(url: string | URL, options: RequestInit = {}, timeoutMs = 10_000): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  try {
    const response = await fetch(url, { ...options, signal })
    if (!response.ok) {
      if (response.status === 404) throw new ServiceError('not-found')
      if (response.status === 408 || response.status === 504) throw new ServiceError('timeout')
      if (response.status >= 500 || response.status === 429) throw new ServiceError('unavailable')
      throw new ServiceError('unexpected-response')
    }
    try { return await response.json() as unknown }
    catch (error) {
      if (signal.aborted) throw error
      throw new ServiceError('unexpected-response')
    }
  } catch (error) {
    if (options.signal?.aborted) throw new ServiceError('cancelled')
    if (timeout.aborted) throw new ServiceError('timeout')
    if (error instanceof ServiceError) throw error
    throw new ServiceError('network')
  }
}
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) throw new ServiceError('unexpected-response')
  return result.data
}
export function errorMessage(error: unknown, subject = 'os dados'): string {
  if (error instanceof ServiceError) {
    if (error.code === 'not-found') return 'Não encontramos esse destino.'
    if (error.code === 'unsupported-currency') return 'Moeda não suportada ou não informada para este destino.'
    if (error.code === 'timeout') return `O serviço demorou para responder. Tente obter ${subject} novamente.`
    if (error.code === 'network') return `Não foi possível obter ${subject}. Verifique sua conexão.`
    if (error.code === 'unavailable') return `O serviço de ${subject} está temporariamente indisponível. Tente novamente.`
    if (error.code === 'unexpected-response') return `O serviço retornou dados inesperados para ${subject}. Tente novamente.`
  }
  return `Não foi possível obter ${subject} neste momento.`
}
