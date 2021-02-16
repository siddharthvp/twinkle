/* eslint-disable */

module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			launchOptions: {
				// switch this to false for debugging
				headless: true
			},
			// for debugging, you really just want one browser
			browsers: ['chromium', 'firefox', 'webkit']
		}
	}
}
