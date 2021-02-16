const JestEnvironmentPlaywright = require('jest-playwright-preset');
const {mwn: Mwn} = require('mwn');
const fs = require('fs');

class CustomEnvironment extends JestEnvironmentPlaywright {
	constructor(config, context) {
		super(config, context);
	}

	async setup() {
		await super.setup();

		let page = this.global.page;

		// Log in. This is the only place where scraping should be necessary.
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

		// Load morebits code in the node context too, along with jsdom and jquery
		// You saw this coming, right?
		require(__dirname + '/../unit/mocking/mb_repl');

		// External API clients to make and observe changes
		let mwnConfig = {
			apiUrl: 'http://localhost:8080/api.php',
			password: '12345678901234567890123456789012' // BotPassword configured in setup.sh
		}
		this.global.mwn = new Mwn({ ...mwnConfig, username: 'Wikiuser@bp' });
		this.global.mwn2 = new Mwn({ ...mwnConfig, username: 'Wikiuser2@bp' });

		// the 2nd account needs to sign in only if required
		await this.global.mwn.login();

	}
}

module.exports = CustomEnvironment;
