import { expect, Page } from '@playwright/test';

declare global {
	interface Window {
		_swup: Swup;
		data: any;
	}
}

import type Swup from 'swup';

export async function waitForSwup(page: Page) {
	await page.waitForSelector('html.swup-enabled');
}

export function sleep(timeout = 0): Promise<void> {
	return new Promise((resolve) => setTimeout(() => resolve(undefined), timeout));
}

export async function clickOnLink(page: Page, url: string, options?: Parameters<Page['click']>[1]) {
	await page.click(`a[href="${url}"]`, options);
	await expectToBeAt(page, url);
}

export async function navigateWithSwup(
	page: Page,
	url: string,
	options?: Parameters<Swup['navigate']>[1]
) {
	await page.evaluate(({ url, options }) => window._swup.navigate(url, options), {
		url,
		options
	});
	await expectToBeAt(page, url);
}

export async function expectScrollPosition(page: Page, expected: number) {
	const scrollY = await page.evaluate(() => window.scrollY);
	expect(scrollY).toBe(expected);
}

export async function expectToBeAt(page: Page, url: string) {
	await page.waitForSelector('html:not([aria-busy=true])', { timeout: 5000 });
	await expect(page).toHaveURL(url);
}

/**
 * Trim slashes from a string
 * @see https://stackoverflow.com/a/3840645/586823
 */
const trimSlashes = (str: string) => str.replace(/^\/|\/$/g, '');

/**
 * Create a function to prefix a path
 */
export const prefixed = (prefix: string) => {
	return (path: string) => `/${trimSlashes(prefix)}/${trimSlashes(path)}`;
};
