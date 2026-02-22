import { test, expect } from './fixtures';

/**
 * Canvas Tests
 * Verifies the canvas container, grid, connections layer, and context menu.
 */
test.describe('Canvas Structure', () => {
  test('has canvas container and canvas element', async ({ appPage }) => {
    await expect(appPage.locator('#canvasContainer')).toBeVisible();
    await expect(appPage.locator('#canvas')).toBeVisible();
  });

  test('has grid background', async ({ appPage }) => {
    await expect(appPage.locator('.grid-bg')).toBeVisible();
  });

  test('has connections SVG layer', async ({ appPage }) => {
    await expect(appPage.locator('#connectionsSvg')).toBeVisible();
  });

  test('canvas starts after the 56px sidebar rail', async ({ appPage }) => {
    const box = await appPage.locator('#canvasContainer').boundingBox();
    expect(box?.x).toBe(56);
  });

  test('has minimap', async ({ appPage }) => {
    await expect(appPage.locator('.minimap')).toBeVisible();
  });

  test('has hint overlay with instructions', async ({ appPage }) => {
    await expect(appPage.locator('.hint-overlay')).toContainText('ArchFlow');
  });
});

test.describe('Context Menu', () => {
  test('shows on right-click', async ({ appPage }) => {
    await appPage.locator('#canvasContainer').click({ button: 'right', position: { x: 400, y: 300 } });
    await expect(appPage.locator('#contextMenu')).toBeVisible();
  });

  test('has expected menu items', async ({ appPage }) => {
    await appPage.locator('#canvasContainer').click({ button: 'right', position: { x: 400, y: 300 } });
    const menu = appPage.locator('#contextMenu');
    await expect(menu).toContainText('Yellow Note');
    await expect(menu).toContainText('Blue Note');
    await expect(menu).toContainText('Select All');
    await expect(menu).toContainText('Fit to Screen');
    await expect(menu).toContainText('Clear Canvas');
    await expect(menu).toContainText('Blue Group');
  });
});

test.describe('SVG Arrow Markers', () => {
  const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'yellow'];

  test('has forward arrow markers for all colors', async ({ appPage }) => {
    for (const color of COLORS) {
      await expect(appPage.locator(`#ah-${color}`)).toHaveCount(1);
    }
  });

  test('has reverse arrow markers for all colors', async ({ appPage }) => {
    for (const color of COLORS) {
      await expect(appPage.locator(`#ah-${color}-rev`)).toHaveCount(1);
    }
  });

  test('has glow filter', async ({ appPage }) => {
    await expect(appPage.locator('#glow')).toHaveCount(1);
  });
});
