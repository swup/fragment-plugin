import { test, expect } from '@playwright/test';

import {
	clickOnLink,
	waitForSwup,
	navigateWithSwup,
	scrollTo,
	expectScrollPosition
} from './inc/commands.js';

test.describe('Fragment Plugin', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForSwup(page);
	});

	test('should ignore visits without a matching rule', async ({ page }) => {
		const swupID = await page.locator('#swup').getAttribute('data-uniqueid');

		await clickOnLink(page, '/list/');

		/* #swup was replaced */
		await expect(page.locator('#swup')).not.toHaveAttribute('data-uniqueid', String(swupID));
	});

	test('should replace fragments', async ({ page }) => {
		await navigateWithSwup(page, '/list/');

		const swupID = await page.locator('#swup').getAttribute('data-uniqueid');
		const listID = await page.locator('#list').getAttribute('data-uniqueid');

		await navigateWithSwup(page, '/list/filter/red/');
		await expect(page).toHaveURL('/list/filter/red/');
		await expect(page.locator('h2')).toHaveText('Red Items');

		/* #swup was left alone */
		expect(await page.locator('#swup').getAttribute('data-uniqueid')).toBe(swupID);
		/* #list was replaced */
		expect(await page.locator('#list').getAttribute('data-uniqueid')).not.toBe(listID);
	});

	test('should cache foreign fragments', async ({ page }) => {
		await page.goto('/list/');

		await clickOnLink(page, '/list/filter/green/');
		await clickOnLink(page, '/detail/');
		await clickOnLink(page, '/');
		await page.goBack();

		/* #list was updated in the cache of /detail/ */
		await expect(page.locator('#list h2')).toHaveText('Green Items');
	});

	test('should handle <dialog[open]> fragments', async ({ page }) => {
		await page.goto('/list/');

		await clickOnLink(page, '/detail/');

		const dialog = page.locator('dialog[data-swup-fragment]');

		await expect(dialog).toBeVisible();

		// Check if the dialog is focussed
		await expect(dialog).toBeFocused();

		// Check if the dialog is in the top layer
		expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
	});

	test('should not scroll', async ({ page }) => {
		await page.goto('/list/');

		await scrollTo(page, 100);

		await navigateWithSwup(page, '/list/filter/green/');

		await expectScrollPosition(page, 100);
	});
});
