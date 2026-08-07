/**
 * Runs before every other script in the build. Keep this file dependency-free and ES2019-safe:
 * if it throws, the player sees a blank page with no error UI to explain it.
 */

(function () {
	"use strict";

	if (!Object.fromEntries) {
		Object.fromEntries = function (entries) {
			const result = {};
			Array.from(entries).forEach(function (entry) {
				result[entry[0]] = entry[1];
			});
			return result;
		};
	}

	if (!String.prototype.replaceAll) {
		String.prototype.replaceAll = function (search, replacement) {
			if (search instanceof RegExp) {
				if (!search.global) throw new TypeError("replaceAll must be called with a global RegExp");
				return this.replace(search, replacement);
			}
			return this.split(search).join(replacement);
		};
	}

	if (!Array.prototype.flat) {
		Array.prototype.flat = function (depth) {
			const levels = depth === undefined ? 1 : Number(depth);
			return this.reduce(function (acc, item) {
				return acc.concat(Array.isArray(item) && levels > 1 ? item.flat(levels - 1) : item);
			}, []);
		};
	}

	const required = {
		"CSS custom properties": window.CSS && CSS.supports && CSS.supports("--a", "0"),
		"Local storage": (function () {
			try {
				return Boolean(window.localStorage);
			} catch (err) {
				return false;
			}
		})(),
	};

	Object.keys(required).forEach(function (feature) {
		if (!required[feature]) console.warn("Unsupported browser: missing " + feature + ". The game may misbehave.");
	});
})();
