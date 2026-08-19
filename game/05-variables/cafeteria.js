/**
 * Cafeteria lunch vignettes and the once-a-day "Eat lunch alone" action.
 */

defineGlobalNamespaces("Cafeteria");

(function () {
	"use strict";

	const EAT_MINUTES = 15;
	const EAT_EFFECTS = { hunger: "---", stress: "-" };

	const DURING = C().cafeteria.during;

	/**
	 * Ensures today's cafeteria meal flag. Safe to call from lunch passages.
	 */
	function ensure(variables) {
		const vars = variables || V();
		const key = World.dayKey(vars);
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
