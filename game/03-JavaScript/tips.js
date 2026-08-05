/**
 * Sidebar tip pool (DoL-style rotating hints under Current Condition).
 */

defineGlobalNamespaces("Tips");

(function () {
	"use strict";

	const POOL = [
		"Check your journal for appointments and reminders.",
		"If some animated text effects (such as hypnosis) are too overwhelming, you can disable them in the options menu.",
		"Arousal increases during lewd acts, and decreases over time.",
		"Energy drains while you are awake. Sleep to restore it.",
		"Stress usually decreases over time. Fun or relaxing activities also reduce it.",
		"You can change the date, time, temperature, currency symbol, and starting season in General settings.",
		"Pain, stress, and trauma fade slowly if you give yourself time to recover.",
		"Hunger and hygiene drift over time — eat and wash up regularly when you can.",
	];

	/**
	 * @returns {string[]}
	 */
	function list() {
		return POOL.slice();
	}

	/**
	 * Picks a tip for the sidebar. Uses the seeded PRNG so replays stay consistent.
	 *
	 * @returns {string}
	 */
	function pick() {
		if (!POOL.length) return "";
		return POOL[getRandomIntInclusive(0, POOL.length - 1)];
	}

	/**
	 * Markup for the DoL-style tip block.
	 *
	 * @returns {string}
	 */
	function markup() {
		const text = pick();
		if (!text) return "";
		return `<div class="hud-tip"><span class="hud-tip-label">Tip:</span> ${text}</div>`;
	}

	Object.assign(Tips, { POOL, list, pick, markup });
})();
