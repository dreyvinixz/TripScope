import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestJson, ServiceError } from '../../src/services/httpClient'

afterEach(() => vi.unstubAllGlobals())

describe('requestJson', () => {
  it('mapeia HTTP não-2xx para erros de domínio', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestJson('https://example.test/unavailable')).rejects.toMatchObject({ code: 'unavailable' })

    fetchMock.mockResolvedValue(new Response('', { status: 404 }))
    await expect(requestJson('https://example.test/missing')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('mapeia JSON inválido para resposta inesperada', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestJson('https://example.test/malformed')).rejects.toMatchObject({ code: 'unexpected-response' })
  })

  it('mapeia falha de rede para erro conhecido', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestJson('https://example.test/offline')).rejects.toMatchObject({ code: 'network' })
  })

  it('mapeia timeout para erro conhecido', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestJson('https://example.test/slow', {}, 1)).rejects.toEqual(new ServiceError('timeout'))
  })
})
