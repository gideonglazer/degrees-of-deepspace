/**
 * Theme-aware passage text colour macros
 *
 * Colours: <<yellow>>…<</yellow>>, <<red>>, <<green>>, <<blue>>, <<pink>>, …
 * Semantic: <<important>> (gold), <<warning>> (soft pink-red), <<success>>
 *
 * Nested macros inside the body are fine. Same classes also work as @@.yellow;text@@.
 */

(function () {
	"use strict";

	const TEXT_COLOUR_MACROS = [
		"red",
		"pink",
		"purple",
		"blue",
		"teal",
		"green",
		"lime",
		"orange",
		"brown",
		"yellow",
		"gold",
		"silver",
		"black",
		"important",
		"warning",
		"success",
	];

	DefineMacro(
		TEXT_COLOUR_MACROS,
		function () {
			const $span = $(document.createElement("span")).addClass(this.name);
			$span.wiki(this.payload[0].contents).appendTo(this.output);
		},
		{ tags: null }
	);
})();
