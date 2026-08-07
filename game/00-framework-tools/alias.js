/**
 * Short accessors for the objects touched most often.
 */

(function () {
	"use strict";

	/**
	 * Story variables, the `$foo` namespace. Persisted in saves.
	 */
	window.V = function () {
		return State.variables;
	};

	/**
	 * Temporary variables, the `_foo` namespace. Discarded at the end of the passage.
	 */
	window.T = function () {
		return State.temporary;
	};

	/**
	 * Static game data. Never persisted, so it is safe to change between builds.
	 */
	window.C = function () {
		return window.Constants;
	};
})();
