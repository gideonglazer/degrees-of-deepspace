/**
 * Shared class-period engine: during/end vignettes and optional interactive Focus.
 * New subjects call ClassLesson.create — do not copy math-class.js / physics-class.js.
 */

defineGlobalNamespaces("ClassLesson");

(function () {
	"use strict";

	const DEFAULT_FOCUS_CHANCE = 25;
	const byRoom = {};

	function displayText(text, resolveText, variables) {
		if (typeof resolveText === "function") return resolveText(text, variables);
		return text;
	}

	function outcomeForPreview(choice) {
		if (choice.successChance) return choice.success || {};
		return choice;
	}

	function buildApi(config) {
		const roomKey = config.roomKey;
		const gradeKey = config.gradeKey || roomKey;
		const prefix = config.varPrefix;
		const firstFlag = config.firstFlag;
		const during = config.during || [];
		const end = config.end || [];
		const focusPool = Array.isArray(config.focus) ? config.focus : [];
		const focusChance = config.focusChance != null ? config.focusChance : DEFAULT_FOCUS_CHANCE;
		const focusEventPassage = config.focusEventPassage || "";
		const filterDuring = config.filterDuring;
		const resolveText = config.resolveText;
		const pickDuring = config.pickDuring || pickRandomItemInArray;

		const duringTextKey = prefix + "DuringText";
		const duringEffectsKey = prefix + "DuringEffects";
		const endKey = prefix + "End";
		const endDoneKey = prefix + "EndDone";
		const focusKey = prefix + "Focus";
		const focusResultKey = prefix + "FocusResult";

		function isInSession(variables) {
			return School.isRoomInSession(roomKey, variables);
		}

		function periodKey(variables) {
			const period = School.periodForRoom(roomKey, variables);
			return period ? period.key : null;
		}

		function bonusStarMarkup(variables, appliedLevel) {
			const vars = variables || V();
			const current = School.getDailyProgress(gradeKey, vars);
			if (appliedLevel == null && current >= School.MAX_DAILY_STARS) return "";
			const level = appliedLevel != null ? appliedLevel : Math.min(School.MAX_DAILY_STARS, current + 1);
			return School.dailyStarEffectMarkup(gradeKey, level);
		}

		function understandingChance(mode, variables) {
			return School.focusSuccessChance(gradeKey, mode, variables);
		}

		function choicePreviewMarkup(choice, variables) {
			const vars = variables || V();
			const outcome = outcomeForPreview(choice);
			let markup = "";
			if (outcome.bonusStar) markup += bonusStarMarkup(vars);
			markup += Stats.effectsMarkup(outcome.effects);
			return markup;
		}

		function findFocusEntry(id) {
			return focusPool.find(entry => entry.id === id) || null;
		}

		function rollDuring(variables) {
			const vars = variables || V();
			const pool = typeof filterDuring === "function" ? filterDuring(vars) : during;
			const pick = pickDuring(pool.length ? pool : during, vars);
			const effectsMarkup = Stats.applyEffects(pick.effects, vars);
			const text = displayText(pick.text, resolveText, vars);
			vars[duringTextKey] = text;
			vars[duringEffectsKey] = effectsMarkup || "";
			return {
				id: pick.id,
				text,
				effectsMarkup,
			};
		}

		function rollEnd(variables) {
			const vars = variables || V();
			const pick = pickRandomItemInArray(end);
			vars[endKey] = {
				id: pick.id,
				text: displayText(pick.text, resolveText, vars),
				minutes: pick.minutes || 1,
			};
			return vars[endKey];
		}

		function needsEnd(variables) {
			const vars = variables || V();
			const key = periodKey(vars);
			if (!key || !School.hasAttended(key, vars)) return false;
			return vars[endDoneKey] !== World.dayKey(vars);
		}

		function markEndDone(variables) {
			const vars = variables || V();
			vars[endDoneKey] = World.dayKey(vars);
			return vars[endDoneKey];
		}

		function clearFocusEvent(variables) {
			const vars = variables || V();
			delete vars[focusKey];
			delete vars[focusResultKey];
		}

		const api = {
			FIRST_FLAG: firstFlag,
			ROOM_KEY: roomKey,
			focusEventPassage,
			isInSession,
			periodKey,
			rollDuring,
			rollEnd,
			needsEnd,
			markEndDone,
			clearFocusEvent,
		};

		if (config.gradeKey) api.GRADE_KEY = config.gradeKey;

		if (!focusPool.length) return api;

		function focus(variables) {
			const vars = variables || V();
			const key = periodKey(vars);
			if (!key || !School.canFocus(key, vars)) return { event: false };
			School.focus(key, vars);
			clearFocusEvent(vars);
			if (!focusPool.length || getRandomIntInclusive(1, 100) > focusChance) {
				return { event: false };
			}
			const pick = pickRandomItemInArray(focusPool);
			vars[focusKey] = {
				id: pick.id,
				text: displayText(pick.text, resolveText, vars),
				choices: pick.choices.map(choice => {
					const row = {
						id: choice.id,
						label: choice.label,
						previewMarkup: choicePreviewMarkup(choice, vars),
					};
					if (choice.successChance) {
						const chance = understandingChance(choice.successChance, vars);
						row.label = choice.label + " (" + chance + "%)";
						row.chance = chance;
					}
					return row;
				}),
			};
			return { event: true, id: pick.id };
		}

		function applyFocusChoice(choiceId, variables) {
			const vars = variables || V();
			const active = vars[focusKey];
			if (!active || !active.id) return null;
			const entry = findFocusEntry(active.id);
			if (!entry) return null;
			const choice = entry.choices.find(c => c.id === choiceId);
			if (!choice) return null;

			let outcome = choice;
			let rolled = null;
			if (choice.successChance) {
				const chance = understandingChance(choice.successChance, vars);
				const roll = getRandomIntInclusive(1, 100);
				const passed = chance >= roll;
				rolled = { chance, roll, passed };
				outcome = passed ? choice.success : choice.failure;
			}

			let effectsMarkup = Stats.applyEffects(outcome.effects, vars);
			let starMarkup = "";
			let stars = School.getDailyProgress(gradeKey, vars);
			if (outcome.bonusStar && stars < School.MAX_DAILY_STARS) {
				stars = School.addDailyProgress(gradeKey, 1, vars);
				starMarkup = bonusStarMarkup(vars, stars);
			}

			vars[focusResultKey] = {
				id: entry.id,
				choiceId: choice.id,
				text: displayText(outcome.result, resolveText, vars),
				effectsMarkup: (starMarkup || "") + (effectsMarkup || ""),
				rolled,
			};
			delete vars[focusKey];
			return vars[focusResultKey];
		}

		api.focus = focus;
		api.applyFocusChoice = applyFocusChoice;
		return api;
	}

	/**
	 * Assigns shared class methods onto `namespaceName` and registers the module by roomKey.
	 */
	function create(namespaceName, config) {
		const target = defineGlobalNamespaces(namespaceName);
		const api = buildApi(config || {});
		Object.assign(target, api);
		if (config && config.roomKey) byRoom[config.roomKey] = target;
		return target;
	}

	function forRoom(roomKey) {
		return byRoom[roomKey] || null;
	}

	/**
	 * Runs a registered interactive Focus turn. Returns the event passage name, or "" to stay.
	 * Unregistered rooms (history, art, …) fall back to School.focus.
	 */
	function focusAndRoute(roomKey, variables) {
		const vars = variables || V();
		const lesson = forRoom(roomKey);
		if (lesson && typeof lesson.focus === "function") {
			const result = lesson.focus(vars);
			if (result && result.event) return lesson.focusEventPassage || "";
			return "";
		}
		const period = School.periodForRoom(roomKey, vars);
		if (period && School.canFocus(period.key, vars)) {
			School.focus(period.key, vars);
		}
		return "";
	}

	Object.assign(ClassLesson, {
		DEFAULT_FOCUS_CHANCE,
		create,
		forRoom,
		focusAndRoute,
	});
})();
