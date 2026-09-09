import { expect, test } from '@playwright/test'

test('permite iniciar uma pesquisa pelo teclado', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'TravelAI' })).toBeVisible()
  const destination = page.getByRole('searchbox', {
    name: 'Para onde você quer viajar?',
  })
  await destination.fill('Tokyo')
  await destination.press('Enter')

  await expect(page.getByRole('status')).toContainText('Tokyo')
  expect(consoleErrors).toEqual([])
})
