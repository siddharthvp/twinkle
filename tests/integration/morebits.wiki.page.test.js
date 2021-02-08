const fs = require('fs');
const {mwn: Mwn} = require('mwn');

/* globals jest, describe, test, beforeAll, jestPuppeteer, page, browser, context */

/**
 * Code inside page.evaluate(() => {...}) block is executed inside the headless browser.
 * It can make use of mw.* and Morebits itself. But do not make Jest assertions in this context.
 * Mwn bot library is used for making test assertions to avoid the need to screen-scrape
 * using puppeteer.
 */

describe('Morebits.wiki.api and Morebits.wiki.page', () => {
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
		// Also load expect in the browser context so that we can make expect assertions in browser context too
		// However, note that these if these fail, no meaningful logging error messages may be displayed in the
		// console. Due to this, minimise use of browser context assertions as far as possible.
		await page.evaluate(() => {
			return $.getScript('https://cdnjs.cloudflare.com/ajax/libs/expect/1.20.2/expect.min.js');
		});

		// Load morebits code in the node context too, along with jsdom and jquery
		// You saw this coming, right?
		require('../unit/mocking/mb_repl');

		// Inject some functions from node context into the browser context. Untested whether these
		// work as intended.
		await page.exposeFunction('notCalled', notCalled);
		await page.exposeFunction('sleep', sleep);

		// Log in the external API client to observe changes
		mwn = new Mwn({
			apiUrl: 'http://localhost:8080/api.php',
			username: 'Wikiuser@bp',
			password: '12345678901234567890123456789012' // BotPassword configured in setup.sh
		});
		await mwn.loginGetToken();
	});

	describe('test environment set up correctly', () => {
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
	});

	describe('Morebits.wiki.api', () => {
		test('Api call works (formatversion 2 by default)', async () => {
			let result = await page.evaluate(() => {
				var a = new Morebits.wiki.api('Test API call', {
					action: 'query',
					format: 'json'
				});
				return a.post().then(function (apiobj) {
					return apiobj.getResponse();
				});
			});
			expect(result).toEqual({batchcomplete: true});
		});
		test('Api call works (formatversion 1)', async () => {
			let result = await page.evaluate(() => {
				var a = new Morebits.wiki.api('Test API call', {
					action: 'query',
					format: 'json',
					formatversion: 1
				});
				return a.post().then(function (apiobj) {
					expect(apiobj instanceof Morebits.wiki.api).toBe(true);
					return apiobj.getResponse();
				});
			});
			expect(result).toEqual({batchcomplete: ''});
		});
		test('Api call works (xml format)', async () => {
			let batchcomplete = await page.evaluate(() => {
				var a = new Morebits.wiki.api('Test API call', {
					action: 'query',
					format: 'xml'
				});
				return a.post().then(function (apiobj) {
					var response = apiobj.getResponse();
					expect(response instanceof XMLDocument).toBe(true);
					return $(response).find('api').attr('batchcomplete');
				});
			});
			expect(batchcomplete).toBe('');
		});
	});

	describe('Morebits.wiki.page', () => {

		test('load', async () => {
			let pagetext = await page.evaluate(() => {
				var d = $.Deferred();
				var p = new Morebits.wiki.page('Main Page');
				p.load(function(pageobj) {
					d.resolve(pageobj.getPageText());
				}, d.reject);
				return d;
			});
			expect(typeof pagetext).toBe('string');
			expect(pagetext.length).toBeGreaterThan(500);
		});
		// test('fails to load a page with bad name', async () => {
		// 	// try{
		// 		let result = await page.evaluate(() => {
		// 			var d = $.Deferred();
		// 			var p = new Morebits.wiki.page('<scrip'); // invalid page name
		// 			p.load(d.resolve, d.reject);
		// 			return d;
		// 		});
		// 		console.log(result);
		// 	// } catch (err) {
		// 	// 	console.log(err);
		// 	// }
		// });
		test('prepend', async () => {
			let randomPage = 'Prepend test page/' + Math.random();
			await mwn.create(randomPage, 'Test page.');
			await page.evaluate((randomPage) => {
				var d = $.Deferred();
				var p = new Morebits.wiki.page(randomPage);
				p.setPrependText('Prepended text. ');
				p.setEditSummary('Testing');
				p.prepend(d.resolve, d.reject);
				return d;
			}, randomPage);
			let pagetext = (await mwn.read(randomPage)).revisions[0].content;
			expect(pagetext).toBe('Prepended text. Test page.');
		});
		test('append', async () => {
			let randomPage = 'Append test page/' + Math.random();
			await page.evaluate((randomPage) => {
				var d = $.Deferred();
				var p = new Morebits.wiki.page(randomPage);
				p.setAppendText('Testing 123');
				p.setEditSummary('Testing');
				p.append(d.resolve, d.reject);
				return d;
			}, randomPage);
			let pagetext = (await mwn.read(randomPage)).revisions[0].content;
			expect(pagetext).toBe('Testing 123');
		});
		test('deletePage', async () => {
			let randomPage = 'Delete test page/' + Math.random();
			await mwn.create(randomPage, 'Test page'); // create the page first to delete it
			await page.evaluate((randomPage) => {
				var d = $.Deferred();
				var p = new Morebits.wiki.page(randomPage);
				p.setEditSummary('Testing');
				p.deletePage(d.resolve, d.reject);
				return d;
			}, randomPage);
			expect((await mwn.read(randomPage)).missing).toBe(true);
		});
	});

});

