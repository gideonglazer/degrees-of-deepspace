/**
 * Story flags for one-shot events and lasting progress markers.
 */

defineGlobalNamespaces("Flags");

(function () {
	"use strict";

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.flags || typeof vars.flags !== "object") {
			vars.flags = {};
		}
		return vars.flags;
	}

	function get(id, variables) {
		return !!ensure(variables)[String(id)];
	}

	function set(id, value, variables) {
		const flags = ensure(variables);
		flags[String(id)] = value === undefined ? true : !!value;
		return flags[String(id)];
	}

	function clear(id, variables) {
		const flags = ensure(variables);
		const key = String(id);
		if (!(key in flags)) return false;
		delete flags[key];
		return true;
	}

	Object.assign(Flags, {
		ensure,
		get,
		set,
		clear,
	});
})();
