/**
 * Shared letter-grade order and HUD colours (school subjects and life skills).
 */

(function () {
	"use strict";

	ConstantsLoader.add("grades", {
		order: ["F", "D", "C", "B", "A", "A*", "S"],
		colour: {
			F: "red",
			D: "pink",
			C: "purple",
			B: "blue",
			A: "teal",
			"A*": "green",
			S: "lime",
		},
	});
})();
