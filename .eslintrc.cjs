module.exports = {
	root: true,

	// Keep variables sorted within groups (separated by "// ..." comment lines)
	globals: {
		// SugarCube APIs
		Browser: "readonly",
		Config: "readonly",
		DebugView: "readonly",
		Dialog: "readonly",
		Engine: "readonly",
		Fullscreen: "readonly",
		Has: "readonly",
		L10n: "readonly",
		l10nStrings: "readonly",
		LoadScreen: "readonly",
		Macro: "readonly",
		Save: "readonly",
		Scripting: "readonly",
		Setting: "readonly",
		setup: "readonly",
		State: "readonly",
		Story: "readonly",
		SugarCube: "readonly",
		Template: "readonly",
		UI: "readonly",
		UIBar: "readonly",
		Wikifier: "readonly",
		// SugarCube functions
		clone: "readonly",
		either: "readonly",
		forget: "readonly",
		hasVisited: "readonly",
		importScripts: "readonly",
		importStyles: "readonly",
		lastVisited: "readonly",
		memorize: "readonly",
		passage: "readonly",
		previous: "readonly",
		random: "readonly",
		randomFloat: "readonly",
		recall: "readonly",
		setPageElement: "readonly",
		tags: "readonly",
		temporary: "readonly",
		time: "readonly",
		turns: "readonly",
		variables: "readonly",
		visited: "readonly",
		visitedTags: "readonly",
		throwError: "writable",
		/*
		 * Everything below is ours. Every `.js` file under game/ is concatenated into one script block
		 * by tweego and shares a single scope, so cross-file references are globals by design rather
		 * than an oversight — they have to be declared here or ESLint flags each one as undefined.
		 * Add to this list as you add namespaces.
		 */

		// Variable shortcuts
		C: "readonly",
		T: "readonly",
		V: "readonly",
		// Framework namespaces
		Cafeteria: "readonly",
		CalebBreakfast: "readonly",
		ClassLesson: "readonly",
		Constants: "readonly",
		ConstantsLoader: "readonly",
		Cooking: "readonly",
		defineGlobalNamespaces: "readonly",
		DOD: "readonly",
		Errors: "readonly",
		Flags: "readonly",
		GameSettings: "readonly",
		Inventory: "readonly",
		Journal: "readonly",
		KitchenFlavor: "readonly",
		LinkNumberify: "readonly",
		LoveInterests: "readonly",
		MathClass: "readonly",
		Money: "readonly",
		Options: "readonly",
		Perflog: "readonly",
		PhysicsClass: "readonly",
		Player: "readonly",
		Pronouns: "readonly",
		SavesUI: "readonly",
		School: "readonly",
		Skills: "readonly",
		Social: "readonly",
		StartConfig: "readonly",
		Stats: "readonly",
		TechClass: "readonly",
		Theme: "readonly",
		Tips: "readonly",
		Utils: "readonly",
		Versions: "readonly",
		World: "readonly",
		// Helper functions
		basicDrunkCss: "readonly",
		basicHypnoCss: "readonly",
		basicJitterCss: "readonly",
		between: "readonly",
		DefineMacro: "readonly",
		DefineMacroS: "readonly",
		element: "readonly",
		ensure: "readonly",
		ensureIsArray: "readonly",
		getRandomIntInclusive: "readonly",
		pickRandomItemInArray: "readonly",
		selfOr: "readonly",
		stringFrom: "readonly",
		// Classes
		ObservableValue: "readonly",
	},

	ignorePatterns: [
		"**/*.*",
		"!**/*.js",
		"!**/*.cjs",
		"!**/*.mjs",
		// Format config file
		"!.eslintrc.cjs",
		"node_modules",
		"devTools",
		"dist",
		"game/03-JavaScript/external",
	],

	parserOptions: {
		// Support back to ES2019 to cover old mobile devices with outdated WebView versions that fail on 2020 and up functions
		// ecmaVersion: "2019", (taken care of by env es2019)
		sourceType: "module",
	},

	env: {
		browser: true,
		es2019: true,
		jquery: true,
	},

	plugins: ["es"],

	extends: ["eslint:recommended", "plugin:jsdoc/recommended", "prettier-standard/prettier-file", "plugin:es/restrict-to-es2019"],

	settings: {
		jsdoc: {
			mode: "jsdoc",
		},
	},

	// Keep rules grouped by plugin and sorted alphabetically
	rules: {
		"object-shorthand": ["error", "always"],

		// SugarCube extends native objects and we follow it
		"no-extend-native": "off",

		/* eslint-plugin-jsdoc */

		// Descriptions should be sentence-like not comment-like
		"jsdoc/require-description-complete-sentence": "off",
		"jsdoc/require-hyphen-before-param-description": ["error", "never", { tags: { property: "never" } }],
		// Adding JSDoc is preferable but not required
		"jsdoc/require-jsdoc": "off",
		// Doc comments carry the note about what a method does; signatures speak for themselves
		"jsdoc/require-param": "off",
		"jsdoc/require-param-description": "off",
		"jsdoc/require-param-type": "off",
		"jsdoc/require-property-description": "off",
		"jsdoc/require-returns-description": "off",
		"jsdoc/require-returns": "off",
		"jsdoc/require-returns-type": "off",

		/* eslint-plugin-prettier */

		"prettier/prettier": "warn",

		// Safari/WebKit did not support lookbehind until 16.4
		"es/no-regexp-lookbehind-assertions": "error",
	},

	overrides: [
		{
			/*
			 * Build tooling runs in Node, not in the browser, so the ES2019 ceiling that exists for old
			 * mobile WebViews does not apply. These rules have to be switched off explicitly: an
			 * override's `extends` adds to the root config rather than replacing it.
			 */
			files: ["tools/**/*.mjs"],
			env: { browser: false, node: true, es2022: true },
			parserOptions: { ecmaVersion: 2022, sourceType: "module" },
			rules: {
				"es/no-import-meta": "off",
				"es/no-dynamic-import": "off",
				"es/no-optional-chaining": "off",
				"es/no-nullish-coalescing-operators": "off",
			},
		},
	],
};
