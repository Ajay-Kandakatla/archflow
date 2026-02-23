import { test, expect, placeNode } from './fixtures';

/**
 * Toolbar, Export, Templates & Misc UI Tests
 * Verifies topbar controls, template modal, file input, toast, and auto-save.
 */
test.describe('Export & Save Buttons', () => {
  test('has share button', async ({ appPage }) => {
    await expect(appPage.locator('.btn-share')).toBeVisible();
  });

  test('has save button in topbar', async ({ appPage }) => {
    await expect(appPage.locator('.topbar .btn-save')).toBeVisible();
  });
});

test.describe('Template Modal', () => {
  test('opens via template button', async ({ appPage }) => {
    await appPage.click('.btn-templates');
    await expect(appPage.locator('.template-modal-overlay')).toBeVisible();
  });
});

test.describe('File Input', () => {
  test('has hidden file input for image upload', async ({ appPage }) => {
    const input = appPage.locator('#imageFileInput');
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute('accept', 'image/*');
    await expect(input).toHaveCSS('display', 'none');
  });
});

test.describe('Toast', () => {
  test('has toast element', async ({ appPage }) => {
    await expect(appPage.locator('.toast')).toHaveCount(1);
  });
});

test.describe('Auto-Save', () => {
  test('persists diagram to localStorage', async ({ appPage }) => {
    await placeNode(appPage, 'browser');
    await appPage.waitForTimeout(3000); // Wait for auto-save (2s debounce + buffer)

    const saved = await appPage.evaluate(() => localStorage.getItem('archflow-local-diagram'));
    expect(saved).toBeTruthy();
    const data = JSON.parse(saved!);
    expect(data.nodes.length).toBe(1);
    expect(data.nodes[0].type).toBe('browser');
  });
});
