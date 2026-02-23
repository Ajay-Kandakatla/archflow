import { test, expect, placeShape } from './fixtures';

/**
 * Shape Node Tests
 * Verifies that shape nodes render as actual geometric shapes with SVG backgrounds.
 */
test.describe('Shape Node Rendering', () => {
  test('places a circle shape on canvas', async ({ appPage }) => {
    await placeShape(appPage, 'Circle');
    const node = appPage.locator('.node.shape-node').first();
    await expect(node).toBeVisible();
    await expect(node).toHaveAttribute('data-shape', 'circle');
    await expect(node.locator('.shape-bg')).toHaveCount(1);
  });

  test('places a diamond shape on canvas', async ({ appPage }) => {
    await placeShape(appPage, 'Diamond');
    const node = appPage.locator('.node.shape-node').first();
    await expect(node).toBeVisible();
    await expect(node).toHaveAttribute('data-shape', 'diamond');
    await expect(node.locator('.shape-bg')).toHaveCount(1);
  });

  test('places a hexagon shape on canvas', async ({ appPage }) => {
    await placeShape(appPage, 'Hexagon');
    const node = appPage.locator('.node.shape-node').first();
    await expect(node).toBeVisible();
    await expect(node).toHaveAttribute('data-shape', 'hexagon');
  });

  test('shape node has centered title input', async ({ appPage }) => {
    await placeShape(appPage, 'Circle');
    const node = appPage.locator('.node.shape-node').first();
    await expect(node.locator('.shape-title')).toHaveCount(1);
  });

  test('shape node has 4 connection ports', async ({ appPage }) => {
    await placeShape(appPage, 'Circle');
    const node = appPage.locator('.node.shape-node').first();
    await expect(node.locator('.node-port.top')).toHaveCount(1);
    await expect(node.locator('.node-port.bottom')).toHaveCount(1);
    await expect(node.locator('.node-port.left')).toHaveCount(1);
    await expect(node.locator('.node-port.right')).toHaveCount(1);
  });

  test('shape node has delete button on hover', async ({ appPage }) => {
    await placeShape(appPage, 'Diamond');
    const node = appPage.locator('.node.shape-node').first();
    await node.hover();
    await expect(node.locator('.node-delete')).toBeVisible();
  });

  test('circle shape has equal width and height', async ({ appPage }) => {
    await placeShape(appPage, 'Circle');
    const node = appPage.locator('.node.shape-node').first();
    const box = await node.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBe(box!.height);
  });
});
