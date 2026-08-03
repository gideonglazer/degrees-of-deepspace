/**
 * Passage timing, off by default.
 *
 * Sandbox passages accumulate widgets over time and one slow helper called from a passage header
 * costs you a slowdown on every single turn. Enable with `Perflog.enable()` in the console, play for
 * a while, then `Perflog.report()` to see which passages and marks dominate.
 */

defineGlobalNamespaces("Perflog");

(function () {
	"use strict";

	let enabled = false;
	/** @type {Object<string, {calls: number, total: number, max: number}>} */
	let samples = {};
	let passageStart = 0;

	/**
	 * Adds a duration to the running totals for `label`.
	 *
	 * @param {string} label
	 * @param {number} duration Milliseconds.
	 */
	function record(label, duration) {
		const entry = samples[label] || (samples[label] = { calls: 0, total: 0, max: 0 });
		entry.calls++;
		entry.total += duration;
		entry.max = Math.max(entry.max, duration);
	}

	/**
	 * Times `fn` under `label` and returns its result. A no-op wrapper when logging is off, so it is
	 * safe to leave in hot paths.
	 *
	 * @param {string} label
	 * @param {Function} fn
	 * @returns {*}
	 */
	function mark(label, fn) {
		if (!enabled) return fn();
		const started = performance.now();
		try {
			return fn();
		} finally {
			record(label, performance.now() - started);
		}
	}

	function enable() {
		enabled = true;
		samples = {};
		console.info("Perflog enabled. Play a few turns, then call Perflog.report().");
	}

	function disable() {
		enabled = false;
		console.info("Perflog disabled.");
	}

	/**
	 * Logs a table of collected samples, slowest total first.
	 *
	 * @returns {Array<object>} The same rows, for further inspection.
	 */
	function report() {
		const rows = Object.keys(samples)
			.map(label => ({
				label,
				calls: samples[label].calls,
				total: samples[label].total.roundTo(1),
				average: (samples[label].total / samples[label].calls).roundTo(2),
				worst: samples[label].max.roundTo(2),
			}))
			.sort((a, b) => b.total - a.total);

		if (!rows.length) console.info("No samples collected. Did you call Perflog.enable()?");
		else console.table(rows);
		return rows;
	}

	Object.assign(Perflog, {
		mark,
		enable,
		disable,
		report,
		get enabled() {
			return enabled;
		},
	});

	$(document).on(":passagestart", () => {
		if (enabled) passageStart = performance.now();
	});

	$(document).on(":passageend", ev => {
		if (enabled) record(`passage: ${ev.passage ? ev.passage.title : "unknown"}`, performance.now() - passageStart);
	});
})();
