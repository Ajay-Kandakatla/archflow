import { test, expect } from '@playwright/test';
import { test as appTest, expect as appExpect, setupApp } from './fixtures';

/**
 * Page Load & Authentication Tests
 * Verifies the app boots correctly and shows the right initial UI.
 */
test.describe('Page Load & Auth', () => {
  test('shows login overlay on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);
    await expect(page.locator('.login-overlay')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ArchFlow/);
  });

  test('loads without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out expected errors (Google API, network issues)
    const unexpected = errors.filter(e =>
      !e.includes('google') && !e.includes('Google') &&
      !e.includes('Config fetch failed') && !e.includes('accounts.google.com') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('net::') &&
      !e.includes('Failed to load resource') && !e.includes('favicon') &&
      !e.includes('api/')
    );
    expect(unexpected).toHaveLength(0);
  });
});

appTest.describe('Main App Elements', () => {
  appTest('shows topbar with ArchFlow branding', async ({ appPage }) => {
    await appExpect(appPage.locator('.topbar')).toBeVisible();
    await appExpect(appPage.locator('.topbar .logo')).toContainText('ArchFlow');
  });

  appTest('body has dark theme by default', async ({ appPage }) => {
    const theme = await appPage.evaluate(() => document.body.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  appTest('topbar is 52px tall', async ({ appPage }) => {
    const box = await appPage.locator('.topbar').boundingBox();
    expect(box?.height).toBe(52);
  });
});
