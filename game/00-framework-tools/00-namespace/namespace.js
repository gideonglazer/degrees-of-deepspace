/**
 * Creates the DOD global namespace and the helper used to hang sub-namespaces off it.
 *
 * Every `.js` file under game/ is concatenated into one script block by tweego and shares a single
 * scope, so "namespace" here means one frozen container on `window` rather than a module system.
 * This file sorts first under 00-framework-tools, so it runs before anything that needs it.
 */

(function () {
	"use strict";

	/**
	 * Defines a namespace at the given dotted path, creating intermediate objects as needed.
	 * Re-defining an existing path merges into it instead of replacing, so a namespace can be
	 * extended from several files.
	 *
	 * @param {string} path Dotted path relative to window, e.g. "DOD.Ship".
	 * @param {object} [members] Properties to merge into the namespace.
	 * @returns {object} The namespace object.
	 */
	function defineGlobalNamespaces(path, members) {
		const parts = String(path).split(".");
		let target = window;

		parts.forEach(part => {
			if (!Object.prototype.hasOwnProperty.call(target, part) || typeof target[part] !== "object" || target[part] === null) {
				Object.defineProperty(target, part, {
					value: {},
					writable: true,
					enumerable: true,
					configurable: true,
				});
			}
			target = target[part];
		});

		if (members) Object.assign(target, members);
		return target;
	}

	window.defineGlobalNamespaces = defineGlobalNamespaces;

	defineGlobalNamespaces("DOD", {
		/** Set from StartConfig once game/01-config has loaded. */
		version: "0.0.0",
	});
})();
