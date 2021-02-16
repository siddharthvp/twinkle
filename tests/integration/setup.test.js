// Jest globals
/* globals jest, describe, test, beforeAll */

// jest-playwright globals
/* globals jestPlaywright, page, browser, context, browserName, deviceName */

// Custom globals defined in jest-environment.js
/* globals mwn, mwn2 */

/**
 * Code inside page.evaluate(() => {...}) block is executed inside the headless browser.
 * It can make use of mw.* and Morebits itself. But do not make Jest assertions in this context.
 * Mwn bot library is used for making test assertions to avoid the need to screen-scrape
 * using puppeteer.
 */

/**
 * GUIDELINES FOR WRITING TESTS:
 * 1.	Don't rely on the existence of any page, except the Main Page (and don't do any write
 * 		actions on the Main Page). No test should rely on resources created by another test.
 * 		Each test should be independent.
 * 2. 	While creating pages, always included a random part in the name so that running the
 * 		test multiple times on the the same MW instance doesn't cause issues.
 * 3. 	Expect statements in browser context should only be for checking instance type for
 * 		non-serializable objects. For everything else export them to the node.js context and
 * 		then expect() on it.
 */

// This file is only for debugging purposes.

describe('Test correct environment setup', () => {
	jest.setTimeout(10000);

	test('page should be titled "Wikipedia"', async () => {
		await expect(page.title()).resolves.toMatch('Wikipedia');
	});

	test('we are logged in', async () => {
		let wgUser = await page.evaluate(() => {
			return mw.config.get('wgUserName');
		});
		expect(wgUser).toBe('Wikiuser');
	});

	test('Morebits is usable', async () => {
		let isSysop = await page.evaluate(() => {
			return Morebits.userIsSysop;
		});
		expect(isSysop).toBe(true);
	})

});

