import { describe, expect, it, vi, afterEach } from 'vitest';
import Swup from 'swup';
import type { PageData } from 'swup';
import { JSDOM } from 'jsdom';
import SwupFragmentPlugin from '../../../src/index.js';
import type { Options } from '../../../src/inc/defs.js';

export const getHtml = (body: string): string => {
	return /*html*/ `
		<!DOCTYPE html>
		<body>
			${body}
		</body>
	`;
};

type DocumentOptions = {
	url: string;
};

/**
 * Stub the global document with
 *
 * - custom body HTML
 * - a custom URL
 *
 * @see https://github.com/jsdom/jsdom#reconfiguring-the-jsdom-with-reconfiguresettings
 */
export const stubGlobalDocument = (body: string, options: Partial<DocumentOptions> = {}): void => {
	const baseURI = 'https://example.com';
	const defaults: DocumentOptions = {
		url: '/'
	};
	const settings: DocumentOptions = { ...defaults, ...options };

	const dom = new JSDOM(getHtml(body));
	dom.reconfigure({ url: `${baseURI}${settings.url}` });

	vi.stubGlobal('location', dom.window.location);
	vi.stubGlobal('document', dom.window.document);
};

export const getPluginInstance = (options: Partial<Options> = {}): SwupFragmentPlugin => {
	const defaults = {
		rules: [],
		debug: true
	};
	const fragmentPlugin = new SwupFragmentPlugin({ ...defaults, ...options });
	new Swup({ plugins: [fragmentPlugin] });
	return fragmentPlugin;
};
