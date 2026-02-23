import { test, expect, openSidebarTab } from './fixtures';

/**
 * Sidebar Tests
 * Verifies the sidebar rail, tab switching, and panel content.
 */
test.describe('Sidebar Rail', () => {
  test('shows rail with 8 tab buttons', async ({ appPage }) => {
    const rail = appPage.locator('.sidebar-rail');
    await expect(rail).toBeVisible();
    await expect(rail.locator('.sidebar-rail-btn')).toHaveCount(8);
  });

  test('rail is 56px wide', async ({ appPage }) => {
    const box = await appPage.locator('.sidebar-rail').boundingBox();
    expect(box?.width).toBe(56);
  });

  test('toggles panel closed on same tab click', async ({ appPage }) => {
    const btn = appPage.locator('.sidebar-rail-btn').first();
    await btn.click();
    await expect(appPage.locator('.sidebar-panel')).toHaveClass(/open/);
    await btn.click();
    await expect(appPage.locator('.sidebar-panel')).not.toHaveClass(/open/);
  });
});

test.describe('Sidebar Panels', () => {
  test('system blocks panel shows component categories', async ({ appPage }) => {
    await openSidebarTab(appPage, 0);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toHaveClass(/open/);
    await expect(panel).toContainText('Client Layer');
    await expect(panel).toContainText('Network / Gateway');
    await expect(panel).toContainText('Application');
    await expect(panel).toContainText('Database / Storage');
  });

  test('system panel items are draggable', async ({ appPage }) => {
    await openSidebarTab(appPage, 0);
    const items = appPage.locator('.sidebar-panel .component-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(20);
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(items.nth(i)).toHaveAttribute('draggable', 'true');
    }
  });

  test('shapes panel shows basic shapes', async ({ appPage }) => {
    await openSidebarTab(appPage, 1);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Basic Shapes');
    await expect(panel).toContainText('Rectangle');
    await expect(panel).toContainText('Circle');
    await expect(panel).toContainText('Diamond');
  });

  test('wireframe panel shows wireframe elements in sections', async ({ appPage }) => {
    await openSidebarTab(appPage, 2);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Form Elements');
    await expect(panel).toContainText('Button');
    await expect(panel).toContainText('Checkbox');
    await expect(panel).toContainText('Toggle');
    await expect(panel).toContainText('Content');
    await expect(panel).toContainText('Navigation');
    await expect(panel).toContainText('Layout');
    await expect(panel).toContainText('Table');
    await expect(panel).toContainText('Browser');
    await expect(panel).toContainText('Mobile');
  });

  test('icons panel shows icon categories with search', async ({ appPage }) => {
    await openSidebarTab(appPage, 3);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Icons');
    await expect(panel.locator('.icon-search-input')).toBeVisible();
    await expect(panel).toContainText('Arrows');
    await expect(panel).toContainText('UI');
    await expect(panel).toContainText('Tech');
  });

  test('groups panel shows group containers', async ({ appPage }) => {
    await openSidebarTab(appPage, 4);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Group Containers');
    await expect(panel).toContainText('Blue Group');
    await expect(panel).toContainText('Green Group');
  });

  test('notes panel shows sticky notes', async ({ appPage }) => {
    await openSidebarTab(appPage, 5);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Sticky Notes');
    await expect(panel).toContainText('Yellow Note');
    await expect(panel).toContainText('Blue Note');
  });

  test('connectors panel shows instructions', async ({ appPage }) => {
    await openSidebarTab(appPage, 6);
    const panel = appPage.locator('.sidebar-panel');
    await expect(panel).toContainText('Connection Tools');
    await expect(panel).toContainText('Draw connections');
  });
});
