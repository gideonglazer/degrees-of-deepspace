/**
 * Number helpers used throughout game/. SugarCube already provides clamp(); the rest are ours.
 */

Object.defineProperties(Number.prototype, {
	/**
	 * Rounds to a fixed number of decimal places, returning a number rather than a string.
	 */
	roundTo: {
		configurable: true,
		writable: true,
		value(places) {
			const factor = Math.pow(10, places || 0);
			return Math.round(this * factor) / factor;
		},
	},

	/**
	 * Position of this number within [min, max] as a 0–1 fraction, clamped at both ends.
	 * Used for stat bars and threshold checks.
	 */
	fractionOf: {
		configurable: true,
		writable: true,
		value(min, max) {
			if (max === min) return 0;
			return Math.min(1, Math.max(0, (this - min) / (max - min)));
		},
	},

	/**
	 * Same as fractionOf but expressed as a whole percentage.
	 */
	percentOf: {
		configurable: true,
		writable: true,
		value(min, max) {
			return Math.round(this.fractionOf(min, max) * 100);
		},
	},
});
