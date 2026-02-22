import { test, expect, Page } from '@playwright/test';

// Helper: hide login overlay so tests can interact with UI behind it
async function hideLogin(page: Page) {
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('.login-overlay');
    overlays.forEach(el => (el as HTMLElement).style.display = 'none');
  });
}

// Helper: go to page and hide login overlay
async function gotoAndBypassLogin(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(800); // Wait for React to mount
  await hideLogin(page);
}

// ============================================
// Page Load & Auth
// ============================================
test.describe('Page Load & Auth', () => {
  test('should show login overlay on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);
    const loginOverlay = page.locator('.login-overlay');
    await expect(loginOverlay).toBeVisible();
  });

  test('should show the main app elements', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.locator('.topbar .logo')).toContainText('ArchFlow');
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ArchFlow/);
  });
});

// ============================================
// Sidebar (Icon Rail + Flyout Panel)
// ============================================
test.describe('Sidebar', () => {
  test('should show sidebar rail with tab buttons', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const rail = page.locator('.sidebar-rail');
    await expect(rail).toBeVisible();
    const buttons = rail.locator('.sidebar-rail-btn');
    await expect(buttons).toHaveCount(6); // system, shapes, groups, notes, connectors, AI
  });

  test('sidebar rail should be 56px wide', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const rail = page.locator('.sidebar-rail');
    const box = await rail.boundingBox();
    expect(box?.width).toBe(56);
  });

  test('should open system blocks panel on click', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const systemBtn = page.locator('.sidebar-rail-btn').first();
    await systemBtn.click();
    const panel = page.locator('.sidebar-panel');
    await expect(panel).toHaveClass(/open/);
    await expect(panel).toContainText('Client Layer');
    await expect(panel).toContainText('Network / Gateway');
    await expect(panel).toContainText('Application');
    await expect(panel).toContainText('Database / Storage');
  });

  test('should toggle panel closed on same tab click', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const systemBtn = page.locator('.sidebar-rail-btn').first();
    await systemBtn.click();
    await expect(page.locator('.sidebar-panel')).toHaveClass(/open/);
    await systemBtn.click();
    await expect(page.locator('.sidebar-panel')).not.toHaveClass(/open/);
  });

  test('system panel should have draggable component items', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    const items = page.locator('.sidebar-panel .component-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(20); // All system components
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(items.nth(i)).toHaveAttribute('draggable', 'true');
    }
  });

  test('shapes panel should show basic shapes', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(1).click(); // Shapes tab
    await page.waitForTimeout(300);
    const panel = page.locator('.sidebar-panel');
    await expect(panel).toContainText('Basic Shapes');
    await expect(panel).toContainText('Rectangle');
    await expect(panel).toContainText('Circle');
    await expect(panel).toContainText('Diamond');
  });

  test('groups panel should show group containers', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(2).click(); // Groups tab
    await page.waitForTimeout(300);
    const panel = page.locator('.sidebar-panel');
    await expect(panel).toContainText('Group Containers');
    await expect(panel).toContainText('Blue Group');
    await expect(panel).toContainText('Green Group');
  });

  test('notes panel should show sticky notes', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(3).click(); // Notes tab
    await page.waitForTimeout(300);
    const panel = page.locator('.sidebar-panel');
    await expect(panel).toContainText('Sticky Notes');
    await expect(panel).toContainText('Yellow Note');
    await expect(panel).toContainText('Blue Note');
  });

  test('connectors panel should show instructions', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(4).click(); // Connectors tab
    await page.waitForTimeout(300);
    const panel = page.locator('.sidebar-panel');
    await expect(panel).toContainText('Connection Tools');
    await expect(panel).toContainText('Draw connections');
  });
});

// ============================================
// Click-to-Place
// ============================================
test.describe('Click-to-Place', () => {
  test('should place a node on canvas when clicking sidebar item', async ({ page }) => {
    await gotoAndBypassLogin(page);
    // Open system blocks panel
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    // Click on browser component
    const browserItem = page.locator('.component-item[data-type="browser"]');
    await browserItem.click();
    await page.waitForTimeout(300);
    // Verify node appeared on canvas
    const nodes = page.locator('.node');
    await expect(nodes).toHaveCount(1);
    await expect(nodes.first()).toContainText('Browser');
  });

  test('should stack multiple click-placed nodes with offset', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    const browserItem = page.locator('.component-item[data-type="browser"]');
    await browserItem.click();
    await page.waitForTimeout(100);
    await browserItem.click();
    await page.waitForTimeout(100);
    await browserItem.click();
    await page.waitForTimeout(300);
    const nodes = page.locator('.node');
    await expect(nodes).toHaveCount(3);
  });
});

// ============================================
// Canvas
// ============================================
test.describe('Canvas', () => {
  test('should have canvas container', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('#canvasContainer')).toBeVisible();
    await expect(page.locator('#canvas')).toBeVisible();
  });

  test('should have grid background', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('.grid-bg')).toBeVisible();
  });

  test('should have connections SVG layer', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('#connectionsSvg')).toBeVisible();
  });

  test('canvas should start after sidebar rail', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const container = page.locator('#canvasContainer');
    const box = await container.boundingBox();
    expect(box?.x).toBe(56);
  });
});

// ============================================
// Node Interaction
// ============================================
test.describe('Node Interaction', () => {
  test('should select a node on click', async ({ page }) => {
    await gotoAndBypassLogin(page);
    // Place a node first
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-type="server"]').click();
    await page.waitForTimeout(300);
    // Click on the node
    const node = page.locator('.node').first();
    await node.click();
    await expect(node).toHaveClass(/selected/);
  });

  test('should show delete button on hover', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-type="server"]').click();
    await page.waitForTimeout(300);
    const node = page.locator('.node').first();
    await node.hover();
    await expect(node.locator('.node-delete')).toBeVisible();
  });

  test('should delete node when clicking delete button', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-type="server"]').click();
    await page.waitForTimeout(300);
    const node = page.locator('.node').first();
    await node.hover();
    await node.locator('.node-delete').click();
    await expect(page.locator('.node')).toHaveCount(0);
  });

  test('should have connection ports on each node', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-type="server"]').click();
    await page.waitForTimeout(300);
    const node = page.locator('.node').first();
    await expect(node.locator('.node-port.top')).toHaveCount(1);
    await expect(node.locator('.node-port.bottom')).toHaveCount(1);
    await expect(node.locator('.node-port.left')).toHaveCount(1);
    await expect(node.locator('.node-port.right')).toHaveCount(1);
  });
});

// ============================================
// Group Container
// ============================================
test.describe('Group Container', () => {
  test('should place a group on canvas via click', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(2).click(); // Groups tab
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-color="blue"]').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.group-container')).toHaveCount(1);
  });

  test('group should have title input', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(2).click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-color="blue"]').first().click();
    await page.waitForTimeout(300);
    const group = page.locator('.group-container').first();
    await expect(group.locator('.group-container-title')).toBeVisible();
  });

  test('group should show delete button on hover', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(2).click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-color="blue"]').first().click();
    await page.waitForTimeout(300);
    const group = page.locator('.group-container').first();
    await group.hover();
    await expect(group.locator('.group-container-delete')).toBeVisible();
  });

  test('group should have group items button', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.locator('.sidebar-rail-btn').nth(2).click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-color="blue"]').first().click();
    await page.waitForTimeout(300);
    const group = page.locator('.group-container').first();
    await group.hover();
    await expect(group.locator('.group-container-ungroup')).toBeVisible();
  });
});

// ============================================
// Context Menu
// ============================================
test.describe('Context Menu', () => {
  test('should show context menu on right-click', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const canvas = page.locator('#canvasContainer');
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });
    await expect(page.locator('#contextMenu')).toBeVisible();
  });

  test('should have context menu items', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const canvas = page.locator('#canvasContainer');
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });
    const menu = page.locator('#contextMenu');
    await expect(menu).toContainText('Yellow Note');
    await expect(menu).toContainText('Blue Note');
    await expect(menu).toContainText('Select All');
    await expect(menu).toContainText('Fit to Screen');
    await expect(menu).toContainText('Clear Canvas');
    await expect(menu).toContainText('Blue Group');
  });
});

// ============================================
// SVG Arrow Markers
// ============================================
test.describe('SVG Arrow Markers', () => {
  test('should have forward arrow markers for all colors', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'yellow'];
    for (const color of colors) {
      await expect(page.locator(`#ah-${color}`)).toHaveCount(1);
    }
  });

  test('should have reverse arrow markers for bidirectional', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'yellow'];
    for (const color of colors) {
      await expect(page.locator(`#ah-${color}-rev`)).toHaveCount(1);
    }
  });

  test('should have glow filter', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('#glow')).toHaveCount(1);
  });
});

// ============================================
// Theme
// ============================================
test.describe('Theme', () => {
  test('body should have dark theme by default', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const theme = await page.evaluate(() => document.body.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });
});

// ============================================
// Layout
// ============================================
test.describe('Layout', () => {
  test('topbar should be 52px tall', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const topbar = page.locator('.topbar');
    const box = await topbar.boundingBox();
    expect(box?.height).toBe(52);
  });
});

// ============================================
// Minimap
// ============================================
test.describe('Minimap', () => {
  test('should have minimap', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('.minimap')).toBeVisible();
  });
});

// ============================================
// Template Modal
// ============================================
test.describe('Template Modal', () => {
  test('should open template modal via button', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await page.click('.btn-templates');
    await expect(page.locator('.template-modal-overlay')).toBeVisible();
  });
});

// ============================================
// File Input
// ============================================
test.describe('File Input', () => {
  test('should have hidden file input for image upload', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const input = page.locator('#imageFileInput');
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('accept', 'image/*');
    await expect(input).toHaveCSS('display', 'none');
  });
});

// ============================================
// Toast
// ============================================
test.describe('Toast', () => {
  test('should have toast element', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('.toast')).toHaveCount(1);
  });
});

// ============================================
// Module Loading
// ============================================
test.describe('Module Loading', () => {
  test('should load app without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Filter out expected errors (Google API not loaded, network issues)
    const unexpectedErrors = errors.filter(e =>
      !e.includes('google') &&
      !e.includes('Google') &&
      !e.includes('Config fetch failed') &&
      !e.includes('accounts.google.com') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT') &&
      !e.includes('net::') &&
      !e.includes('Failed to load resource') &&
      !e.includes('favicon') &&
      !e.includes('api/')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});

// ============================================
// Hint Overlay
// ============================================
test.describe('Hint Overlay', () => {
  test('should show hint overlay with instructions', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const hint = page.locator('.hint-overlay');
    await expect(hint).toContainText('ArchFlow');
  });
});

// ============================================
// Export & Save Buttons
// ============================================
test.describe('Export', () => {
  test('should have export button', async ({ page }) => {
    await gotoAndBypassLogin(page);
    await expect(page.locator('.btn-export')).toBeVisible();
  });

  test('should have save button in topbar', async ({ page }) => {
    await gotoAndBypassLogin(page);
    const saveBtn = page.locator('.topbar .btn-save');
    await expect(saveBtn).toBeVisible();
  });
});

// ============================================
// Auto-Save (localStorage)
// ============================================
test.describe('Auto-Save', () => {
  test('should persist diagram to localStorage', async ({ page }) => {
    await gotoAndBypassLogin(page);
    // Place a node
    await page.locator('.sidebar-rail-btn').first().click();
    await page.waitForTimeout(300);
    await page.locator('.component-item[data-type="browser"]').click();
    await page.waitForTimeout(3000); // Wait for auto-save (2s debounce + buffer)
    // Check localStorage
    const saved = await page.evaluate(() => localStorage.getItem('archflow-local-diagram'));
    expect(saved).toBeTruthy();
    const data = JSON.parse(saved!);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0].type).toBe('browser');
  });
});
