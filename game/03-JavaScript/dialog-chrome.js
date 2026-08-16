/**
 * Colour Codes tip beside Social / Skills / Journal titles.
 */

(function () {
	"use strict";

	const COLOUR_CODE_DIALOGS = ["skills-dialog", "social-dialog", "journal-dialog", "inventory-dialog"];

	function wantsColourCodes(body) {
		if (!body || !body.classList) return false;
		return COLOUR_CODE_DIALOGS.some(name => body.classList.contains(name));
	}

	function clearTip() {
		jQuery("#ui-dialog-titlebar .colour-codes-tip").remove();
	}

	function attachTip() {
		clearTip();
		const body = typeof Dialog !== "undefined" && Dialog.body ? Dialog.body() : null;
		if (!wantsColourCodes(body)) return;
		if (typeof School === "undefined" || typeof School.colourCodesTipMarkup !== "function") return;

		const $title = jQuery("#ui-dialog-title");
		if (!$title.length) return;
		jQuery(School.colourCodesTipMarkup()).insertAfter($title);
	}

	jQuery(document)
		.on(":dialogopened", attachTip)
		.on(":dialogclosed", clearTip);
})();
