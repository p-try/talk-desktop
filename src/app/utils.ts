/*
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { BrowserWindow } from 'electron'
import { screen } from 'electron'
import { getAppConfig } from './AppConfig.ts'

/**
 * Get the scaled window size based on the current zoom factor
 * @param size - Base window size
 * @param size.width - Base window width
 * @param size.height - Base window height
 * @param limit - Limit the window size to the screen size
 */
export function getScaledWindowSize({ width, height }: { width: number, height: number }, limit = true) {
	const zoomFactor = getAppConfig('zoomFactor')

	const windowWidth = Math.round(width * zoomFactor)
	const windowHeight = Math.round(height * zoomFactor)

	if (limit) {
		const primaryDisplay = screen.getPrimaryDisplay()
		const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

		return {
			width: Math.min(windowWidth, screenWidth),
			height: Math.min(windowHeight, screenHeight),
		}
	}

	return {
		width: windowWidth,
		height: windowHeight,
	}
}

/**
 * Get the scaled window minimum size based on the current zoom factor
 * @param minSize - Base window minimum size
 * @param minSize.minWidth - Base window minimum width
 * @param minSize.minHeight - Base window minimum height
 * @param limit - Limit the window size to the screen size
 */
export function getScaledWindowMinSize({ minWidth, minHeight }: { minWidth: number, minHeight: number }, limit = true) {
	const { width, height } = getScaledWindowSize({ width: minWidth, height: minHeight }, limit)
	return {
		minWidth: width,
		minHeight: height,
	}
}

/**
 * Set initial zoom on a window.
 * According to the documentation, an initial zoom factor can be set with webPreferences.zoomFactor.
 * But it is ignored when Chromium has its own zoom state or when Zoom is 100%.
 * It only applies correctly if set after the window is ready to show.
 * See: https://github.com/electron/electron/issues/10572
 * @param window - Browser window
 */
export function applyZoom(window: BrowserWindow) {
	const zoomFactor = getAppConfig('zoomFactor')
	window.once('ready-to-show', () => {
		window.webContents.setZoomFactor(zoomFactor)
	})
}
