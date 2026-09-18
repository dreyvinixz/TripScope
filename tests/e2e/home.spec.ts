import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { cityCases } from './support/fixtures'
import { mockGemini, mockServices, trackBrowserProblems } from './support/mockServices'

async function searchCity(page: Page, city: string) {
  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill(city)
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText(city)
}

test('pesquisa Tokyo e exibe destino, clima e cinco previsões', async ({ page }) => {
  const browserProblems = trackBrowserProblems(page)
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')

  await expect(page.locator('#destination-title')).toContainText('Tokyo')
  await expect(page.getByRole('img', { name: 'Bandeira de Japan' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText('Japanese')
  await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' })).toContainText('JPY')
  await expect(page.getByRole('region', { name: 'Previsão de cinco dias · incluindo hoje' }).locator('.forecast-card')).toHaveCount(5)
  await expect(page.getByText('35.69°, 139.69°')).toBeVisible()
  expect(browserProblems).toEqual([])
})

for (const city of cityCases) {
  test(`normaliza a cidade ${city.query}, país e moeda`, async ({ page }) => {
    await mockServices(page)
    await page.goto('/')
    await searchCity(page, city.query)

    await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText(city.country)
    await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' })).toContainText(city.currency)
    await expect(page.getByRole('region', { name: 'Previsão de cinco dias · incluindo hoje' }).locator('.forecast-card')).toHaveCount(5)
  })
}

for (const mode of ['offline', 'http-500', 'malformed'] as const) {
  test(`geocodificação trata ${mode} sem JSON bruto`, async ({ page }) => {
    await mockServices(page, { geocoding: mode })
    await page.goto('/')
    const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
    await destination.fill('Tokyo')
    await destination.press('Enter')

    await expect(page.getByRole('alert')).toContainText(mode === 'offline' ? 'Verifique sua conexão' : mode === 'http-500' ? 'temporariamente indisponível' : 'dados inesperados')
    await expect(page.locator('body')).not.toContainText('fixture failure')
  })
}

for (const mode of ['offline', 'http-500', 'malformed'] as const) {
  test(`falha parcial de clima ${mode} preserva país e câmbio`, async ({ page }) => {
    await mockServices(page, { weather: mode })
    await page.goto('/')
    await searchCity(page, 'Tokyo')

    await expect(page.getByRole('region', { name: 'Clima atual' }).getByRole('alert')).toContainText(mode === 'offline' ? 'Verifique sua conexão' : mode === 'http-500' ? 'temporariamente indisponível' : 'dados inesperados')
    await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText('Japan')
    await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' })).toContainText('JPY')
  })
}

for (const mode of ['offline', 'http-500', 'malformed'] as const) {
  test(`falha parcial de país ${mode} preserva clima`, async ({ page }) => {
    await mockServices(page, { country: mode })
    await page.goto('/')
    await searchCity(page, 'Tokyo')

    await expect(page.getByRole('region', { name: 'Sobre o país' }).getByRole('alert')).toContainText(mode === 'offline' ? 'Verifique sua conexão' : mode === 'http-500' ? 'temporariamente indisponível' : 'dados inesperados')
    await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
    await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' }).getByRole('alert')).toContainText('Câmbio indisponível')
  })
}

for (const mode of ['offline', 'http-500', 'malformed'] as const) {
  test(`falha parcial de câmbio ${mode} preserva país e clima`, async ({ page }) => {
    await mockServices(page, { currency: mode })
    await page.goto('/')
    await searchCity(page, 'Tokyo')

    await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' }).getByRole('alert')).toContainText(mode === 'offline' ? 'Verifique sua conexão' : mode === 'http-500' ? 'temporariamente indisponível' : 'dados inesperados')
    await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText('Japan')
    await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  })
}

test('busca cidade inexistente e exibe erro amigável', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('asdfghxyz123')
  await destination.press('Enter')

  await expect(page.getByRole('alert')).toContainText('Não encontramos esse destino.')
  await expect(page.getByRole('heading', { name: 'Descubra.' })).toBeVisible()
})

test('mantém somente Paris quando uma nova busca começa antes de Tokyo terminar', async ({ page }) => {
  await mockServices(page, { delayTokyo: true })
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await destination.fill('Paris')
  await destination.press('Enter')

  await expect(page.locator('#destination-title')).toContainText('Paris')
  await expect(page.locator('#destination-title')).not.toContainText('Tokyo')
})

test('converte R$ 1.000 para JPY sem consultar novamente ao editar o valor', async ({ page }) => {
  const { currencyRequests } = await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')

  const amount = page.getByLabel('Quanto você quer levar? (BRL)')
  await expect(page.locator('output.converted')).toContainText('29.420')
  const requestsAfterQuote = currencyRequests.length
  await amount.fill('1000')
  await expect(page.locator('output.converted')).toContainText('29.420')
  await expect(page.locator('output.converted')).toContainText('JPY')
  expect(currencyRequests.length).toBe(requestsAfterQuote)
})

test('mantém país e clima quando Frankfurter não suporta a moeda', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Unsupported')
  await destination.press('Enter')

  await expect(page.locator('#destination-title')).toContainText('Unsupported')
  await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText('Exampleland')
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' }).getByRole('alert')).toContainText('Moeda não suportada')
})

test('exibe fallbacks do país quando capital, idioma e moeda estão ausentes', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Nowhere')
  await destination.press('Enter')

  await expect(page.locator('#destination-title')).toContainText('Nowhere')
  const country = page.getByRole('region', { name: 'Sobre o país' })
  await expect(country).toContainText('Não informada')
  await expect(country).toContainText('Não informados')
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' }).getByRole('alert')).toContainText('não informa uma moeda compatível')
})

test('valida valor monetário e usa separador decimal local sem nova requisição', async ({ page }) => {
  const { currencyRequests } = await mockServices(page)
  await page.goto('/')
  await searchCity(page, 'Tokyo')
  const amount = page.getByLabel('Quanto você quer levar? (BRL)')
  await expect(page.locator('output.converted')).toContainText('29.420')
  const requestsAfterQuote = currencyRequests.length

  await amount.fill('')
  await expect(page.getByRole('alert')).toContainText('Informe um valor')
  await amount.fill('-1')
  await expect(page.getByRole('alert')).toContainText('Informe um valor')
  await amount.fill('1000001')
  await expect(page.getByRole('alert')).toContainText('Informe um valor')
  await amount.fill('1.000,50')
  await expect(page.locator('output.converted')).toContainText('29.435')
  expect(currencyRequests.length).toBe(requestsAfterQuote)
})

test('completa a busca usando somente o teclado e preserva foco visível', async ({ page }) => {
  const browserProblems = trackBrowserProblems(page)
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.focus()
  await page.keyboard.type('Tokyo')
  await page.keyboard.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')

  const toggleUnit = page.getByRole('button', { name: 'Alterar temperatura para °F' })
  await toggleUnit.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('°F')
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('BUTTON')
  await expect.poll(() => page.evaluate(() => {
    const element = document.activeElement
    if (!(element instanceof HTMLElement)) return false
    const style = getComputedStyle(element)
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
  })).toBe(true)
  expect(browserProblems).toEqual([])
})

test('não cria overflow horizontal com conteúdo longo e texto ampliado', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Long Destination')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Very Long Destination Name For Accessibility')

  await page.evaluate(() => { document.documentElement.style.fontSize = '125%' })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('passa na auditoria automatizada de acessibilidade na home e no dashboard', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const homeResults = await new AxeBuilder({ page }).analyze()
  expect(homeResults.violations).toEqual([])

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')

  const dashboardResults = await new AxeBuilder({ page }).include('#main').analyze()
  expect(dashboardResults.violations).toEqual([])
})

test('persiste histórico, favorito e tema após reload', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')
  const saved = page.getByRole('region', { name: 'Destinos salvos' })
  await expect(saved.getByRole('button', { name: 'Tokyo', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '★ Favoritar' }).click()
  await expect(saved.getByRole('button', { name: '★ Tokyo', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click()
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe('dark')

  await page.reload()
  const savedAfterReload = page.getByRole('region', { name: 'Destinos salvos' })
  await expect(savedAfterReload.getByRole('button', { name: 'Tokyo', exact: true })).toBeVisible()
  await expect(savedAfterReload.getByRole('button', { name: '★ Tokyo', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ativar modo claro' })).toBeVisible()
  await page.getByRole('button', { name: '★ Tokyo' }).click()
  await expect(page.locator('#destination-title')).toContainText('Tokyo')
})

test('alterna Celsius/Fahrenheit sem refazer a chamada meteorológica', async ({ page }) => {
  const { weatherRequests } = await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  const requestsAfterLoad = weatherRequests.length

  await page.getByRole('button', { name: 'Alterar temperatura para °F' }).click()
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('76°F')
  expect(weatherRequests.length).toBe(requestsAfterLoad)
})

test('compartilha com fallback de copiar link quando Web Share não existe', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (value: string) => { (window as unknown as { copied?: string }).copied = value; return Promise.resolve() } } })
  })
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')
  await page.getByRole('button', { name: 'Compartilhar' }).click()

  await expect(page.locator('p.notice')).toContainText('Link copiado')
  await expect.poll(() => page.evaluate(() => (window as unknown as { copied?: string }).copied ?? '')).toContain('/?city=Tokyo')
})

test('imprime o roteiro e oculta controles no modo de impressão', async ({ page }) => {
  await mockServices(page)
  await mockGemini(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await expect(page.locator('#destination-title')).toContainText('Tokyo')
  await page.getByRole('button', { name: 'Gerar roteiro com IA' }).click()
  await expect(page.getByRole('region', { name: 'Roteiro gerado' })).toBeVisible()

  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printCalled = 'true' } })
  await page.getByRole('button', { name: 'Imprimir / salvar PDF' }).click()
  expect(await page.locator('html').getAttribute('data-print-called')).toBe('true')

  await page.emulateMedia({ media: 'print' })
  await expect.poll(() => page.locator('.site-header').evaluate(element => getComputedStyle(element).display)).toBe('none')
  await expect.poll(() => page.locator('.itinerary').evaluate(element => getComputedStyle(element).display)).not.toBe('none')
})

test('envia pergunta contextual ao Gemini usando o destino atual', async ({ page }) => {
  const geminiRequests = await mockGemini(page)
  await mockServices(page)
  await page.goto('/')
  await searchCity(page, 'Tokyo')

  await page.getByLabel('Sua pergunta').fill('O que devo levar na mala?')
  await page.getByRole('button', { name: 'Perguntar à IA' }).click()
  await expect(page.getByRole('region', { name: 'Pergunte sobre o destino' }).getByRole('status')).toContainText('Tokyo')
  expect(geminiRequests).toHaveLength(1)
})

for (const mode of ['offline', 'http-500', 'malformed'] as const) {
  test(`falha do Gemini ${mode} não remove o dashboard`, async ({ page }) => {
    await mockGemini(page, mode)
    await mockServices(page)
    await page.goto('/')
    await searchCity(page, 'Tokyo')
    await page.getByRole('button', { name: 'Gerar roteiro com IA' }).click()

    await expect(page.getByRole('alert')).toContainText('assistente de IA está temporariamente indisponível')
    await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  })
}
