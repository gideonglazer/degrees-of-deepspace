/**
 * Kitchen location flavor: time-of-day lines per kitchen, plus Bloomshore breakfast overlays.
 * Add a new KITCHENS entry (e.g. skyhaven-kitchen) to give another home its own copy.
 */

defineGlobalNamespaces("KitchenFlavor");

(function () {
	"use strict";

	const BANDS = [
		{ id: "night", until: 6 * 60 },
		{ id: "morning", until: 12 * 60 },
		{ id: "afternoon", until: 17 * 60 },
		{ id: "evening", until: 21 * 60 },
		{ id: "night", until: 24 * 60 },
	];

	const KITCHENS = {
		"bloomshore-kitchen": {
			opener: "You stand in the kitchen.",
			breakfast: true,
			times: {
				night: [
					"The kitchen is empty. Everyone in the house is asleep."
				],
				morning: [
					"Morning light streams into the room, casting hues of gold and orange onto the countertops."
				],
				afternoon: [
					"The kitchen is quiet. Looks like nobody is around."
				],
				evening: [
					"You notice a plate with an apple on the counter. Looks like Caleb got distracted again."
				],
			},
		},
		"apartment-kitchen": {
			opener: "You stand in the kitchen of your apartment.",
			times: {
				night: [
					"The apartment kitchen is dim. The fridge hums in the quiet. Nothing is out of place but you."
				],
				morning: [
					"The kitchen is clean and ready for the day."
				],
				afternoon: [
					"The apartment kitchen is as you left it."
				],
				evening: [
					"Fresh, Linkon City light leaks in through the windows.",
				],
			},
		},
	};

	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	function timeBand(variables) {
		const minutes = World.minutesOfDay(variables);
		for (let i = 0; i < BANDS.length; i++) {
			if (minutes < BANDS[i].until) return BANDS[i].id;
		}
		return "night";
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
		return fillTimes(hashPick(pool, dayKey(variables) + ":" + kitchenId + ":" + band), variables);
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
