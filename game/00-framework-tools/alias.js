/**
 * Short accessors for the objects touched most often.
 *
 * `State.variables` and `State.temporary` are replaced on every turn, so these must be functions
 * rather than cached references — `V()` re-reads the live object each call.
 */

(function () {
	"use strict";

	/**
	 * Story variables, the `$foo` namespace. Persisted in saves.
	 *
	 * @returns {object}
	 */
	window.V = function () {
		return State.variables;
	};

	/**
	 * Temporary variables, the `_foo` namespace. Discarded at the end of the passage.
	 *
	 * @returns {object}
	 */
	window.T = function () {
		return State.temporary;
	};

	/**
	 * Static game data. Never persisted, so it is safe to change between builds.
	 *
	 * @returns {object}
	 */
	window.C = function () {
		return window.Constants;
	};
})();
