/**
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import '@talk/css/icons.css'
import './assets/styles.css'

import 'regenerator-runtime' // TODO: Why isn't it added on bundling
import {
	initLocalStyles,
	initPlaySoundManagementOnUserStatus,
	initServerStyles,
	initTalkHashIntegration,
} from './init.js'
import { setupWebPage } from '../../shared/setupWebPage.js'
import { createViewer } from './Viewer/Viewer.js'
import { createDesktopApp } from './desktop.app.js'

// Initially open the welcome page, if not specified
if (!window.location.hash) {
	window.location.hash = '#/apps/spreed'
}

await setupWebPage()

await initServerStyles()
await initLocalStyles()
initPlaySoundManagementOnUserStatus()

createDesktopApp()

window.OCA.Viewer = createViewer()

await import('@talk/src/main.js')

initTalkHashIntegration(window.OCA.Talk.instance)

window.OCA.Talk.Desktop.talkRouter.value = window.OCA.Talk.instance.$router

await import('./notifications/notifications.store.js')
