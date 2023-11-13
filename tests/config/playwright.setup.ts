import { cpSync, rmSync } from 'node:fs';

const options = { recursive: true };
const fixturesDir = './tests/fixtures';

export default () => {
	rmSync('./tests/fixtures/dist/', { ...options, force: true });
	// cpSync('./node_modules/', `${fixturesDir}/dist/node_modules/`, options);
	// cpSync('./dist/', `${fixturesDir}/dist/fragment-plugin/`, options);
	cpSync('./node_modules/swup/dist/Swup.umd.js', `${fixturesDir}/dist/swup.umd.js`);
	cpSync('./dist/index.umd.js', `${fixturesDir}/dist/fragment-plugin.umd.js`);
};
