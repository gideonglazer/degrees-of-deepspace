/**
 * Daily home breakfast Caleb leaves in the Bloomshore kitchen (younger route).
 * One random dish per day; eatable only between 6:00 and 9:00.
 */

defineGlobalNamespaces("CalebBreakfast");

(function () {
	"use strict";

	const MENU = {
		"bacon-dish": {
			name: "bacon dish",
			minutes: 15,
			hunger: "+++",
			stress: "--",
			text: "You sit down and dig into the hearty bacon dish Caleb left for you.",
		},
		"bao-bun": {
			name: "bao bun",
			minutes: 10,
			hunger: "++",
			stress: "-",
			text: "You eat the soft bao bun Caleb steamed this morning.",
		},
		"fried-egg": {
			name: "fried egg",
			minutes: 8,
			hunger: "+",
			stress: "-",
			text: "You eat the fried egg Caleb cooked for you.",
		},
		"eggs-with-toast": {
			name: "eggs with toast",
			minutes: 12,
			hunger: "++",
			stress: "-",
			text: "You eat the plate of eggs with toast Caleb made.",
		},
		"omelette-dish": {
			name: "omelette",
			minutes: 15,
			hunger: "+++",
			stress: "--",
			text: "You eat the fluffy omelette cooked by Caleb that he left for you on the counter.",
		},
		pancakes: {
			name: "pancakes",
			minutes: 15,
			hunger: "+++",
			stress: "--",
			text: "You eat the warm stack of pancakes Caleb left for you.",
		},
		waffles: {
			name: "waffles",
			minutes: 15,
			hunger: "+++",
			stress: "--",
			text: "You finish the crisp waffles Caleb cooked this morning.",
		},
		"toast-with-jam": {
			name: "toast with jam",
			minutes: 8,
			hunger: "+",
			stress: "-",
			text: "You eat the toast with jam Caleb set out for you.",
		},
	};

	const IDS = Object.keys(MENU);

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	/**
	 * Ensures today's dish is rolled. Safe to call from kitchen passages.
	 *
	 * @param {object} [variables]
	 * @returns {{ day: string, id: string, eaten: boolean }}
	 */
	function ensure(variables) {
		const vars = variables || V();
		const key = dayKey(vars);
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

	/**
	 * @param {string} id
	 * @returns {{ name: string, minutes: number, hunger: string, stress: string, text: string }|null}
	 */
	function meal(id) {
		return MENU[id] || null;
	}

	/**
	 * True during the 6:00–9:00 eat window (inclusive of 6:00, exclusive of 9:00).
	 *
	 * @param {object} [variables]
	 * @returns {boolean}
	 */
	function isWindowOpen(variables) {
		return !World.isBefore(6, 0, variables) && World.isBefore(9, 0, variables);
	}

	/**
	 * Dish is on the counter and the player can still eat it.
	 *
	 * @param {object} [variables]
	 * @returns {boolean}
	 */
	function available(variables) {
		const state = ensure(variables);
		return isWindowOpen(variables) && !state.eaten && !!meal(state.id);
	}

	/**
	 * Applies hunger/stress/dominance and marks the meal eaten.
	 *
	 * @param {object} [variables]
	 * @returns {string} Combined effect markup (may be empty if unavailable)
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

	Object.assign(CalebBreakfast, {
		ensure,
		meal,
		isWindowOpen,
		available,
		eat,
		menuIds() {
			return IDS.slice();
		},
	});
})();
