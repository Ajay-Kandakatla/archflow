import { test, expect, placeWireframe } from './fixtures';

/**
 * Wireframe Element Tests
 * Verifies that wireframe nodes render with correct inner structure.
 */
test.describe('Wireframe Node Rendering', () => {
  test('places a wf-button on canvas', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-button');
    const node = appPage.locator('.node.wireframe-node').first();
    await expect(node).toBeVisible();
    await expect(node).toHaveAttribute('data-wireframe', 'wf-button');
    await expect(node.locator('.wf-button-inner')).toHaveCount(1);
  });

  test('places a wf-browser on canvas', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-browser');
    const node = appPage.locator('.node.wireframe-node').first();
    await expect(node).toBeVisible();
    await expect(node.locator('.wf-browser-inner')).toHaveCount(1);
    await expect(node.locator('.wf-browser-chrome')).toHaveCount(1);
    await expect(node.locator('.wf-dot')).toHaveCount(3);
  });

  test('places a wf-mobile on canvas', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-mobile');
    const node = appPage.locator('.node.wireframe-node').first();
    await expect(node).toBeVisible();
    await expect(node.locator('.wf-mobile-inner')).toHaveCount(1);
    await expect(node.locator('.wf-mobile-notch')).toHaveCount(1);
    await expect(node.locator('.wf-mobile-screen')).toHaveCount(1);
  });

  test('wireframe node has connection ports', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-button');
    const node = appPage.locator('.node.wireframe-node').first();
    await expect(node.locator('.node-port.top')).toHaveCount(1);
    await expect(node.locator('.node-port.bottom')).toHaveCount(1);
    await expect(node.locator('.node-port.left')).toHaveCount(1);
    await expect(node.locator('.node-port.right')).toHaveCount(1);
  });

  test('wireframe node is deletable', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-button');
    const node = appPage.locator('.node.wireframe-node').first();
    await node.hover();
    await expect(node.locator('.node-delete')).toBeVisible();
    await node.locator('.node-delete').click();
    await expect(appPage.locator('.node.wireframe-node')).toHaveCount(0);
  });

  test('wf-input shows label and field', async ({ appPage }) => {
    await placeWireframe(appPage, 'wf-input');
    const node = appPage.locator('.node.wireframe-node').first();
    await expect(node.locator('.wf-input-inner')).toHaveCount(1);
    await expect(node.locator('.wf-input-field')).toHaveCount(1);
    await expect(node.locator('.wf-input-label')).toHaveCount(1);
  });
});
