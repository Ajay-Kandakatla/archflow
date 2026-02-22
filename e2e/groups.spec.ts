import { test, expect, placeGroup } from './fixtures';

/**
 * Group Container Tests
 * Verifies group placement, title, delete, and ungroup controls.
 */
test.describe('Group Containers', () => {
  test('places a group on canvas via click', async ({ appPage }) => {
    await placeGroup(appPage, 'blue');
    await expect(appPage.locator('.group-container')).toHaveCount(1);
  });

  test('group has editable title input', async ({ appPage }) => {
    await placeGroup(appPage, 'blue');
    const group = appPage.locator('.group-container').first();
    await expect(group.locator('.group-container-title')).toBeVisible();
  });

  test('group shows delete button on hover', async ({ appPage }) => {
    await placeGroup(appPage, 'blue');
    const group = appPage.locator('.group-container').first();
    await group.hover();
    await expect(group.locator('.group-container-delete')).toBeVisible();
  });

  test('group shows ungroup button on hover', async ({ appPage }) => {
    await placeGroup(appPage, 'blue');
    const group = appPage.locator('.group-container').first();
    await group.hover();
    await expect(group.locator('.group-container-ungroup')).toBeVisible();
  });
});
