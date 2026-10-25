import type { Page, Route } from '@playwright/test'
import { cities, countryPayload, currencyPayload, geminiPlanPayload, weatherPayload } from './fixtures'

export type FailureMode = 'offline' | 'http-500' | 'malformed' | 'timeout'
export interface MockOptions {
  geocoding?: FailureMode
  weather?: FailureMode
  country?: FailureMode
  currency?: FailureMode
  delayTokyo?: boolean
}

export interface MockState {
  currencyRequests: string[]
  weatherRequests: string[]
  geminiRequests: string[]
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function failRoute(route: Route, mode: FailureMode): Promise<void> {
  if (mode === 'offline') return route.abort('failed')
  if (mode === 'http-500') return fulfillJson(route, { error: 'fixture failure' }, 500)
  if (mode === 'malformed') return fulfillJson(route, { results: [{ invalid: true }] })
  await new Promise(resolve => setTimeout(resolve, 10_500))
}

export async function mockServices(page: Page, options: MockOptions = {}): Promise<MockState> {
  const state: MockState = { currencyRequests: [], weatherRequests: [], geminiRequests: [] }
  await page.route('**/geocoding-api.open-meteo.com/**', async route => {
    if (options.geocoding) return failRoute(route, options.geocoding)
    const name = new URL(route.request().url()).searchParams.get('name')
    if (options.delayTokyo && name === 'Tokyo') await new Promise(resolve => setTimeout(resolve, 300))
    const result = name === 'Long Destination' ? cities.longDestination : Object.values(cities).find(city => city.name === name)
    await fulfillJson(route, { results: result ? [result] : [] })
  })
  await page.route('**/api.open-meteo.com/v1/forecast**', async route => {
    state.weatherRequests.push(route.request().url())
    if (options.weather) return failRoute(route, options.weather)
    await fulfillJson(route, weatherPayload())
  })
  await page.route('**/countries.dev/alpha/**', async route => {
    if (options.country) return failRoute(route, options.country)
    const code = new URL(route.request().url()).pathname.split('/').pop() ?? 'JP'
    await fulfillJson(route, countryPayload(code))
  })
  await page.route('**/api.frankfurter.dev/v1/**', async route => {
    state.currencyRequests.push(route.request().url())
    if (options.currency) return failRoute(route, options.currency)
    const target = new URL(route.request().url()).searchParams.get('symbols') ?? 'JPY'
    await fulfillJson(route, currencyPayload(target))
  })
  await page.route('**/flagcdn.com/**', route => route.fulfill({
    status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#174e3f"/></svg>',
  }))
  return state
}

export async function mockGemini(page: Page, mode: FailureMode | null = null): Promise<string[]> {
  const requests: string[] = []
  await page.route('**/api/gemini', async route => {
    requests.push(route.request().url())
    if (mode) return failRoute(route, mode)
    const body = route.request().postDataJSON() as { action?: string; context?: { location?: { city?: string } } }
    if (body.action === 'question') return fulfillJson(route, { answer: `Resposta contextual para ${body.context?.location?.city ?? 'o destino'}.` })
    await fulfillJson(route, geminiPlanPayload(body.context?.location?.city))
  })
  return requests
}

export function trackBrowserProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('console', message => { if (message.type() === 'error') problems.push(`console: ${message.text()}`) })
  page.on('pageerror', error => problems.push(`page: ${error.message}`))
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText ?? 'failed'
    const expectedMediaAbort = request.resourceType() === 'media' && failure === 'net::ERR_ABORTED'
    if (!expectedMediaAbort) problems.push(`request: ${request.url()} · ${failure}`)
  })
  return problems
}
