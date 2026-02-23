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

/** Open a specific sidebar tab by index (0=System, 1=Shapes, 2=Wireframe, 3=Groups, 4=Notes, 5=Connectors, 6=AI) */
export async function openSidebarTab(page: Page, tabIndex: number) {
  await page.locator('.sidebar-rail-btn').nth(tabIndex).click();
  await page.waitForTimeout(300);
}

/** Place a node on the canvas by clicking a sidebar component item (System Blocks tab) */
export async function placeNode(page: Page, nodeType: string) {
  await openSidebarTab(page, 0); // System blocks
  await page.locator(`.component-item[data-type="${nodeType}"]`).click();
  await page.waitForTimeout(300);
}

/** Place a shape on the canvas by clicking a sidebar shape item (Shapes tab) */
export async function placeShape(page: Page, shapeType: string) {
  await openSidebarTab(page, 1); // Shapes tab
  // Shape items don't have data-type, so match by text content
  await page.locator('.sidebar-panel .component-item').filter({ hasText: new RegExp(shapeType, 'i') }).first().click();
  await page.waitForTimeout(300);
}

/** Place a wireframe element on the canvas (Wireframe tab) */
export async function placeWireframe(page: Page, wfType: string) {
  await openSidebarTab(page, 2); // Wireframe tab
  await page.locator(`.component-item[data-type="${wfType}"]`).click();
  await page.waitForTimeout(300);
}

/** Place a group on the canvas by color */
export async function placeGroup(page: Page, color: string) {
  await openSidebarTab(page, 3); // Groups tab
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
