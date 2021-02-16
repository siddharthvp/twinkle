/* eslint-disable */

module.exports = {
	preset: 'jest-playwright-preset',
	testEnvironment: './tests/integration/jest-environment.js',
	testEnvironmentOptions: {
		'jest-playwright': {
			launchOptions: {
				// switch this to false for debugging
				headless: true
			},
			browsers: ['chromium', /*'firefox', 'webkit'*/]
		}
	}
}
