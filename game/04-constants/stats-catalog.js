/**
 * Need/stat caps, tier magnitudes, and labels. Engine: Stats.
 */

(function () {
	"use strict";

	const FATIGUE_MAX = 2000;
	const AROUSAL_MAX = 10000;
	const PAIN_MAX = 200;
	const STRESS_MAX = 10000;
	const CONTROL_MAX = 10000;
	const PERCENT_MAX = 100;

	const TIERS = {
		stress: { "+": 100, "++": 250, "+++": 500 },
		arousal: { "+": 200, "++": 500, "+++": 1000 },
		pain: { "+": 5, "++": 15, "+++": 30 },
		control: { "+": 50, "++": 150, "+++": 300 },
		energy: { "+": 5, "++": 10, "+++": 20 },
		fatigue: { "+": 100, "++": 300, "+++": 600 },
		hygiene: { "+": 50, "++": 100, "+++": 100 },
		hunger: { "+": 5, "++": 10, "+++": 20 },
	};

	const LABELS = {
		stress: "Stress",
		arousal: "Arousal",
		pain: "Pain",
		control: "Control",
		energy: "Energy",
		fatigue: "Fatigue",
		hygiene: "Hygiene",
		hunger: "Hunger",
	};

	ConstantsLoader.add("stats", {
		fatigueMax: FATIGUE_MAX,
		arousalMax: AROUSAL_MAX,
		painMax: PAIN_MAX,
		stressMax: STRESS_MAX,
		controlMax: CONTROL_MAX,
		percentMax: PERCENT_MAX,
		tiers: TIERS,
		labels: LABELS,
	});
})();
