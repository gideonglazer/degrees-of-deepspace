/**
 * Caleb home-breakfast menu (younger route).
 */

(function () {
	"use strict";

	const MENU = {
		"bacon-dish": {
			name: "bacon dish",
			minutes: 15,
			hunger: "---",
			stress: "--",
			text: "You sit down and dig into the hearty bacon dish <<Caleb>> left for you.",
		},
		"bao-bun": {
			name: "bao bun",
			minutes: 10,
			hunger: "--",
			stress: "-",
			text: "You eat the soft bao bun <<Caleb>> steamed this morning.",
		},
		"fried-egg": {
			name: "fried egg",
			minutes: 8,
			hunger: "-",
			stress: "-",
			text: "You eat the fried egg <<Caleb>> cooked for you.",
		},
		"eggs-with-toast": {
			name: "eggs with toast",
			minutes: 12,
			hunger: "--",
			stress: "-",
			text: "You eat the plate of eggs with toast <<Caleb>> made.",
		},
		"omelette-dish": {
			name: "omelette",
			minutes: 15,
			hunger: "---",
			stress: "--",
			text: "You eat the fluffy omelette <<Caleb>> left for you.",
		},
		pancakes: {
			name: "pancakes",
			minutes: 15,
			hunger: "---",
			stress: "--",
			text: "You eat the warm stack of pancakes <<Caleb>> left for you.",
		},
		waffles: {
			name: "waffles",
			minutes: 15,
			hunger: "---",
			stress: "--",
			text: "You finish the crisp waffles <<Caleb>> cooked for you.",
		},
		"toast-with-jam": {
			name: "toast with jam",
			minutes: 8,
			hunger: "-",
			stress: "-",
			text: "You eat the toast with jam <<Caleb>> set out for you.",
		},
	};

	ConstantsLoader.add("calebBreakfast", {
		menu: MENU,
	});
})();
