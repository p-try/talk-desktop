/*
 * @copyright Copyright (c) 2022 Grigorii Shartsev <grigorii.shartsev@nextcloud.com>
 *
 * @author Grigorii Shartsev <grigorii.shartsev@nextcloud.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

require('dotenv').config()

const path = require('node:path')
const webpack = require('webpack')
const { mergeWithRules } = require('webpack-merge')

const TALK_PATH = path.resolve(__dirname, process.env.TALK_PATH ?? 'spreed')

/**
 * appName and appVersion constants are set by process.env.npm_package_* in @nextcloud/webpack-vue-config.
 * During build in this project, env variables will be different and constants will be incorrect.
 * To keep values correct - set implicitly.
 */
const talkPackage = require(`${TALK_PATH}/package.json`)
process.env.npm_package_name = talkPackage.name
process.env.npm_package_version = talkPackage.version

const nextcloudWebpackConfig = require('@nextcloud/webpack-vue-config')
const commonTalkWebpackConfig = require(`${TALK_PATH}/webpack.common.config`)

/**
 * Create webpack aliases config to patch a package
 *
 * @param {string} packageName - name of the package to patch, for example, @nextcloud/axios
 * @return {Object<string, string>} webpack.resolve.alice config object with at most 3 aliases:
 *                                  - Alias from package to the patcher (e.g. @nextcloud/axios)
 *                                  - Alias to the original module in spreed (e.g. @talk-modules--@nextcloud/axios)
 *                                  - Alias to the original module in talk-desktop (e.g. @desktop-modules--@nextcloud/axios)
 */
function createPatcherAliases(packageName) {
	// Try to resolve a package. If it throws then there is no such package, do not create an alias
	let talkModulePath = false
	try {
		talkModulePath = require.resolve(packageName, { paths: [TALK_PATH] })
	} catch {}

	let desktopModulePath = false
	try {
		desktopModulePath = require.resolve(packageName)
	} catch {}

	// webpack.resolve.aliases
	return {
		[`${packageName}$`]: path.resolve(__dirname, `src/patchers/${packageName}.js`),
		[`@talk-modules--${packageName}$`]: talkModulePath,
		[`@desktop-modules--${packageName}$`]: desktopModulePath,
	}
}

const webpackRendererConfig = mergeWithRules({
	module: {
		rules: {
			test: 'match',
			use: 'merge',
			loader: 'replace',
			options: 'replace',
		},
	},
})(commonTalkWebpackConfig, {
	output: {
		assetModuleFilename: '[name][ext]?v=[contenthash]',
	},

	module: {
		rules: [
			/**
			 * With Electron we can use the most modern features,
			 * But with web client - we cannot.
			 * Replace target to support Top-level await
			 */
			{
				test: /\.js$/,
				loader: 'esbuild-loader',
				options: {
					loader: 'js',
					target: 'es2022',
				},
			},
			{
				test: /\.worker\.js$/,
				use: {
					loader: 'worker-loader',
					options: {
						/**
						 * By default, webpack loads async js to new sub-folder, same as new entrypoint.
						 * It brakes loading wasm resources from talk's Web Worker, expecting it to be in the same path.
						 * To fix - load worker the same way as asset/resources - to the root.
						 */
						filename: '[name].js?v=[contenthash]',
					},
				},
			},
			{
				test: /\.ogg$/,
				type: 'asset/resource',
			},
		],
	},

	resolve: {
		alias: {
			'@talk': TALK_PATH,
			...createPatcherAliases('@nextcloud/initial-state'),
			...createPatcherAliases('@nextcloud/axios'),
			...createPatcherAliases('@nextcloud/router'),
			...createPatcherAliases('@nextcloud/auth'),
			...createPatcherAliases('@nextcloud/notify_push'),
		},
	},

	plugins: [
		// TODO: Figure out, why plugins (VueLoaderPlugin) cannot be reused in spreed/webpack.common.config.js
		...nextcloudWebpackConfig.plugins,

		new webpack.DefinePlugin({
			IS_DESKTOP: true,
			'process.env.NEXTCLOUD_DEV_SERVER_HOSTS': JSON.stringify(process.env.NEXTCLOUD_DEV_SERVER_HOSTS),
		}),
	],
})

module.exports = webpackRendererConfig
