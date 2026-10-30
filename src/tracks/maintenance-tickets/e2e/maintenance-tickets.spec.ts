import { expect, test } from '../../../../e2e/fixtures'

test.describe('maintenance-tickets track', () => {
  test('opens from the home grid', async ({ signedInPage: page }) => {
    await page.getByTestId('track-card-maintenance-tickets').click()
    await expect(page).toHaveURL(/\/tracks\/maintenance-tickets$/)
    await expect(page.getByRole('heading', { name: 'Maintenance Tickets' })).toBeVisible()
  })
})
