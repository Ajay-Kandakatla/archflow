import { test, expect, placeNode, openSidebarTab } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Connection Drawing Tests
 * Verifies temp line rendering, port highlighting, snap-to-port, connection
 * creation, and duplicate-connection prevention — features added in commit 92da001.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Place two nodes, close the sidebar, then move node[1] 350px to the right so
 * they no longer overlap and port interactions can be targeted precisely.
 *
 * Calling openSidebarTab twice on the same tab toggles it closed, so we open
 * once, click both items, then close explicitly.
 */
async function placeTwoNodes(page: Page, type1: string, type2: string) {
  await openSidebarTab(page, 0);
  await page.locator(`.component-item[data-type="${type1}"]`).click();
  await page.waitForTimeout(300);
  await page.locator(`.component-item[data-type="${type2}"]`).click();
  await page.waitForTimeout(300);

  // Toggle the tab again to close the panel (avoids it overlaying the canvas)
  await openSidebarTab(page, 0);
  await page.waitForTimeout(200);

  // Click empty canvas area (top-right) to deselect and blur any focused input
  await page.mouse.click(950, 180);
  await page.waitForTimeout(150);

  // Drag node[1] 350px to the right so nodes are well separated
  const node1 = page.locator('.node').nth(1);
  const box = await node1.boundingBox();
  if (!box) throw new Error('node[1] not found after placement');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 350, cy, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  // Click empty canvas again to deselect the moved node
  await page.mouse.click(950, 180);
  await page.waitForTimeout(100);
}

/** Return the center screen coordinates of a port element. */
async function portCenter(page: Page, nodeIndex: number, side: 'top' | 'bottom' | 'left' | 'right') {
  const port = page.locator('.node').nth(nodeIndex).locator(`.node-port.${side}`);
  const box = await port.boundingBox();
  if (!box) throw new Error(`Port .node-port.${side} on node[${nodeIndex}] not found`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Temp Connection Line', () => {
  test('appears while dragging from a port', async ({ appPage }) => {
    await placeNode(appPage, 'server');

    const src = await portCenter(appPage, 0, 'right');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    // Drag to empty canvas area — far enough that no snap triggers
    await appPage.mouse.move(src.x + 150, src.y - 100, { steps: 10 });

    await expect(appPage.locator('.temp-connection-line')).toBeVisible();

    await appPage.mouse.up();
  });

  test('disappears after releasing on empty canvas', async ({ appPage }) => {
    await placeNode(appPage, 'server');

    const src = await portCenter(appPage, 0, 'right');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(src.x + 150, src.y - 100, { steps: 10 });
    await appPage.mouse.up();

    await appPage.waitForTimeout(150);
    await expect(appPage.locator('.temp-connection-line')).toHaveCount(0);
  });
});

test.describe('Port Highlighting', () => {
  test('highlights target ports when cursor moves near them during drag', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    // Start drag from source port
    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();

    // Move cursor directly onto the target port — within snap radius so highlight is guaranteed
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.waitForTimeout(150);

    // At least one port should carry the highlight class
    await expect(appPage.locator('.node-port.port-highlight').first()).toBeVisible();

    await appPage.mouse.up();
  });

  test('clears port highlights after mouse release', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(200);

    await expect(appPage.locator('.node-port.port-highlight')).toHaveCount(0);
  });
});

test.describe('Connector Snap', () => {
  test('shows snap target class on the nearest port during drag', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    // Move directly onto the target port (within 40 px snap radius)
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.waitForTimeout(150);

    await expect(appPage.locator('.node').nth(1).locator('.node-port.left')).toHaveClass(/port-snap-target/);

    await appPage.mouse.up();
  });

  test('clears snap target class after mouse release', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(200);

    await expect(appPage.locator('.node-port.port-snap-target')).toHaveCount(0);
  });
});

test.describe('Connection Creation', () => {
  test('creates a connection by dragging from one port to another', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(1);
  });

  test('does not create a connection when released on empty canvas', async ({ appPage }) => {
    await placeNode(appPage, 'server');

    const src = await portCenter(appPage, 0, 'right');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(src.x + 200, src.y - 150, { steps: 10 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(0);
  });

  test('does not connect a node to itself', async ({ appPage }) => {
    await placeNode(appPage, 'server');

    const src = await portCenter(appPage, 0, 'right');
    const dst = await portCenter(appPage, 0, 'left');

    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(dst.x, dst.y, { steps: 10 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(0);
  });
});

test.describe('Duplicate Connection Prevention', () => {
  test('prevents creating an identical connection a second time', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const src = await portCenter(appPage, 0, 'right');
    const tgt = await portCenter(appPage, 1, 'left');

    // First connection
    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(1);

    // Attempt the same connection again
    await appPage.mouse.move(src.x, src.y);
    await appPage.mouse.down();
    await appPage.mouse.move(tgt.x, tgt.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    // Should still be exactly 1 — duplicate was rejected
    await expect(appPage.locator('.connection-path')).toHaveCount(1);
  });

  test('prevents the reverse-direction duplicate (B→A when A→B exists)', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const node0Right = await portCenter(appPage, 0, 'right');
    const node1Left  = await portCenter(appPage, 1, 'left');

    // Draw A → B
    await appPage.mouse.move(node0Right.x, node0Right.y);
    await appPage.mouse.down();
    await appPage.mouse.move(node1Left.x, node1Left.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(1);

    // Attempt B → A using the same ports (reverse)
    await appPage.mouse.move(node1Left.x, node1Left.y);
    await appPage.mouse.down();
    await appPage.mouse.move(node0Right.x, node0Right.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    // isDuplicateConnection checks reverse direction — still 1
    await expect(appPage.locator('.connection-path')).toHaveCount(1);
  });

  test('allows a distinct second connection on different ports', async ({ appPage }) => {
    await placeTwoNodes(appPage, 'server', 'postgres');

    const node0Right  = await portCenter(appPage, 0, 'right');
    const node0Bottom = await portCenter(appPage, 0, 'bottom');
    const node1Left   = await portCenter(appPage, 1, 'left');
    const node1Top    = await portCenter(appPage, 1, 'top');

    // Connection 1: node0.right → node1.left
    await appPage.mouse.move(node0Right.x, node0Right.y);
    await appPage.mouse.down();
    await appPage.mouse.move(node1Left.x, node1Left.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    // Connection 2: node0.bottom → node1.top (different ports — not a duplicate)
    await appPage.mouse.move(node0Bottom.x, node0Bottom.y);
    await appPage.mouse.down();
    await appPage.mouse.move(node1Top.x, node1Top.y, { steps: 20 });
    await appPage.mouse.up();
    await appPage.waitForTimeout(300);

    await expect(appPage.locator('.connection-path')).toHaveCount(2);
  });
});
