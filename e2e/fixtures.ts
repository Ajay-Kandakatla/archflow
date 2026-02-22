import { test as base, expect, Page } from '@playwright/test';

/**
 * Shared test fixtures for ArchFlow E2E tests.
 * Provides a pre-configured page with login bypassed.
 */

// ── Helpers ──────────────────────────────────────────────

/** Hide the login overlay so tests can interact with the app */
async function hideLogin(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('.login-overlay').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

/** Navigate to app and bypass the login screen */
export async function setupApp(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(800); // Wait for React mount
  await hideLogin(page);
}

/** Open a specific sidebar tab by index (0=System, 1=Shapes, 2=Groups, 3=Notes, 4=Connectors, 5=AI) */
export async function openSidebarTab(page: Page, tabIndex: number) {
  await page.locator('.sidebar-rail-btn').nth(tabIndex).click();
  await page.waitForTimeout(300);
}

/** Place a node on the canvas by clicking a sidebar component item */
export async function placeNode(page: Page, nodeType: string) {
  await openSidebarTab(page, 0); // System blocks
  await page.locator(`.component-item[data-type="${nodeType}"]`).click();
  await page.waitForTimeout(300);
}

/** Place a group on the canvas by color */
export async function placeGroup(page: Page, color: string) {
  await openSidebarTab(page, 2); // Groups tab
  await page.locator(`.component-item[data-color="${color}"]`).first().click();
  await page.waitForTimeout(300);
}

// ── Custom test fixture with app already set up ──────────

export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ page }, use) => {
    await setupApp(page);
    await use(page);
  },
});

export { expect };
