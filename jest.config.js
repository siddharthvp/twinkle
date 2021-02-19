/* eslint-disable */

module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			launchOptions: {
				// switch this to false for debugging
				headless: true
			},
			browsers: ['chromium', 'firefox', 'webkit']
		}
	}
}
