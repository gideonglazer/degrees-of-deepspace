/**
 * Life skills (Handiness, Programming): letter grades, progress bars,
 * Skills-modal cards, and | [icon] Skill effect chips.
 */

defineGlobalNamespaces("Skills");

(function () {
	"use strict";

	const GRADE_ORDER = ["F", "D", "C", "B", "A", "A*", "S"];
	const GRADE_COLOUR = {
		F: "red",
		D: "pink",
		C: "purple",
		B: "blue",
		A: "teal",
		"A*": "green",
		S: "lime",
	};
	const PROGRESS_MAX = 100;

	const SKILL_DEFS = [
		{ key: "handiness", label: "Handiness", icon: "handiness" },
		{ key: "programming", label: "Programming", icon: "programming" },
	];

	function createDefaults() {
		const skills = {};
		SKILL_DEFS.forEach(def => {
			skills[def.key] = { letter: "F", progress: 0 };
		});
		return skills;
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.skills || typeof vars.skills !== "object") {
			vars.skills = createDefaults();
		}
		SKILL_DEFS.forEach(def => {
			const row = vars.skills[def.key];
			if (!row || typeof row !== "object") {
				vars.skills[def.key] = { letter: "F", progress: 0 };
				return;
			}
			if (GRADE_ORDER.indexOf(row.letter) < 0) row.letter = "F";
			row.progress = Math.max(0, Math.min(PROGRESS_MAX, Math.round(Number(row.progress) || 0)));
		});
		return vars.skills;
	}

	function defFor(key) {
		return SKILL_DEFS.find(d => d.key === key) || null;
	}

	function gradeColourClass(letter) {
		return GRADE_COLOUR[letter] || "red";
	}

	function iconImg(key) {
		const def = defFor(key);
		const safe = String((def && def.icon) || key || "").replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) return "";
		return `<img class="icon icon-skill" src="img/skills-icons/${safe}.png" alt="" aria-hidden="true">`;
	}

	function get(key, variables) {
		const vars = variables || V();
		ensure(vars);
		const def = defFor(key);
		if (!def) return null;
		const row = vars.skills[key];
		const letter = row.letter;
		const progress = row.progress;
		const colour = gradeColourClass(letter);
		return {
			key,
			label: def.label,
			icon: def.icon,
			letter,
			progress,
			percent: progress,
			barFill: Math.max(0, Math.min(100, progress)),
			colour,
		};
	}

	function list(variables) {
		return SKILL_DEFS.map(def => get(def.key, variables)).filter(Boolean);
	}

	/**
	 * Adds progress toward the next letter. At S, progress caps at 100.
	 * Returns the updated skill snapshot.
	 */
	function addProgress(key, amount, variables) {
		const vars = variables || V();
		ensure(vars);
		const def = defFor(key);
		if (!def) return null;
		const row = vars.skills[key];
		let gain = Math.round(Number(amount) || 0);
		if (!gain) return get(key, vars);

		row.progress += gain;
		while (row.progress >= PROGRESS_MAX) {
			const idx = GRADE_ORDER.indexOf(row.letter);
			if (idx < 0 || idx >= GRADE_ORDER.length - 1) {
				row.progress = PROGRESS_MAX;
				break;
			}
			row.letter = GRADE_ORDER[idx + 1];
			row.progress -= PROGRESS_MAX;
		}
		if (row.progress < 0) row.progress = 0;
		return get(key, vars);
	}

	/**
	 * Preview/apply chip: | [icon] SkillName
	 */
	function effectMarkup(key) {
		const def = defFor(key);
		if (!def) return "";
		return (
			`<span class="stat-effect-wrap">` +
			` <span class="stat-effect-pipe">|</span> ` +
			`<span class="stat-effect stat-effect-good">` +
			iconImg(key) +
			`<span class="stat-name">${def.label}</span>` +
			`</span>` +
			`</span>`
		);
	}

	/**
	 * Concatenated chips for an ordered list of skill keys.
	 */
	function effectsMarkup(keys) {
		if (!keys || !keys.length) return "";
		return keys.map(effectMarkup).join("");
	}

	/**
	 * Card grid for the Skills modal section under School.
	 */
	function skillsSectionMarkup(variables) {
		const cards = list(variables)
			.map(skill => {
				return (
					`<div class="life-skill-card" role="listitem">` +
					`<div class="life-skill-card-top">` +
					`<div class="life-skill-card-name">` +
					iconImg(skill.key) +
					`<span class="life-skill-label">${skill.label}</span>` +
					`</div>` +
					`<span class="${skill.colour} life-skill-grade">${skill.letter}</span>` +
					`</div>` +
					`<div class="life-skill-card-bottom">` +
					`<span class="${skill.colour} life-skill-pct">${skill.percent}%</span>` +
					`</div>` +
					`<div class="life-skill-bar" role="presentation" aria-hidden="true">` +
					`<div class="life-skill-bar-fill ${skill.colour}" style="width:${skill.barFill}%"></div>` +
					`</div>` +
					`</div>`
				);
			})
			.join("");

		return (
			`<h3 class="skills-section skills-section-life">Skills</h3>` +
			`<div class="life-skills-grid" role="list" aria-label="Life skills">` +
			cards +
			`</div>`
		);
	}

	Object.assign(Skills, {
		ensure,
		get,
		list,
		addProgress,
		effectMarkup,
		effectsMarkup,
		iconImg,
		skillsSectionMarkup,
		SKILL_DEFS,
		GRADE_ORDER,
	});
})();
