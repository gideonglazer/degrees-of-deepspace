/**
 * Per-kitchen location flavor. Engine: KitchenFlavor.
 */

(function () {
	"use strict";

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

	ConstantsLoader.add("kitchen", {
		kitchens: KITCHENS,
	});
})();
