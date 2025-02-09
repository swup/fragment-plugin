#!/usr/bin/env node

// @ts-check

import { cpSync, rmSync } from 'node:fs';
const fixturesDir = './tests/fixtures';

export function prepare() {
	rmSync('./tests/fixtures/dist/', { recursive: true, force: true });
	cpSync('./node_modules/swup/dist/Swup.umd.js', `${fixturesDir}/dist/swup.umd.js`);
	cpSync('./dist/index.umd.js', `${fixturesDir}/dist/fragment-plugin.umd.js`);
}

prepare();
