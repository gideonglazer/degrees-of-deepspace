/**
 * Kitchen location flavor: time-of-day lines per kitchen, plus Bloomshore breakfast overlays.
 * Add a new KITCHENS entry (e.g. skyhaven-kitchen) to give another home its own copy.
 */

defineGlobalNamespaces("KitchenFlavor");

(function () {
	"use strict";

	const KITCHENS = C().kitchen.kitchens;

	function timeBand(variables) {
		return World.timeBand(variables);
	}

	function hashPick(list, salt) {
		if (!list || !list.length) return "";
		let n = 0;
		const key = String(salt || "");
		for (let i = 0; i < key.length; i++) n = (n + key.charCodeAt(i) * (i + 1)) % 2147483647;
		return list[Math.abs(n) % list.length];
	}

	function fillTimes(text, variables) {
		return String(text || "")
			.replace(/\{breakfastStart\}/g, World.formatTimeAt(6, 0, variables))
			.replace(/\{breakfastEnd\}/g, World.formatTimeAt(9, 0, variables));
	}

	function breakfastBody(variables) {
		const vars = variables || V();
		if (typeof CalebBreakfast === "undefined") return "";
		CalebBreakfast.ensure(vars);
		const meal = CalebBreakfast.meal(vars.calebBreakfast.id);
		const mealName = meal ? meal.name : "breakfast";

		if (CalebBreakfast.available(vars)) {
			return (
				"Morning light catches on clean counters; " +
				mealName +
				" waits on a plate where <<Caleb>> left it for you."
			);
		}
		if (vars.calebBreakfast.eaten && CalebBreakfast.isWindowOpen(vars)) {
			return "Morning light catches on clean counters. The plate <<Caleb>> left for you is empty now.";
		}
		if (
			timeBand(vars) === "morning" &&
			!World.isBefore(9, 0, vars) &&
			!vars.calebBreakfast.eaten
		) {
			return "The counters are clear — whatever <<Caleb>> cooked this morning is gone.";
		}
		return "";
	}

	function breakfastNote(variables) {
		const vars = variables || V();
		if (typeof CalebBreakfast === "undefined") return "";
		CalebBreakfast.ensure(vars);
		if (CalebBreakfast.available(vars)) return "";
		if (vars.calebBreakfast.eaten && CalebBreakfast.isWindowOpen(vars)) {
			return "<<blue>>You've already eaten the breakfast <<Caleb>> made today.<</blue>>";
		}
		if (
			timeBand(vars) === "morning" &&
			!World.isBefore(9, 0, vars) &&
			!vars.calebBreakfast.eaten
		) {
			return (
				"<<blue>>You missed <<Caleb>>'s breakfast. <<He>> clears the kitchen after " +
				World.formatTimeAt(9, 0, vars) +
				".<</blue>>"
			);
		}
		return "";
	}

	function hungerNote(variables) {
		const vars = variables || V();
		if (typeof CalebBreakfast === "undefined" || !CalebBreakfast.available(vars)) return "";
		const hunger = vars.stats && Number(vars.stats.hunger);
		if (!(hunger > 50)) return "";
		return " <<orange>>You can feel your stomach growling.<</orange>>";
	}

	function timeBody(kitchen, kitchenId, variables) {
		const band = timeBand(variables);
		const pool = (kitchen.times && kitchen.times[band]) || (kitchen.times && kitchen.times.afternoon) || [];
		return fillTimes(hashPick(pool, World.dayKey(variables) + ":" + kitchenId + ":" + band), variables);
	}

	/**
	 * Wiki markup for a kitchen's opener, time-of-day (or breakfast) line, and status notes.
	 */
	function vignette(kitchenId, variables) {
		const vars = variables || V();
		const id = String(kitchenId || (World.ensure(vars).location || ""));
		const kitchen = KITCHENS[id];
		if (!kitchen) return "";

		let body = "";
		if (kitchen.breakfast) body = breakfastBody(vars);
		if (!body) body = timeBody(kitchen, id, vars);

		let html = kitchen.opener || "";
		if (body) html += (html ? " " : "") + body;
		html += hungerNote(vars);
		const note = kitchen.breakfast ? breakfastNote(vars) : "";
		if (note) html += " " + note;
		return html;
	}

	Object.assign(KitchenFlavor, {
		vignette,
		timeBand,
		KITCHENS,
	});

	DefineMacroS("kitchenFlavor", function (args) {
		return vignette(args[0]);
	});
})();
