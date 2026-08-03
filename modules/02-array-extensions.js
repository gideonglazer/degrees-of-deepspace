/**
 * Array helpers used throughout game/. SugarCube already extends Array with random(), pluck(),
 * shuffle(), delete() and friends, so check its docs before adding anything here.
 */

Object.defineProperties(Array.prototype, {
	/**
	 * Sum of the array, optionally mapped first.
	 *
	 * @param {Function} [mapper] Receives (value, index) and returns a number.
	 * @returns {number}
	 */
	sum: {
		configurable: true,
		writable: true,
		value(mapper) {
			return this.reduce((total, value, index) => total + (mapper ? Number(mapper(value, index)) : Number(value)), 0);
		},
	},

	/**
	 * Groups entries into an object keyed by the result of `keyOf`.
	 *
	 * @param {Function|string} keyOf Property name, or a function receiving (value, index).
	 * @returns {Object<string, Array>}
	 */
	groupBy: {
		configurable: true,
		writable: true,
		value(keyOf) {
			const pick = typeof keyOf === "function" ? keyOf : value => value[keyOf];
			return this.reduce((groups, value, index) => {
				const key = pick(value, index);
				(groups[key] = groups[key] || []).push(value);
				return groups;
			}, {});
		},
	},

	/**
	 * Removes duplicates, comparing by the result of `keyOf` when given. Keeps the first occurrence.
	 *
	 * @param {Function|string} [keyOf] Property name, or a function receiving (value, index).
	 * @returns {Array}
	 */
	unique: {
		configurable: true,
		writable: true,
		value(keyOf) {
			if (!keyOf) return Array.from(new Set(this));
			const pick = typeof keyOf === "function" ? keyOf : value => value[keyOf];
			const seen = new Set();
			return this.filter((value, index) => {
				const key = pick(value, index);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		},
	},

	/**
	 * The entry with the highest `scoreOf`, or undefined when the array is empty.
	 *
	 * @param {Function} scoreOf Receives (value, index) and returns a number.
	 * @returns {*}
	 */
	maxBy: {
		configurable: true,
		writable: true,
		value(scoreOf) {
			let best;
			let bestScore = -Infinity;
			this.forEach((value, index) => {
				const score = Number(scoreOf(value, index));
				if (score > bestScore) {
					bestScore = score;
					best = value;
				}
			});
			return best;
		},
	},
});
