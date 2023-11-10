import { cpSync, rmSync } from 'node:fs';

const options = { recursive: true };
const fixturesDir = './tests/fixtures';

export default () => {
	rmSync('./tests/fixtures/dist/', options);
	cpSync('./node_modules/', `${fixturesDir}/dist/node_modules/`, options);
	cpSync('./dist/', `${fixturesDir}/dist/fragment-plugin/`, options);
};
