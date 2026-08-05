/**
 * Positions the sidebar weekday date tooltip beside the cursor so #ui-bar-body
 * overflow cannot clip it.
 */

(function () {
	"use strict";

	const SELECTOR = ".hud-weekday";
	const TIP = ".hud-weekday-tooltip";
	const GAP = 12;

	/** @type {Element|null} */
	let activeWeekday = null;
	let cursorX = 0;
	let cursorY = 0;

	/**
	 * @param {Element} weekday
	 */
	function placeTip(weekday) {
		const tip = weekday.querySelector(TIP);
		if (!tip) return;

		tip.classList.add("is-visible");
		tip.style.position = "fixed";
		tip.style.display = "block";
		tip.style.right = "auto";
		tip.style.bottom = "auto";

		/* Measure after showing so width/height are accurate. */
		const box = tip.getBoundingClientRect();
		let left = cursorX + GAP;
		let top = cursorY - box.height - GAP;

		const maxLeft = window.innerWidth - box.width - GAP;
		const maxTop = window.innerHeight - box.height - GAP;
		if (left > maxLeft) left = Math.max(GAP, cursorX - box.width - GAP);
		if (left < GAP) left = GAP;
		if (top < GAP) top = cursorY + GAP;
		if (top > maxTop) top = Math.max(GAP, maxTop);

		tip.style.top = `${Math.round(top)}px`;
		tip.style.left = `${Math.round(left)}px`;
	}

	/**
	 * @param {Element} weekday
	 */
	function hideTip(weekday) {
		const tip = weekday.querySelector(TIP);
		if (!tip) return;
		tip.classList.remove("is-visible");
		tip.style.display = "";
		tip.style.position = "";
		tip.style.top = "";
		tip.style.left = "";
		tip.style.right = "";
		tip.style.bottom = "";
	}

	jQuery(document)
		.on("mouseenter", SELECTOR, function (event) {
			activeWeekday = this;
			cursorX = event.clientX;
			cursorY = event.clientY;
			placeTip(this);
		})
		.on("mousemove", SELECTOR, function (event) {
			cursorX = event.clientX;
			cursorY = event.clientY;
			if (activeWeekday === this) placeTip(this);
		})
		.on("mouseleave", SELECTOR, function (event) {
			const next = event.relatedTarget;
			if (next && this.contains(next)) return;
			if (activeWeekday === this) activeWeekday = null;
			hideTip(this);
		})
		.on("focusin", SELECTOR, function () {
			activeWeekday = this;
			const anchor = this.getBoundingClientRect();
			cursorX = anchor.right;
			cursorY = anchor.top;
			placeTip(this);
		})
		.on("focusout", SELECTOR, function (event) {
			const next = event.relatedTarget;
			if (next && this.contains(next)) return;
			if (activeWeekday === this) activeWeekday = null;
			hideTip(this);
		});
})();
