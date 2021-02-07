const fs = require('fs');
const {mwn: Mwn} = require('mwn');

/* globals jest, describe, test, beforeAll, jestPuppeteer, page, browser, context */

/**
 * Code inside page.evaluate(() => {...}) block is executed inside the headless browser.
 * It can make use of mw.* and Morebits itself. But do not make Jest assertions in this context.
 * Mwn bot library is used for making test assertions to avoid the need to screen-scrape
 * using puppeteer.
 */

describe('Morebits.wiki.page', () => {
	jest.setTimeout(10000);

	let mwn;
	let notCalled = () => expect(true).toBe(false);
	let sleep = (sec) => new Promise(rs => setTimeout(rs, sec * 1000));

	beforeAll(async () => {

		// Log in. This is the only place where scraping should be necessary.
		await page.goto('http://localhost:8080/index.php?title=Special:UserLogin');
		const frame = page.mainFrame();
		await frame.type('#wpName1', 'Wikiuser');
		await frame.type('#wpPassword1', 'wikipassword');
		await Promise.all([
			page.waitForNavigation(), // The promise resolves after navigation has finished
			page.click('#wpLoginAttempt'), // Clicking the link will cause a navigation
		]);

		// Load morebits code in browser context
		await page.evaluate(fs.readFileSync('./morebits.js').toString());

		// Inject some functions from node context into the browser context. Untested whether these
		// work as intended.
		await page.exposeFunction('notCalled', notCalled);
		await page.exposeFunction('stop', async () => await jestPuppeteer.debug());
		await page.exposeFunction('sleep', sleep);

		// Log in the external API client to observe changes
		mwn = new Mwn({
			apiUrl: 'http://localhost:8080/api.php',
			username: 'Wikiuser@bp',
			password: '12345678901234567890123456789012' // BotPassword configured in setup.sh
		});
		await mwn.loginGetToken();
	});

	// Before anything, check that the initialisations were done right
	test('page should be titled "Wikipedia"', async () => {
		await expect(page.title()).resolves.toMatch('Wikipedia');
	});
	test('we are logged in', async () => {
		let wgUser = await page.evaluate(() => {
			return mw.config.get('wgUserName');
		});
		expect(wgUser).toBe('Wikiuser');
	});


	test('append', async () => {
		await page.evaluate(async () => {
			var d = $.Deferred();
			var p = new Morebits.wiki.page('Test page');
			p.setAppendText('Testing 123');
			p.setEditSummary('Testing');
			p.append(d.resolve, d.reject);
			return d;
		});
		let pagetext = (await mwn.read('Test page')).revisions[0].content;
		expect(pagetext).toContain('Testing 123');
	});
	test('deletePage', async () => {
		await page.evaluate(async () => {
			var d = $.Deferred();
			var p = new Morebits.wiki.page('Test page');
			p.setEditSummary('Testing');
			p.deletePage(d.resolve, d.reject);
			return d;
		});
		expect((await mwn.read('Test page')).missing).toBe(true);
	});
});

