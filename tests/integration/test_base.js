const fs = require('fs');
const {mwn: Mwn} = require('mwn');
const playwright = require('playwright');

// External API clients to make and observe changes
let mwnConfig = {
	apiUrl: 'http://localhost:8080/api.php',
	password: '12345678901234567890123456789012' // BotPassword configured in setup.sh
}

const mwn = new Mwn({ ...mwnConfig, username: 'Wikiuser@bp' });
const mwn2 = new Mwn({ ...mwnConfig, username: 'Wikiuser2@bp' });

function setupMwn() {
	// Don't login again if already logged in (from another file)
	if (!mwn.loggedIn) {
		// Login the 1st account. The 2nd account needs to sign in only if required
		return mwn.login();
	}
}

let page, browser, context;

async function setupBrowser() {
	if (page) { // page is already setup
		return;
	}
	const env = await jestPlaywright.configSeparateEnv(
		require(__dirname + '/../../jest.config.js').testEnvironmentOptions['jest-playwright']
	);
	page = env.page;
	browser = env.browser
	context = env.context;
	// browser = await playwright[browserName].launch(jestPlaywright.configSeparateEnv());
	// page = await browser.newPage();
	await page.goto('http://localhost:8080/index.php?title=Special:UserLogin');
	await page.fill('#wpName1', 'Wikiuser');
	await page.fill('#wpPassword1', 'wikipassword');
	await Promise.all([
		page.click('#wpLoginAttempt'), // Clicking the link will cause a navigation
		page.waitForNavigation(), // The promise resolves after navigation has finished
	]);

	// Load morebits code in browser context
	await page.evaluate(fs.readFileSync(__dirname + '/../../morebits.js').toString());
	// Also load expect in the browser context so that we can make expect assertions in browser context too
	// However, note that these if these fail, no meaningful logging error messages may be displayed in the
	// console. Due to this, minimise use of browser context assertions as far as possible.
	await page.evaluate(() => {
		return $.getScript('https://cdnjs.cloudflare.com/ajax/libs/expect/1.20.2/expect.min.js');
	});
}

// Load morebits code in the node context too, along with jsdom and jquery
require(__dirname + '/../unit/mocking/mb_repl');

async function teardown() {
	// await page.close();
	// await browser.close();
}

module.exports = { page, browser, context, mwn, mwn2, setupMwn, setupBrowser, teardown };
