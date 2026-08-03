/**
 * Collects errors raised during play and surfaces them in-page.
 *
 * A SugarCube story is one long-lived page, so an exception in a passage or widget can leave the
 * player stuck with no feedback and nothing in view to report. Errors are gathered here, shown once
 * per passage, and deduplicated so a per-turn failure does not bury the screen.
 */

defineGlobalNamespaces("Errors");

(function () {
	"use strict";

	const MAX_TRACKED = 50;
	/** @type {Array<{message: string, detail: string, count: number}>} */
	let collected = [];

	/**
	 * Records an error. Repeats of an existing message bump its counter instead of adding a row.
	 *
	 * @param {Error|string} error
	 * @param {string} [context] Where it happened, e.g. a passage or macro name.
	 */
	function report(error, context) {
		const message = error instanceof Error ? error.message : String(error);
		const detail = [context, error instanceof Error ? error.stack : null].filter(Boolean).join("\n");

		const existing = collected.find(entry => entry.message === message && entry.detail === detail);
		if (existing) {
			existing.count++;
		} else if (collected.length < MAX_TRACKED) {
			collected.push({ message, detail, count: 1 });
		}

		console.error(context ? `[${context}]` : "[DoD]", error);
		render();
	}

	/**
	 * Clears collected errors and removes the report from the page.
	 *
	 * @param {boolean} [silent] Skip the console notice, used when loading a save.
	 */
	function hide(silent) {
		collected = [];
		const node = document.getElementById("dod-errors");
		if (node) node.remove();
		if (!silent) console.info("Error report cleared.");
	}

	/** @returns {boolean} */
	function any() {
		return collected.length > 0;
	}

	/** Draws (or removes) the report block at the top of the passage area. */
	function render() {
		const host = document.getElementById("passages");
		if (!host) return;

		const existing = document.getElementById("dod-errors");
		if (existing) existing.remove();
		if (!collected.length) return;

		const box = document.createElement("div");
		box.id = "dod-errors";

		const heading = document.createElement("strong");
		heading.textContent = `${collected.length} error${collected.length === 1 ? "" : "s"} this session`;
		box.appendChild(heading);

		const list = document.createElement("ul");
		collected.forEach(entry => {
			const item = document.createElement("li");
			item.textContent = entry.count > 1 ? `${entry.message} (×${entry.count})` : entry.message;
			if (entry.detail) item.title = entry.detail;
			list.appendChild(item);
		});
		box.appendChild(list);

		host.insertBefore(box, host.firstChild);
	}

	/**
	 * Runs `fn`, reporting rather than propagating anything it throws. Use this at boundaries where a
	 * failure should not abort the rest of the turn, such as a passage header.
	 *
	 * @param {string} context
	 * @param {Function} fn
	 * @returns {*} The return value of `fn`, or undefined if it threw.
	 */
	function guard(context, fn) {
		try {
			return fn();
		} catch (err) {
			report(err, context);
			return undefined;
		}
	}

	Object.assign(Errors, { report, hide, any, guard, Reporter: { hide, render } });

	window.addEventListener("error", ev => report(ev.error || ev.message, "window"));
	window.addEventListener("unhandledrejection", ev => report(ev.reason, "promise"));
})();
