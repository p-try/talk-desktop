/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { BrowserWindow } = require('electron')
const { getBrowserWindowIcon } = require('../shared/icons.utils.js')
const { isMac } = require('../app/system.utils.ts')
const { getScaledWindowSize, applyZoom } = require('../app/utils.ts')
const { getAppConfig } = require('../app/AppConfig.ts')

/**
 * @return {import('electron').BrowserWindow}
 */
function createWelcomeWindow() {
	const zoomFactor = getAppConfig('zoomFactor')
	const window = new BrowserWindow({
		...getScaledWindowSize({
			width: 300,
			height: 500,
		}, false),
		resizable: false,
		autoHideMenuBar: true,
		center: true,
		fullscreenable: false,
		titleBarStyle: 'hidden',
		show: false,
		useContentSize: true,
		webPreferences: {
			preload: WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY,
			zoomFactor,
		},
		icon: getBrowserWindowIcon(),
	})

	// Hide traffic light buttons on Mac
	if (isMac) {
		window.setWindowButtonVisibility(false)
	}

	applyZoom(window)

	window.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY)

	return window
}

module.exports = {
	createWelcomeWindow,
}
