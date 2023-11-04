import { test, expect } from '@playwright/test';

import { clickOnLink, expectToBeAt } from './inc/commands.js';
import { expectSwupAnimationDuration, navigateWithSwup } from './inc/swup.js';
import { prefixed } from './inc/utils.js';

const url = prefixed('/');

test.describe('replace fragments', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('hello world', async ({ page }) => {
		await expectToBeAt(page, '/page-1.html', 'Page 1');
	});
});
