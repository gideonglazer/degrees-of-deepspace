/**
 * Life-skill definitions. Engine: Skills.
 */

(function () {
	"use strict";

	const SKILL_DEFS = [
		{ key: "handiness", label: "Handiness", icon: "handiness" },
		{ key: "programming", label: "Programming", icon: "programming" },
		{ key: "cooking", label: "Cooking", icon: "cooking" },
	];

	ConstantsLoader.add("skills", {
		defs: SKILL_DEFS,
		progressMax: 100,
	});
})();
