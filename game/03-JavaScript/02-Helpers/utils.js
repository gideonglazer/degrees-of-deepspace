/**
 * Small helpers used across the codebase and from passage markup.
 *
 * These are attached to `window` rather than a namespace because passages call them inline
 * (`<<if between($stats.strain, 40, 60)>>`), where a namespace prefix would be noise.
 */

defineGlobalNamespaces("Utils");

(function () {
	"use strict";

	/**
	 * Inclusive range test.
	 */
	function between(value, min, max) {
		return value >= min && value <= max;
	}

	/**
	 * Random integer in [min, max]. Uses SugarCube's seeded PRNG so results replay identically from a
	 * save — never use Math.random() for anything that affects game state.
	 */
	function getRandomIntInclusive(min, max) {
		return random(Math.ceil(min), Math.floor(max));
	}

	/**
	 * A random entry, or undefined for an empty array.
	 */
	function pickRandomItemInArray(array) {
		if (!Array.isArray(array) || !array.length) return undefined;
		return array[getRandomIntInclusive(0, array.length - 1)];
	}

	/**
	 * Returns `value` unless it is null or undefined, in which case `fallback`.
	 * Unlike `||` this keeps 0 and "" intact, which matters for stats and labels.
	 */
	function selfOr(value, fallback) {
		return value === undefined || value === null ? fallback : value;
	}

	/**
	 * Throws when `value` is missing. Use for programmer errors — a passage naming a location that
	 * does not exist — where failing loudly beats rendering something subtly wrong.
	 */
	function ensure(value, message) {
		if (value === undefined || value === null) throw new Error(message);
		return value;
	}

	/**
	 * Wraps a non-array in an array; passes arrays through. Lets content authors write either
	 * `requires: "patchKit"` or `requires: ["patchKit", "stim"]`.
	 */
	function ensureIsArray(value) {
		if (Array.isArray(value)) return value;
		return value === undefined || value === null ? [] : [value];
	}

	/**
	 * Builds an element. `content` may be a string, a node, or an array of either.
	 */
	function element(tag, attributes, content) {
		const node = document.createElement(tag);
		if (attributes) {
			Object.keys(attributes).forEach(key => {
				if (attributes[key] === undefined || attributes[key] === null) return;
				node.setAttribute(key, String(attributes[key]));
			});
		}
		ensureIsArray(content).forEach(child => {
			node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
		});
		return node;
	}

	/**
	 * Signed number for display, e.g. "+3" or "-2". Returns "" for zero so callers can concatenate
	 * without producing "+0".
	 */
	function stringFrom(value, places) {
		const rounded = Number(value).roundTo(places || 0);
		if (rounded === 0) return "";
		return rounded > 0 ? `+${rounded}` : String(rounded);
	}

	/**
	 * Escapes text for HTML body content.
	 */
	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function shuffleIds(ids) {
		const bag = ids.slice();
		if (typeof bag.shuffle === "function") {
			bag.shuffle();
			return bag;
		}
		for (let i = bag.length - 1; i > 0; i -= 1) {
			const j = getRandomIntInclusive(0, i);
			const swap = bag[i];
			bag[i] = bag[j];
			bag[j] = swap;
		}
		return bag;
	}

	/**
	 * Random pool entry without repeats until every id has been used.
	 * Stores bags on `vars[storeKey + "PoolBags"]` and last ids on `vars[storeKey + "PoolLast"]`
	 * (storeKey `"tech"` keeps existing `$techPoolBags` / `$techPoolLast`).
	 */
	function pickFromPool(pool, storeKey, bagKey, variables) {
		const vars = variables || V();
		if (!Array.isArray(pool) || !pool.length) return undefined;
		const bagsName = storeKey + "PoolBags";
		const lastName = storeKey + "PoolLast";
		if (!vars[bagsName] || typeof vars[bagsName] !== "object") vars[bagsName] = {};
		if (!vars[lastName] || typeof vars[lastName] !== "object") vars[lastName] = {};

		const ids = pool.map(entry => entry.id);
		let bag = vars[bagsName][bagKey];
		if (Array.isArray(bag)) bag = bag.filter(id => ids.indexOf(id) >= 0);
		if (!Array.isArray(bag) || !bag.length) {
			bag = shuffleIds(ids);
			const last = vars[lastName][bagKey];
			if (last && bag.length > 1 && bag[bag.length - 1] === last) {
				const swapAt = getRandomIntInclusive(0, bag.length - 2);
				const swap = bag[bag.length - 1];
				bag[bag.length - 1] = bag[swapAt];
				bag[swapAt] = swap;
			}
		}

		const id = bag.pop();
		vars[bagsName][bagKey] = bag;
		vars[lastName][bagKey] = id;
		return pool.find(entry => entry.id === id) || pool[0];
	}

	Object.assign(Utils, { pickFromPool, escapeHtml });
	Object.assign(window, { between, getRandomIntInclusive, pickRandomItemInArray, selfOr, ensure, ensureIsArray, element, stringFrom });
})();
