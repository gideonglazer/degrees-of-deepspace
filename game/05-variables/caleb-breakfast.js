/**
 * Daily home breakfast Caleb leaves in the Bloomshore kitchen (younger route).
 * One random dish per day; eatable only between 6:00 and 9:00.
 */

defineGlobalNamespaces("CalebBreakfast");

(function () {
	"use strict";

	const MENU = C().calebBreakfast.menu;

	const IDS = Object.keys(MENU);

	/**
	 * Ensures today's dish is rolled. Safe to call from kitchen passages.
	 */
	function ensure(variables) {
		const vars = variables || V();
		const key = World.dayKey(vars);
		if (!vars.calebBreakfast || typeof vars.calebBreakfast !== "object" || vars.calebBreakfast.day !== key) {
			vars.calebBreakfast = {
				day: key,
				id: pickRandomItemInArray(IDS),
				eaten: false,
			};
		}
		if (!MENU[vars.calebBreakfast.id]) {
			vars.calebBreakfast.id = pickRandomItemInArray(IDS);
		}
		vars.calebBreakfast.eaten = !!vars.calebBreakfast.eaten;
		return vars.calebBreakfast;
	}

	function meal(id) {
		return MENU[id] || null;
	}

	/**
	 * True during the 6:00–9:00 eat window (inclusive of 6:00, exclusive of 9:00).
	 */
	function isWindowOpen(variables) {
		return !World.isBefore(6, 0, variables) && World.isBefore(9, 0, variables);
	}

	/**
	 * Dish is on the counter and the player can still eat it.
	 */
	function available(variables) {
		const state = ensure(variables);
		return isWindowOpen(variables) && !state.eaten && !!meal(state.id);
	}

	/**
	 * Applies hunger/stress/dominance and marks the meal eaten.
	 */
	function eat(variables) {
		const vars = variables || V();
		const state = ensure(vars);
		const item = meal(state.id);
		if (!item || state.eaten || !isWindowOpen(vars)) return "";

		World.advance(item.minutes, vars);
		let fx = "";
		if (item.hunger) fx += Stats.applyEffect("hunger", item.hunger, vars);
		if (item.stress) fx += Stats.applyEffect("stress", item.stress, vars);
		fx += LoveInterests.applyStat("caleb", "dominance", "+", vars);
		state.eaten = true;
		return fx;
	}

	/**
	 * Wiki markup for today's dish prose (supports <<Caleb>>, <<he>>, etc.).
	 */
	function textMarkup(variables) {
		const state = ensure(variables);
		const item = meal(state.id);
		return item ? item.text : "";
	}

	Object.assign(CalebBreakfast, {
		ensure,
		meal,
		isWindowOpen,
		available,
		eat,
		textMarkup,
		menuIds() {
			return IDS.slice();
		},
	});

	DefineMacroS("calebBreakfastText", function () {
		return textMarkup();
	});
})();
