/* eslint-disable */

module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironmentOptions: {
		'jest-playwright': {
			launchOptions: {
				// switch this to false for debugging
				headless: false
			},
			browsers: ['chromium'],//, 'firefox', 'webkit'],
			skipInitialization: true,
			debugOptions: {
				browsers: ['chromium'],
				skipInitialization: true,
				launchOptions: {
					headless: false,
					devtools: true
				}
			}
		}
	}
}
