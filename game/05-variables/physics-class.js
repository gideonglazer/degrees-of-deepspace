/**
 * Physics class vignettes: during-lesson rotation, Focus interactive events,
 * and end-of-class dismissals.
 * First-time Lorenz intro lives in physics.twee (flag: physicsFirstClass).
 */

defineGlobalNamespaces("PhysicsClass");

(function () {
	"use strict";

	const ROOM_KEY = "physics";
	const FIRST_FLAG = "physicsFirstClass";

	const catalog = C().physicsClass;
	const DURING = catalog.during;
	const END = catalog.end;
	const FOCUS = catalog.focus;

	function eligibleDuring(variables) {
		const weather = World.ensure(variables).weather || "fair";
		return DURING.filter(entry => !entry.weather || entry.weather.indexOf(weather) >= 0);
	}

	ClassLesson.create("PhysicsClass", {
		roomKey: ROOM_KEY,
		varPrefix: "physics",
		firstFlag: FIRST_FLAG,
		during: DURING,
		end: END,
		focus: FOCUS,
		focusEventPassage: "Physics Focus Event",
		filterDuring: eligibleDuring,
		resolveText: Pronouns.fill,
	});
})();
