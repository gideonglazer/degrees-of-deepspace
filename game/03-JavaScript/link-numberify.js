defineGlobalNamespaces("LinkNumberify");

(function () {
	"use strict";

	/** Ten plain slots followed by ten shifted ones. */
	const MAX_LINKS = 20;

	/**
	 * @returns {boolean}
	 */
	function enabled() {
		if (window.StartConfig && StartConfig.enableLinkNumberify === false) return false;
		if (tags().includes("nokeys")) return false;
		return true;
	}

	/**
	 * @returns {JQuery}
	 */
	function passageLinks() {
		return jQuery("#passages").find("a.link-internal").not(".link-numberify-skip");
	}

	/**
	 * Digit shown for a slot: slots 0–8 are 1–9, slot 9 is 0, then the shifted run repeats.
	 *
	 * @param {number} slot
	 * @returns {number}
	 */
	function digitForSlot(slot) {
		const position = slot % 10;
		return position === 9 ? 0 : position + 1;
	}

	/**
	 * Numbers the addressable links in the current passage.
	 */
	function numberify() {
		passageLinks().each(function (index) {
			const $link = jQuery(this);
			$link.find(".link-num").remove();
			if (!enabled() || index >= MAX_LINKS) {
				$link.removeAttr("data-link-slot");
				return;
			}
			const digit = digitForSlot(index);
			const label = index < 10 ? `(${digit})` : `(Shift + ${digit})`;
			$link.attr("data-link-slot", String(index));
			$link.prepend(`<span class="link-num" aria-hidden="true">${label} </span>`);
		});
	}

	/**
	 * Digit pressed, or null for any other key. Uses `code` so Shift+1 still reads as 1.
	 *
	 * @param {KeyboardEvent} event
	 * @returns {number|null}
	 */
	function digitFromEvent(event) {
		const code = String(event.code || "");
		const match = code.match(/^(?:Digit|Numpad)([0-9])$/);
		if (match) return Number(match[1]);
		if (event.keyCode >= 48 && event.keyCode <= 57) return event.keyCode - 48;
		if (event.keyCode >= 96 && event.keyCode <= 105) return event.keyCode - 96;
		return null;
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function onKeyUp(event) {
		if (!enabled() || event.ctrlKey || event.altKey || event.metaKey) return;

		const target = event.target;
		if (target) {
			const tag = String(target.tagName || "").toLowerCase();
			if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) {
				return;
			}
		}

		const digit = digitFromEvent(event);
		if (digit === null) return;

		const slot = (digit === 0 ? 9 : digit - 1) + (event.shiftKey ? 10 : 0);
		const $match = passageLinks().filter(`[data-link-slot="${slot}"]`).first();
		if (!$match.length) return;

		event.preventDefault();
		$match.trigger("click");
	}

	jQuery(document).on(":passagedisplay", numberify);
	jQuery(document).on("keyup.linkNumberify", onKeyUp);

	Object.assign(LinkNumberify, { numberify, enabled });
})();
