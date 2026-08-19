/**
 * Math class vignettes: during-lesson rotation, Focus interactive events,
 * and end-of-class dismissals.
 * First-time Zhang intro lives in math.twee (flag: mathFirstClass).
 */

defineGlobalNamespaces("MathClass");

(function () {
	"use strict";

	const catalog = C().mathClass;

	ClassLesson.create("MathClass", {
		roomKey: "math",
		varPrefix: "math",
		firstFlag: "mathFirstClass",
		during: catalog.during,
		end: catalog.end,
		focus: catalog.focus,
		focusEventPassage: "Math Focus Event",
	});
})();
