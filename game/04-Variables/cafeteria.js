/**
 * Cafeteria lunch vignettes and the once-a-day "Eat lunch alone" action.
 */

defineGlobalNamespaces("Cafeteria");

(function () {
	"use strict";

	const EAT_MINUTES = 15;
	const EAT_EFFECTS = { hunger: "---", stress: "-" };

	const DURING = [
		{
			id: "chatter",
			text: "The cafeteria buzzes with the usual lunchtime chatter.",
		},
		{
			id: "dropped-tray",
			text: "Someone drops a tray across the cafeteria, followed by a chorus of jeers. The student that dropped the tray frantically starts cleaning up the mess.",
		},
		{
			id: "overlapping-noise",
			text: "The cafeteria is filled with the overlapping noise of conversation, chairs scraping against the floor, and utensils clattering against trays.",
		},
		{
			id: "quieter",
			text: "The cafeteria is surprisingly quieter today than usual.",
		},
		{
			id: "club-posters",
			text: "There are multiple groups of students handing out posters today, promoting their clubs and electives.",
		},
		{
			id: "come-and-go",
			text: "Groups of students come and go. Some rush out the doors to get to their classes on time, some scurry in, hoping to be first in line to get lunch before the cafeteria packs with people.",
		},
	];

	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	/**
	 * Ensures today's cafeteria meal flag. Safe to call from lunch passages.
	 */
	function ensure(variables) {
		const vars = variables || V();
		const key = dayKey(vars);
		if (!vars.cafeteriaDaily || typeof vars.cafeteriaDaily !== "object" || vars.cafeteriaDaily.day !== key) {
			vars.cafeteriaDaily = { day: key, eaten: false };
		}
		vars.cafeteriaDaily.eaten = !!vars.cafeteriaDaily.eaten;
		return vars.cafeteriaDaily;
	}

	function hasEaten(variables) {
		return ensure(variables).eaten;
	}

	/**
	 * True during lunch period if today's cafeteria meal has not been eaten.
	 */
	function canEatAlone(variables) {
		const vars = variables || V();
		if (!School.isInLunchPeriod(vars)) return false;
		return !hasEaten(vars);
	}

	function eatPreviewMarkup() {
		return Stats.effectsMarkup(EAT_EFFECTS);
	}

	/**
	 * Applies hunger/stress, advances time, and marks lunch eaten.
	 */
	function eatAlone(variables) {
		const vars = variables || V();
		const state = ensure(vars);
		if (!canEatAlone(vars) || state.eaten) return "";

		World.advance(EAT_MINUTES, vars);
		const fx = Stats.applyEffects(EAT_EFFECTS, vars);
		state.eaten = true;
		return fx;
	}

	/**
	 * Picks a lunchtime vignette and stores display strings.
	 */
	function rollDuring(variables) {
		const vars = variables || V();
		const pick = pickRandomItemInArray(DURING);
		vars.cafeteriaDuringText = pick.text;
		return {
			id: pick.id,
			text: pick.text,
		};
	}

	Object.assign(Cafeteria, {
		EAT_MINUTES,
		ensure,
		hasEaten,
		canEatAlone,
		eatPreviewMarkup,
		eatAlone,
		rollDuring,
	});
})();
