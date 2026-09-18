import { expect, test } from '@playwright/test'

test('[public] abre a URL pública configurada sem erro de página', async ({ page }) => {
  test.skip(process.env.E2E_PUBLIC_SMOKE !== '1', 'Defina E2E_BASE_URL para executar o smoke online.')
  const browserProblems: string[] = []
  page.on('console', message => { if (message.type() === 'error') browserProblems.push(`console: ${message.text()}`) })
  page.on('pageerror', error => browserProblems.push(`page: ${error.message}`))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Descubra/ })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })).toBeVisible()
  expect(browserProblems).toEqual([])
})
