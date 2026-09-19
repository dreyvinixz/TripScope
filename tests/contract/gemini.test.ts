import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/gemini'

function buildContext() {
  return {
    location: {
      id: 1, city: 'Lisboa', region: 'Lisboa', country: 'Portugal', countryCode: 'PT',
      latitude: 38.72, longitude: -9.14, timezone: 'Europe/Lisbon',
    },
    forecast: [
      { date: '2026-09-19', minimumTemperatureCelsius: 15, maximumTemperatureCelsius: 24, precipitationProbabilityPercent: 5, weatherCode: 1 },
      { date: '2026-09-20', minimumTemperatureCelsius: 16, maximumTemperatureCelsius: 23, precipitationProbabilityPercent: 90, weatherCode: 63 },
    ],
    currencyQuote: { baseCurrency: 'BRL' as const, targetCurrency: 'EUR', rate: 0.17, quotedAt: '2026-09-19' },
    country: { officialName: 'República Portuguesa', capital: 'Lisboa', languages: 'Português', currencies: ['EUR'] },
  }
}

function planRequestBody() {
  return {
    action: 'plan',
    context: buildContext(),
    days: 2,
    budgetBrl: 5000,
    interests: ['Cultura', 'Gastronomia'],
  }
}

function questionRequestBody() {
  return {
    action: 'question',
    context: buildContext(),
    question: 'O que devo levar na mala?',
    preferences: null,
  }
}

function jsonRequest(body: unknown, init: { method?: string; contentType?: string | null; signal?: AbortSignal } = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  const headers = new Headers()
  if (init.contentType !== null) headers.set('content-type', init.contentType ?? 'application/json')
  headers.set('content-length', String(new TextEncoder().encode(text).length))
  return new Request('https://example.com/api/gemini', { method: init.method ?? 'POST', headers, body: text, signal: init.signal })
}

function validPlanGeminiPayload() {
  return {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                summary: 'Um roteiro cultural e gastronômico em Lisboa.',
                days: [
                  { day: 1, morning: 'Visite o Castelo de São Jorge.', afternoon: 'Explore a Alfama.', evening: 'Jante em um restaurante tradicional.' },
                  { day: 2, morning: 'Museu Nacional do Azulejo.', afternoon: 'Passeio pelo Chiado.', evening: 'Fado ao vivo (atividade interna, previsão de chuva).' },
                ],
                notes: ['Leve guarda-chuva no segundo dia.'],
              }),
            },
          ],
        },
      },
    ],
  }
}

function validAnswerGeminiPayload() {
  return { candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: 'Leve roupas leves e um casaco para a noite.' }) }] } }] }
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key'
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete process.env.GEMINI_API_KEY
})

describe('POST /api/gemini — validation', () => {
  it('rejects non-POST methods', async () => {
    const response = await handler(jsonRequest(planRequestBody(), { method: 'GET' }))
    expect(response.status).toBe(405)
    expect((await response.json()).error.code).toBe('method-not-allowed')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing/incorrect content-type', async () => {
    const response = await handler(jsonRequest(planRequestBody(), { contentType: 'text/plain' }))
    expect(response.status).toBe(415)
    expect((await response.json()).error.code).toBe('unsupported-media-type')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an oversized body', async () => {
    const oversized = { ...planRequestBody(), notes: 'x'.repeat(25_000) }
    const response = await handler(jsonRequest(oversized))
    expect(response.status).toBe(413)
    expect((await response.json()).error.code).toBe('payload-too-large')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a body that is not valid JSON', async () => {
    const response = await handler(jsonRequest('{not-json'))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('invalid-request')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a JSON body that fails the discriminated union schema', async () => {
    const response = await handler(jsonRequest({ action: 'plan', context: buildContext(), days: 99, budgetBrl: 5000, interests: ['Cultura'] }))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('invalid-request')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown action', async () => {
    const response = await handler(jsonRequest({ action: 'translate', context: buildContext() }))
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails safely when GEMINI_API_KEY is not configured', async () => {
    delete process.env.GEMINI_API_KEY
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(500)
    expect((await response.json()).error.code).toBe('server-misconfigured')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/gemini — success', () => {
  it('returns a validated plan for action=plan', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(validPlanGeminiPayload()), { status: 200 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.days).toHaveLength(2)
    expect(body.summary).toEqual(expect.any(String))

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['x-goog-api-key']).toBe('test-key')
    const sentBody = JSON.parse(init.body)
    expect(sentBody.generationConfig.responseMimeType).toBe('application/json')
    expect(sentBody.contents[0].parts[0].text).toContain('Previsão do tempo')
  })

  it('returns a validated answer for action=question, and never lets the client set the API key', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(validAnswerGeminiPayload()), { status: 200 }))
    const response = await handler(jsonRequest(questionRequestBody()))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.answer).toEqual(expect.any(String))
  })
})

describe('POST /api/gemini — upstream failure handling', () => {
  it('maps a 429 from Gemini to upstream-unavailable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('upstream-unavailable')
  })

  it('maps a 500 from Gemini to upstream-unavailable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('upstream-unavailable')
  })

  it('maps an unexpected 4xx from Gemini to unexpected-response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('bad request', { status: 400 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(502)
    expect((await response.json()).error.code).toBe('unexpected-response')
  })

  it('returns unexpected-response when Gemini returns non-JSON text', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }), { status: 200 }),
    )
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(502)
    expect((await response.json()).error.code).toBe('unexpected-response')
  })

  it('returns unexpected-response when the shape has no candidates/text at all', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(502)
    expect((await response.json()).error.code).toBe('unexpected-response')
  })

  it('returns unexpected-response when Gemini JSON does not conform to planSchema', async () => {
    const malformed = { candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: 'ok' }) }] } }] } // missing days/notes
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(malformed), { status: 200 }))
    const response = await handler(jsonRequest(planRequestBody()))
    expect(response.status).toBe(502)
    expect((await response.json()).error.code).toBe('unexpected-response')
  })

  it('maps an aborted/timed-out request to a timeout error', async () => {
    fetchMock.mockImplementationOnce((_url: string, init: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        if (init.signal.aborted) {
          reject(new DOMException('aborted', 'AbortError'))
          return
        }
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    })
    const controller = new AbortController()
    const request = jsonRequest(planRequestBody(), { signal: controller.signal })
    const pending = handler(request)
    controller.abort()
    const response = await pending
    expect(response.status).toBe(504)
    expect((await response.json()).error.code).toBe('timeout')
  })
})
