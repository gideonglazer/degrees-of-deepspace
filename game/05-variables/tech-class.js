/**
 * Tech class vignettes: during-lesson rotation, Focus skill tracks
 * (Build and Repair / Practice Coding), end-of-class dismissal,
 * and early "Set up your station" flavour.
 * First-time Yaya intro lives in computer-lab.twee (flag: techFirstClass).
 */

defineGlobalNamespaces("TechClass");

(function () {
	"use strict";

	const ROOM_KEY = "computerLab";
	const GRADE_KEY = "tech";
	const FIRST_FLAG = "techFirstClass";
	const SKILL_GAIN = 12;
	const HOT_AT = 24;
	const COLD_AT = 10;

	const catalog = C().techClass;
	const DURING = catalog.during;
	const END = catalog.end;
	const SETUP = catalog.setup;
	const FOCUS_CHOICES = catalog.focusChoices;

	function temperatureC(variables) {
		return Number(World.ensure(variables).temperatureC) || 0;
	}

	function tempBucket(variables) {
		const t = temperatureC(variables);
		if (t >= HOT_AT) return "hot";
		if (t <= COLD_AT) return "cold";
		return "mild";
	}

	function eligibleDuring(variables) {
		const bucket = tempBucket(variables);
		return DURING.filter(entry => !entry.temp || entry.temp === bucket);
	}

	function skillPreviewMarkup(skillKey) {
		return Skills.effectMarkup(skillKey);
	}

	function findFocusChoice(id) {
		return FOCUS_CHOICES.find(c => c.id === id) || null;
	}

	function pickTech(pool, bagKey, variables) {
		return Utils.pickFromPool(pool, "tech", bagKey, variables);
	}

	ClassLesson.create("TechClass", {
		roomKey: ROOM_KEY,
		gradeKey: GRADE_KEY,
		varPrefix: "tech",
		firstFlag: FIRST_FLAG,
		during: DURING,
		end: END,
		filterDuring: eligibleDuring,
		pickDuring(pool, variables) {
			return pickTech(pool, "during", variables);
		},
	});

	/**
	 * Links shown in the computer lab instead of "Focus on the lesson".
	 */
	function focusChoices() {
		return FOCUS_CHOICES.map(choice => ({
			id: choice.id,
			label: choice.label,
			previewMarkup: skillPreviewMarkup(choice.skill),
		}));
	}

	/**
	 * Run a Tech Focus turn for a skill track and store $techFocusResult.
	 */
	function chooseFocus(choiceId, variables) {
		const vars = variables || V();
		const key = TechClass.periodKey(vars);
		if (!key || !School.canFocus(key, vars)) return null;
		const choice = findFocusChoice(choiceId);
		if (!choice) return null;

		School.focus(key, vars);
		TechClass.clearFocusEvent(vars);

		const pick = pickTech(choice.pool, choice.id, vars);
		Skills.addProgress(choice.skill, SKILL_GAIN, vars);
		const skillMarkup = Skills.effectMarkup(choice.skill);

		vars.techFocusResult = {
			id: choice.id,
			vignetteId: pick.id,
			text: pick.text,
			effectsMarkup: skillMarkup || "",
		};
		return vars.techFocusResult;
	}

	function canSetupStation(variables) {
		const vars = variables || V();
		const early = School.earlyArrival(ROOM_KEY, vars);
		if (!early || !early.periodKey) return false;
		const period = School.periodByKey(early.periodKey, vars);
		if (!period || period.gradeKey !== GRADE_KEY) return false;
		return period.roomKey === ROOM_KEY;
	}

	function setupStationMinutes(variables) {
		return School.minutesUntilPeriodStart(ROOM_KEY, variables);
	}

	/**
	 * Spend wait time setting up; flavour only. Stores $techSetupStation.
	 */
	function setupStation(variables) {
		const vars = variables || V();
		if (!canSetupStation(vars)) return null;
		const minutes = setupStationMinutes(vars);
		const pick = pickTech(SETUP, "setup", vars);
		World.advance(minutes, vars);
		const result = {
			roomKey: ROOM_KEY,
			id: pick.id,
			text: pick.text,
			minutes,
		};
		vars.techSetupStation = result;
		return result;
	}

	Object.assign(TechClass, {
		focusChoices,
		chooseFocus,
		canSetupStation,
		setupStationMinutes,
		setupStation,
	});
})();
