import { test, expect, placeNode } from './fixtures';

/**
 * Node Interaction Tests
 * Verifies node placement, selection, deletion, and ports.
 */
test.describe('Click-to-Place Nodes', () => {
  test('places a node on canvas when clicking sidebar item', async ({ appPage }) => {
    await placeNode(appPage, 'browser');
    const nodes = appPage.locator('.node');
    await expect(nodes).toHaveCount(1);
    await expect(nodes.first().locator('.node-title')).toHaveValue('Browser');
  });

  test('stacks multiple click-placed nodes with offset', async ({ appPage }) => {
    await placeNode(appPage, 'browser');
    // Place two more without re-opening sidebar (it stays open)
    await appPage.locator('.component-item[data-type="browser"]').click();
    await appPage.waitForTimeout(100);
    await appPage.locator('.component-item[data-type="browser"]').click();
    await appPage.waitForTimeout(300);
    await expect(appPage.locator('.node')).toHaveCount(3);
  });
});

test.describe('Node Selection & Actions', () => {
  test('selects a node on click', async ({ appPage }) => {
    await placeNode(appPage, 'server');
    const node = appPage.locator('.node').first();
    await node.click();
    await expect(node).toHaveClass(/selected/);
  });

  test('shows delete button on hover', async ({ appPage }) => {
    await placeNode(appPage, 'server');
    const node = appPage.locator('.node').first();
    await node.hover();
    await expect(node.locator('.node-delete')).toBeVisible();
  });

  test('deletes node via delete button', async ({ appPage }) => {
    await placeNode(appPage, 'server');
    const node = appPage.locator('.node').first();
    await node.hover();
    await node.locator('.node-delete').click();
    await expect(appPage.locator('.node')).toHaveCount(0);
  });

  test('has 4 connection ports (top, bottom, left, right)', async ({ appPage }) => {
    await placeNode(appPage, 'server');
    const node = appPage.locator('.node').first();
    await expect(node.locator('.node-port.top')).toHaveCount(1);
    await expect(node.locator('.node-port.bottom')).toHaveCount(1);
    await expect(node.locator('.node-port.left')).toHaveCount(1);
    await expect(node.locator('.node-port.right')).toHaveCount(1);
  });
});
