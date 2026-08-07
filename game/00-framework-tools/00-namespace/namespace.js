/**
 * Creates the DOD global namespace and the helper used to hang sub-namespaces off it.
 */

(function () {
	"use strict";

	/**
	 * Defines a namespace at the given dotted path, creating intermediate objects as needed.
	 * Re-defining an existing path merges into it instead of replacing, so a namespace can be
	 * extended from several files.
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
		version: "0.0.0",
	});
})();
