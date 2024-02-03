declare var __DEV__: boolean
declare var __PROD__: boolean

declare var __SERVER__: boolean
declare var __CLIENT__: boolean

declare var __LAYOUT_REGEX__: RegExp
declare var __FRONTEND_INIT_REGEX__: RegExp

// these are only injected on the server
declare var __SRC__: sring
declare var __DIST__: string

// declare var __APP_URL__: string

declare module "*.vue" {
	import Vue from "vue"
	export default Vue
}

// declare module "*.png" {
// 	const value: string
// 	export default value
// }
