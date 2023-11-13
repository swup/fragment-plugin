import { test, expect } from '@playwright/test';

import { clickOnLink, expectToBeAt } from './inc/commands.js';
import { expectSwupAnimationDuration, navigateWithSwup } from './inc/swup.js';
import { prefixed } from './inc/utils.js';

const url = prefixed('/');

test.describe('replace fragments', () => {
	test.beforeEach(async ({ page }) => {});

	test('should ignore visits without a matching rule', async ({ page }) => {
		await page.goto('/');
		const swupID = await page.locator('#swup').getAttribute('data-uniqueid');
		await clickOnLink(page, '/list/');
		await expectToBeAt(page, '/list/', 'List');
		/* #swup was replaced */
		await expect(page.locator('#swup')).not.toHaveAttribute('data-uniqueid', String(swupID));
	});

	test('should replace fragments', async ({ page }) => {
		await page.goto('/list/');
		const swupID = await page.locator('#swup').getAttribute('data-uniqueid');
		await clickOnLink(page, '/list/filter/red/');
		await expectToBeAt(page, '/list/filter/red/');
		await expect(page.locator('h2')).toHaveText('Red Items');
		/* #swup was left alone */
		await expect(page.locator('#swup')).toHaveAttribute('data-uniqueid', String(swupID));
	});

	test('should cache foreign fragments', async ({ page }) => {
		await page.goto('/list/');
		await clickOnLink(page, '/list/filter/green/');
		await clickOnLink(page, '/detail/');
		await clickOnLink(page, '/');
		await page.goBack();
		await expect(page.locator('#list h2')).toHaveText('Green Items');
	});
});
