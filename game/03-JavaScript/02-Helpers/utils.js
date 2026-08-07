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
	 * Sentence-cases a string without touching the rest of it, so "Vesna's cabin" survives intact.
	 */
	function sentenceCase(text) {
		const value = String(selfOr(text, ""));
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	/**
	 * Joins a list into prose: "a", "a and b", "a, b, and c".
	 */
	function listToProse(items, conjunction) {
		const parts = ensureIsArray(items).filter(Boolean).map(String);
		const word = conjunction || "and";
		if (parts.length <= 1) return parts.join("");
		if (parts.length === 2) return `${parts[0]} ${word} ${parts[1]}`;
		return `${parts.slice(0, -1).join(", ")}, ${word} ${parts[parts.length - 1]}`;
	}

	Object.assign(Utils, { sentenceCase, listToProse });
	Object.assign(window, { between, getRandomIntInclusive, pickRandomItemInArray, selfOr, ensure, ensureIsArray, element, stringFrom });
})();
