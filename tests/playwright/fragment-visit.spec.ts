import { test, expect } from '@playwright/test';

import { clickOnLink, expectToBeAt } from './inc/commands.js';
import { expectSwupAnimationDuration, navigateWithSwup } from './inc/swup.js';
import { prefixed } from './inc/utils.js';

const url = prefixed('/');

test.describe('replace fragments', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/list/');
	});

	test('should be at home', async ({ page }) => {
		await expectToBeAt(page, '/list/', 'List');
	});
});
