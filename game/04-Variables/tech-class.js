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

	const DURING = [
		{
			id: "update-later",
			text: 'Your computer suddenly asks you to install an update. You select “remind me later” and return to your assignment.',
		},
		{
			id: "lab-stuffy",
			text: "The computer lab feels stuffier than usual. The fans inside the computers whir continuously as you try to concentrate.",
			temp: "hot",
		},
		{
			id: "stiff-fingers",
			text: "Your fingers feel stiff against the keyboard. You rub your hands together beneath the desk before continuing to type.",
			temp: "cold",
		},
		{
			id: "password-advice",
			text: 'Yaya mentions that you should never use the same password everywhere. Someone behind you sighs, “Too late…”',
		},
		{
			id: "program-runs",
			text: "A student near you quietly celebrates after getting their program to run correctly. You can't help but smile at their success.",
			effects: { stress: "-" },
		},
		{
			id: "sticky-keyboard",
			text: "The keyboard and mouse beneath your fingers feels strangely sticky.",
			effects: { stress: "+" },
		},
		{
			id: "wall-of-text",
			text: "Yaya types a command into their terminal. A wall of text suddenly appears on the projector. You have absolutely no idea what any of it means.",
		},
		{
			id: "shortcut-demo",
			text: "Yaya demonstrates a shortcut that you've never seen before. Several students immediately try it themselves.",
		},
		{
			id: "many-tabs",
			text: "You notice Yaya has several windows and tabs open at once on the projector. You aren't sure how they can possibly keep track of all of them.",
		},
		{
			id: "submit-work",
			text: "Yaya tells everyone to submit their work. A sudden chorus of frantic clicking fills the room.",
			effects: { stress: "+" },
		},
		{
			id: "no-idea",
			text: 'You hear a student whisper, “I have no idea what I\'m doing.” A moment later, another student whispers back, “Me neither.”',
		},
	];

	const END = [
		{
			id: "quiet-wave",
			text: "The bell rings, and students filter out of the computer lab. Yaya waves them off without another word.",
			minutes: 1,
		},
	];

	const SETUP = [
		{
			id: "power-on",
			text: "You wake the monitor and adjust the height of your chair, so your feet lay flat on the floor",
		},
		{
			id: "login-wait",
			text: "You log into a computer and wait for the desktop to finish loading.",
		},
		{
			id: "test-peripherals",
			text: "You click the mouse a few times, tap the keys to make sure they respond, and settle in before the rest of the class arrives.",
		},
	];

	const PROJECT = [
		{
			id: "power-connector",
			text: "You reseat a loose power connector on a practice board. The LED finally stays lit.",
		},
		{
			id: "case-panel",
			text: "Yaya hands you a half-assembled case. You line up the screws until the panel sits flush.",
		},
		{
			id: "stuck-fan",
			text: "A stuck fan clears after you free the cable that's pinched beneath it.",
		},
		{
			id: "spare-cable",
			text: "You replace a worn cable with a spare from the parts bin. The machine boots cleanly.",
		},
	];

	const CODING = [
		{
			id: "rename-variable",
			text: "You rename a variable. It's much easier to read now.",
		},
		{
			id: "loop-tweak",
			text: "A tiny loop tweak stops your program from hanging, allowing the console to print what you wanted.",
		},
		{
			id: "typo-catch",
			text: "You catch a typo in a function name before submitting—the error vanishes.",
		},
		{
			id: "add-comments",
			text: "Following Yaya’s example, you add comments so you can follow the steps.",
		},
		{
			id: "missing-semicolon",
			text: "You finally find the mistake in your code after staring at the same line for several minutes; It was one missing semicolon.",
		},
	];

	const FOCUS_CHOICES = [
		{
			id: "project",
			label: "Build and Repair",
			skill: "handiness",
			pool: PROJECT,
		},
		{
			id: "coding",
			label: "Practice Coding",
			skill: "programming",
			pool: CODING,
		},
	];

	function temperatureC(variables) {
		return Number(World.ensure(variables).temperatureC) || 0;
	}

	function tempBucket(variables) {
		const t = temperatureC(variables);
		if (t >= HOT_AT) return "hot";
		if (t <= COLD_AT) return "cold";
		return "mild";
	}

	function isInSession(variables) {
		return School.isRoomInSession(ROOM_KEY, variables);
	}

	function periodKey(variables) {
		const period = School.periodForRoom(ROOM_KEY, variables);
		return period ? period.key : null;
	}

	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
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

	function shuffleIds(ids) {
		const bag = ids.slice();
		for (let i = bag.length - 1; i > 0; i -= 1) {
			const j = getRandomIntInclusive(0, i);
			const swap = bag[i];
			bag[i] = bag[j];
			bag[j] = swap;
		}
		return bag;
	}

	/**
	 * Random line from a pool, without repeats until every line has been used.
	 */
	function pickFromPool(poolKey, pool, variables) {
		const vars = variables || V();
		if (!Array.isArray(pool) || !pool.length) return undefined;
		if (!vars.techPoolBags || typeof vars.techPoolBags !== "object") vars.techPoolBags = {};
		if (!vars.techPoolLast || typeof vars.techPoolLast !== "object") vars.techPoolLast = {};

		const ids = pool.map(entry => entry.id);
		let bag = vars.techPoolBags[poolKey];
		if (Array.isArray(bag)) bag = bag.filter(id => ids.indexOf(id) >= 0);
		if (!Array.isArray(bag) || !bag.length) {
			bag = shuffleIds(ids);
			const last = vars.techPoolLast[poolKey];
			if (last && bag.length > 1 && bag[bag.length - 1] === last) {
				const swapAt = getRandomIntInclusive(0, bag.length - 2);
				const swap = bag[bag.length - 1];
				bag[bag.length - 1] = bag[swapAt];
				bag[swapAt] = swap;
			}
		}

		const id = bag.pop();
		vars.techPoolBags[poolKey] = bag;
		vars.techPoolLast[poolKey] = id;
		return pool.find(entry => entry.id === id) || pool[0];
	}

	function rollDuring(variables) {
		const vars = variables || V();
		const pool = eligibleDuring(vars);
		const pick = pickFromPool("during", pool.length ? pool : DURING, vars);
		const effectsMarkup = Stats.applyEffects(pick.effects, vars);
		vars.techDuringText = pick.text;
		vars.techDuringEffects = effectsMarkup || "";
		return {
			id: pick.id,
			text: pick.text,
			effectsMarkup,
		};
	}

	function rollEnd(variables) {
		const vars = variables || V();
		const pick = pickRandomItemInArray(END);
		vars.techEnd = {
			id: pick.id,
			text: pick.text,
			minutes: pick.minutes || 1,
		};
		return vars.techEnd;
	}

	function needsEnd(variables) {
		const vars = variables || V();
		const key = periodKey(vars);
		if (!key || !School.hasAttended(key, vars)) return false;
		return vars.techEndDone !== dayKey(vars);
	}

	function markEndDone(variables) {
		const vars = variables || V();
		vars.techEndDone = dayKey(vars);
		return vars.techEndDone;
	}

	function clearFocusEvent(variables) {
		const vars = variables || V();
		delete vars.techFocus;
		delete vars.techFocusResult;
	}

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
		const key = periodKey(vars);
		if (!key || !School.canFocus(key, vars)) return null;
		const choice = findFocusChoice(choiceId);
		if (!choice) return null;

		School.focus(key, vars);
		clearFocusEvent(vars);

		const pick = pickFromPool(choice.id, choice.pool, vars);
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
		const vars = variables || V();
		const early = School.earlyArrival(ROOM_KEY, vars);
		if (!early) return 0;
		const period = School.periodByKey(early.periodKey, vars);
		if (!period) return 0;
		const now = World.minutesOfDay(vars);
		return Math.max(1, period.start - now);
	}

	/**
	 * Spend wait time setting up; flavour only. Stores $techSetupStation.
	 */
	function setupStation(variables) {
		const vars = variables || V();
		if (!canSetupStation(vars)) return null;
		const minutes = setupStationMinutes(vars);
		const pick = pickFromPool("setup", SETUP, vars);
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
		FIRST_FLAG,
		ROOM_KEY,
		GRADE_KEY,
		isInSession,
		rollDuring,
		rollEnd,
		needsEnd,
		markEndDone,
		clearFocusEvent,
		focusChoices,
		chooseFocus,
		canSetupStation,
		setupStationMinutes,
		setupStation,
	});
})();
