/**
 * Registry for static game data — stat definitions, location tables, skill curves.
 *
 * Constants are deep-frozen on registration. That matters because SugarCube clones
 * `State.variables` every turn: anything mutable that leaks from here into a story variable gets
 * copied into every history state and then into the save file. Freezing turns that class of bug
 * into an immediate error instead of save bloat.
 *
 * Read via `C()` (see alias.js), e.g. `C().stats.oxygen.max`.
 */

defineGlobalNamespaces("Constants");
defineGlobalNamespaces("ConstantsLoader");

(function () {
	"use strict";

	/**
	 * Recursively freezes an object and everything it holds.
	 */
	function deepFreeze(value) {
		if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
		Object.getOwnPropertyNames(value).forEach(key => deepFreeze(value[key]));
		return Object.freeze(value);
	}

	/**
	 * Registers static data under a dotted path below `Constants`.
	 */
	function add(path, data) {
		const parts = String(path).split(".");
		const leaf = parts.pop();
		let target = Constants;

		parts.forEach(part => {
			if (typeof target[part] !== "object" || target[part] === null) target[part] = {};
			target = target[part];
		});

		if (Object.prototype.hasOwnProperty.call(target, leaf)) {
			Errors.report(`Constants.${path} is already defined; the second definition was ignored.`, "ConstantsLoader");
			return target[leaf];
		}

		target[leaf] = deepFreeze(data);
		return target[leaf];
	}

	/**
	 * Reads a dotted path, returning `fallback` when any step is missing. Prefer direct access
	 * (`C().stats.oxygen`) and reach for this only when the path is built at runtime.
	 */
	function get(path, fallback) {
		const found = String(path)
			.split(".")
			.reduce((node, part) => (node === undefined || node === null ? undefined : node[part]), Constants);
		return found === undefined ? fallback : found;
	}

	Object.assign(ConstantsLoader, { add, get, deepFreeze });
})();
