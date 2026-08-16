/**
 * Younger PC only: weekday timetable, grades, and campus class helpers (Linkon University).
 * Older PCs do not use school state — mutators no-op and getters return inactive defaults.
 */

defineGlobalNamespaces("School");

(function () {
	"use strict";

	const FRIDAY_GUESTS = ["rafayel", "zayne", "valko", "gideon"];
	/** Earliest time the gate "Attend … Class" link appears on a school day. */
	const GATE_OPEN = 8 * 60;

	/**
	 * Whether school gameplay (grades, timetable, attendance) applies.
	 * True when Player is unavailable (early boot) or the PC is Younger.
	 */
	function applies(variables) {
		const vars = variables || V();
		return typeof Player === "undefined" || Player.isYounger(vars);
	}

	/** Discrete letter grades. Understanding % is stored separately. */
	const GRADE_ORDER = ["F", "D", "C", "B", "A", "A*", "S"];
	const DEFAULT_LETTERS = {
		physics: "D",
		math: "D",
		tech: "D",
		history: "D",
		art: "D",
		pe: "D",
	};
	const DEFAULT_UNDERSTANDING = {
		physics: 0,
		math: 0,
		tech: 0,
		history: 0,
		art: 0,
		pe: 0,
	};
	/** Midnight understanding from daily stars: none / bronze / silver / gold. */
	const STAR_UNDERSTANDING = [0, 3, 7, 12];
	/** Cap on daily star progress (bronze / silver / gold). */
	const MAX_DAILY_STARS = 3;
	/** Classroom turns per normal class period (last turn can be understanding-only, no star). */
	const TURNS_PER_CLASS = 4;
	/** Classroom turns before the exam on exam days (stars only; exam finishes the period). */
	const TURNS_PER_EXAM_CLASS = 2;
	/** Immediate understanding gained each time you Focus in class. */
	const FOCUS_UNDERSTANDING = 2;
	/** Free-time library study: minutes and understanding per session. */
	const STUDY_MINUTES = 20;
	const STUDY_UNDERSTANDING = 4;
	/** Rooms/subjects that offer "Study before class" when arriving early. */
	const STUDY_BEFORE_SUBJECTS = ["physics", "math", "history", "art"];
	/** First period: study/setup from campus open until class starts (1 hour). */
	const FIRST_STUDY_WINDOW = 60;
	/** Later periods: study/setup only in the passing window before that class. */
	const STUDY_BEFORE_WINDOW = 10;
	const STUDY_BEFORE_LABELS = {
		physics: "Physics",
		math: "Math",
		history: "History",
		art: "Art",
	};
	const STUDY_BEFORE_GENERAL =
		"You crack open your textbook, thumbing through the pages before class starts.";
	const STUDY_BEFORE_BY_GRADE = {
		F: "The words jumble around on the pages, and in your mind. You are barely able to make sense of anything you read, desperate to just give up.",
		D: "You reread each passage of the unit until you can form some understandings. Even then, you aren’t sure if you are *really* getting it.",
		C: "The chapter is relatively easy to understand. And with each passage you read, new ideas come together, forming coherent, cohesive thoughts.",
		B: "You read through each paragraph fluently, making sense of terms and definitions you overlooked. You feel like there’s still so much to be learned.",
		A: "Your fingers brush over words, solidifying your understanding of the unit entirely. It makes you wonder if you really needed to study this subject more.",
		"A*": "As you read through the chapter, you can’t help but let your mind drift elsewhere. Eventually, you pull your focus back onto the book in front of you.",
		S: "A yawn escapes your lips, brushing over the redundant, droning paragraphs. There’s no reason for you to study something you already understand.",
	};
	const UNDERSTANDING_MIN = -100;
	/** Cap; 200%+ auto-promotes on Sunday without an exam. */
	const UNDERSTANDING_MAX = 200;
	/** Understanding at or below this demotes one letter on Sunday. */
	const DEMOTE_AT = -100;
	/** Sunday auto-promote when understanding reaches this (no exam needed). */
	const SUNDAY_PROMOTE_AT = 200;
	/** Sunday decay by letter (higher grades are harder to maintain). */
	const WEEKLY_DECAY = { F: 2, D: 4, C: 6, B: 8, A: 10, "A*": 12, S: 14 };

	/**
	 * School skills shown in the Skills modal (class subject → skill label).
	 * Times match the weekday timetable periods.
	 */
	const SKILLS = [
		{ key: "physics", label: "Physics", icon: "physics", start: 9 * 60, end: 9 * 60 + 50 },
		{ key: "math", label: "Math", icon: "math", start: 10 * 60, end: 10 * 60 + 50 },
		{ key: "tech", label: "Tech", icon: "computer", start: 11 * 60, end: 11 * 60 + 50 },
		{ key: "history", label: "History", icon: "history", start: 13 * 60 + 10, end: 14 * 60 },
		{ key: "art", label: "Creativity", icon: "art", start: 13 * 60 + 10, end: 14 * 60 },
		{ key: "pe", label: "Athletics", icon: "track", start: 14 * 60 + 10, end: 15 * 60 },
	];

	/** Terrible → Excellent (red → lime). */
	const QUALITY_CLASSES = ["red", "pink", "purple", "blue", "teal", "green", "lime"];
	const QUALITY_LABELS = ["Terrible", "Bad", "Poor", "Okay", "Decent", "Good", "Excellent"];

	const GRADE_COLOUR = {
		F: "red",
		D: "pink",
		C: "purple",
		B: "blue",
		A: "teal",
		"A*": "green",
		S: "lime",
	};

	const GRADE_COMMENTS = {
		S: "You've mastered this subject and are recognized as a genius among your peers.",
		"A*": "You are a distinguished student and your teachers admire your diligience.",
		A: "You're one of the best in the class, however, you can still achieve more.",
		B: "You're doing well, but there's still room for improvement.",
		C: "You're getting by, but a little more effort could supplement your grade.",
		D: "You're falling behind. Extra studying would help.",
		F: "You're failing this class. You need to turn this around.",
	};

	/**
	 * Physical campus rooms. Order here is the order shown at the gates.
	 * Classrooms/period rooms exist every school day; only the class running inside them rotates.
	 * `section` groups gate links: outside, facilities, then classrooms.
	 * `minutes` is travel time from the gates (and back).
	 * `icon` is the school-icons basename when one exists.
	 * `actionIcon` is an action-icons basename used instead (e.g. rear courtyard).
	 */
	const ROOMS = [
		{ key: "frontCourtyard", label: "Front courtyard", passage: "Campus Front Courtyard", section: "outside", minutes: 2 },
		{ key: "rearCourtyard", label: "Rear courtyard", passage: "Campus Rear Courtyard", section: "outside", minutes: 2, actionIcon: "entrance" },
		{ key: "lectureHall", label: "Lecture Hall", passage: "Campus Lecture Hall", section: "facilities", minutes: 1, icon: "lecture" },
		{ key: "lunch", label: "Cafeteria", passage: "Campus Lunch", section: "facilities", minutes: 1, icon: "cafeteria" },
		{ key: "track", label: "Track Field", passage: "Campus PE Track", section: "facilities", minutes: 1, icon: "track" },
		{ key: "library", label: "Library", passage: "Campus Library", section: "facilities", minutes: 2, icon: "library", hidden: true },
		{ key: "principalsOffice", label: "Principal's Office", passage: "Campus Principal's Office", section: "facilities", minutes: 2, icon: "principal", hidden: true },
		{ key: "infirmary", label: "Infirmary", passage: "Campus Infirmary", section: "facilities", minutes: 2, icon: "infirmary", hidden: true },
		{ key: "restroom", label: "Restroom", passage: "Campus Restroom", section: "facilities", minutes: 2, icon: "restroom", hidden: true },
		{ key: "physics", label: "Physics Lab", passage: "Campus Physics", section: "classrooms", minutes: 1, icon: "physics" },
		{ key: "math", label: "Math Classroom", passage: "Campus Math", section: "classrooms", minutes: 1, icon: "math" },
		{ key: "computerLab", label: "Computer Lab", passage: "Campus Computer Lab", section: "classrooms", minutes: 1, icon: "computer" },
		{ key: "history", label: "History Classroom", passage: "Campus History", section: "classrooms", minutes: 1, icon: "history" },
		{ key: "art", label: "Art Studio", passage: "Campus Art", section: "classrooms", minutes: 1, icon: "art" },
	];

	/** Early-arrival copy keyed by campus room. */
	const EARLY_COPY = {
		physics: {
			enter: "You enter the physics lab. No one else has arrived yet.",
			subject: "physics",
			lesson: "physics lesson",
		},
		math: {
			enter: "You enter the math classroom. No one else has arrived yet.",
			subject: "math",
			lesson: "math lesson",
		},
		computerLab: {
			enter: "You enter the computer lab. No one else has arrived yet.",
			subject: "tech",
			lesson: "tech lesson",
		},
		history: {
			enter: "You enter the history classroom. No one else has arrived yet.",
			subject: "history",
			lesson: "history lesson",
		},
		art: {
			enter: "You enter the art studio. No one else has arrived yet.",
			subject: "art",
			lesson: "art lesson",
		},
		track: {
			enter: "You arrive at the track early. No one else is here yet.",
			subject: "PE",
			lesson: "PE lesson",
		},
		lunch: {
			enter: "You arrive at the cafeteria early. It's quiet before the lunch rush.",
			subject: null,
			lesson: "lunch",
		},
		lectureHall: {
			enter: "You enter the lecture hall early. The seats are still empty.",
			subject: null,
			lesson: "lecture",
		},
	};

	function room(key) {
		return ROOMS.find(r => r.key === key);
	}

	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	function weekdayNum(variables) {
		const world = World.ensure(variables);
		return new Date(world.year, world.month - 1, world.day).getDay();
	}

	/**
	 * Stable week index for Friday guest rotation.
	 */
	function weekIndex(variables) {
		const world = World.ensure(variables);
		const days = Math.floor(Date.UTC(world.year, world.month - 1, world.day) / 86400000);
		return Math.floor(days / 7);
	}

	function createDefaults() {
		return {
			attended: {},
			dailyProgress: {},
			periodTurns: {},
			grades: Object.assign({}, DEFAULT_LETTERS),
			understanding: Object.assign({}, DEFAULT_UNDERSTANDING),
		};
	}

	/**
	 * Maps a legacy 0–100 score (old saves) onto a letter grade.
	 */
	function letterFromLegacyScore(score) {
		const n = Number(score);
		if (!Number.isFinite(n)) return "D";
		if (n >= 100) return "S";
		if (n >= 95) return "A*";
		if (n >= 90) return "A";
		if (n >= 80) return "B";
		if (n >= 70) return "C";
		if (n >= 60) return "D";
		return "F";
	}

	function normalizeLetter(value) {
		if (typeof value === "string" && GRADE_ORDER.indexOf(value) >= 0) return value;
		if (typeof value === "number") return letterFromLegacyScore(value);
		return "D";
	}

	function clampUnderstanding(n) {
		const v = Number(n);
		if (!Number.isFinite(v)) return 0;
		if (v < UNDERSTANDING_MIN) return UNDERSTANDING_MIN;
		if (v > UNDERSTANDING_MAX) return UNDERSTANDING_MAX;
		return Math.round(v);
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.school || typeof vars.school !== "object") {
			vars.school = createDefaults();
		}
		if (!vars.school.attended || typeof vars.school.attended !== "object") {
			vars.school.attended = {};
		}
		if (!vars.school.dailyProgress || typeof vars.school.dailyProgress !== "object") {
			vars.school.dailyProgress = {};
		}
		if (!vars.school.periodTurns || typeof vars.school.periodTurns !== "object") {
			vars.school.periodTurns = {};
		}
		/* periodFocuses → periodTurns rename (legacy saves) */
		if (vars.school.periodFocuses && typeof vars.school.periodFocuses === "object") {
			Object.keys(vars.school.periodFocuses).forEach(day => {
				if (!vars.school.periodTurns[day] || typeof vars.school.periodTurns[day] !== "object") {
					vars.school.periodTurns[day] = vars.school.periodFocuses[day];
				}
			});
			delete vars.school.periodFocuses;
		}
		if (!vars.school.understanding || typeof vars.school.understanding !== "object") {
			vars.school.understanding = Object.assign({}, DEFAULT_UNDERSTANDING);
		}
		if (!vars.school.grades || typeof vars.school.grades !== "object") {
			vars.school.grades = Object.assign({}, DEFAULT_LETTERS);
		}
		/* chemistry → physics rename (legacy saves) */
		if (Object.prototype.hasOwnProperty.call(vars.school.grades, "chemistry")) {
			if (!Object.prototype.hasOwnProperty.call(vars.school.grades, "physics")) {
				vars.school.grades.physics = vars.school.grades.chemistry;
			}
			delete vars.school.grades.chemistry;
		}
		if (Object.prototype.hasOwnProperty.call(vars.school.understanding, "chemistry")) {
			if (!Object.prototype.hasOwnProperty.call(vars.school.understanding, "physics")) {
				vars.school.understanding.physics = vars.school.understanding.chemistry;
			}
			delete vars.school.understanding.chemistry;
		}
		Object.keys(vars.school.dailyProgress).forEach(key => {
			const day = vars.school.dailyProgress[key];
			if (!day || typeof day !== "object") return;
			if (Object.prototype.hasOwnProperty.call(day, "chemistry")) {
				if (!Object.prototype.hasOwnProperty.call(day, "physics")) {
					day.physics = day.chemistry;
				}
				delete day.chemistry;
			}
		});
		Object.keys(DEFAULT_LETTERS).forEach(key => {
			const raw = vars.school.grades[key];
			if (typeof raw === "number") {
				vars.school.grades[key] = letterFromLegacyScore(raw);
				if (typeof vars.school.understanding[key] !== "number") {
					vars.school.understanding[key] = 0;
				}
			} else {
				vars.school.grades[key] = normalizeLetter(raw);
			}
			if (typeof vars.school.understanding[key] !== "number") {
				vars.school.understanding[key] = 0;
			} else {
				vars.school.understanding[key] = clampUnderstanding(vars.school.understanding[key]);
			}
		});
		return vars.school;
	}

	function gradeComment(letter) {
		return GRADE_COMMENTS[letter] || GRADE_COMMENTS.D;
	}

	function gradeColourClass(letter) {
		return GRADE_COLOUR[normalizeLetter(letter)] || "red";
	}

	function scoreColourClass(score) {
		const n = Number(score);
		if (!Number.isFinite(n) || n < 0) return "red";
		return qualityClass(Math.min(100, n));
	}

	/**
	 * Quality tier index 0–6 for a 0–100 value (Terrible→Excellent).
	 */
	function qualityTier(score) {
		const n = Math.max(0, Math.min(100, Number(score) || 0));
		if (n >= 90) return 6;
		if (n >= 75) return 5;
		if (n >= 60) return 4;
		if (n >= 45) return 3;
		if (n >= 30) return 2;
		if (n >= 15) return 1;
		return 0;
	}

	function qualityClass(score) {
		return QUALITY_CLASSES[qualityTier(score)] || "red";
	}

	function getUnderstanding(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return 0;
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return 0;
		return clampUnderstanding(vars.school.understanding[subject]);
	}

	function addUnderstanding(subject, amount, variables) {
		const vars = variables || V();
		if (!applies(vars)) return 0;
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return 0;
		const next = clampUnderstanding((Number(vars.school.understanding[subject]) || 0) + (Number(amount) || 0));
		vars.school.understanding[subject] = next;
		return next;
	}

	function getLetter(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return "D";
		ensure(vars);
		if (!subject || !(subject in vars.school.grades)) return "D";
		return normalizeLetter(vars.school.grades[subject]);
	}

	/**
	 * Exam day for a subject: Friday for daily classes; History Wed; Art Thu.
	 */
	function isExamDayForSubject(subject, variables) {
		const day = weekdayNum(variables);
		if (subject === "history") return day === 3;
		if (subject === "art") return day === 4;
		if (subject === "physics" || subject === "math" || subject === "tech" || subject === "pe") {
			return day === 5;
		}
		return false;
	}

	/**
	 * Pass chance for Friday-style tests = current understanding % (may exceed 100).
	 */
	function examPassChance(subject, variables) {
		return Math.max(0, getUnderstanding(subject, variables));
	}

	/**
	 * Letter-grade bonus added to understanding for in-class Focus success rolls.
	 * Higher grades stay capable even when understanding resets after a promote.
	 */
	const FOCUS_GRADE_BONUS = {
		F: 0,
		D: 5,
		C: 12,
		B: 20,
		A: 30,
		"A*": 40,
		S: 50,
	};

	/**
	 * Success % for Focus vignette checks: understanding + letter-grade bonus.
	 * mode "understandingHard" is a tougher roll (−15 before clamping).
	 */
	function focusSuccessChance(subject, mode, variables) {
		const understanding = Math.round(getUnderstanding(subject, variables) || 0);
		const letter = getLetter(subject, variables);
		const bonus = FOCUS_GRADE_BONUS[letter] != null ? FOCUS_GRADE_BONUS[letter] : 0;
		let chance = understanding + bonus;
		const hard = mode === "understandingHard" || mode === "hard";
		if (hard) chance -= 15;
		if (hard) return Math.max(10, Math.min(85, chance));
		return Math.max(15, Math.min(95, chance));
	}

	function setLetter(subject, letter, variables) {
		const vars = variables || V();
		if (!applies(vars)) return "D";
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return "D";
		vars.school.grades[subject] = normalizeLetter(letter);
		return vars.school.grades[subject];
	}

	function promoteGrade(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return "D";
		const letter = getLetter(subject, vars);
		const idx = GRADE_ORDER.indexOf(letter);
		if (idx < 0 || idx >= GRADE_ORDER.length - 1) {
			vars.school.understanding[subject] = 0;
			return letter;
		}
		vars.school.grades[subject] = GRADE_ORDER[idx + 1];
		vars.school.understanding[subject] = 0;
		return vars.school.grades[subject];
	}

	function demoteGrade(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return "D";
		const letter = getLetter(subject, vars);
		const idx = GRADE_ORDER.indexOf(letter);
		if (idx <= 0) {
			vars.school.understanding[subject] = 0;
			return letter;
		}
		vars.school.grades[subject] = GRADE_ORDER[idx - 1];
		vars.school.understanding[subject] = 0;
		return vars.school.grades[subject];
	}

	function getGrade(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return null;
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return null;
		const letter = getLetter(subject, vars);
		const understanding = getUnderstanding(subject, vars);
		const percent = Math.round(understanding);
		return {
			subject,
			letter,
			understanding,
			score: percent,
			percent,
			barFill: Math.max(0, Math.min(100, understanding)),
			passChance: examPassChance(subject, vars),
			comment: gradeComment(letter),
			colour: gradeColourClass(letter),
		};
	}

	function clampDaily(n) {
		const v = Math.floor(Number(n) || 0);
		if (v < 0) return 0;
		if (v > 3) return 3;
		return v;
	}

	function getDailyProgress(subject, variables) {
		const vars = variables || V();
		if (!applies(vars)) return 0;
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return 0;
		const day = vars.school.dailyProgress[dayKey(vars)];
		return day && typeof day === "object" ? clampDaily(day[subject]) : 0;
	}

	/**
	 * Adds daily study progress (max 3 → gold star). Returns the new level.
	 * Tech never earns daily stars.
	 */
	function addDailyProgress(subject, amount, variables) {
		const vars = variables || V();
		if (!applies(vars)) return 0;
		ensure(vars);
		if (!subject || !(subject in DEFAULT_LETTERS)) return 0;
		if (subject === "tech") return 0;
		const key = dayKey(vars);
		if (!vars.school.dailyProgress[key] || typeof vars.school.dailyProgress[key] !== "object") {
			vars.school.dailyProgress[key] = {};
		}
		const day = vars.school.dailyProgress[key];
		const next = clampDaily((Number(day[subject]) || 0) + (amount == null ? 1 : amount));
		day[subject] = next;
		return next;
	}

	/**
	 * End-of-day (midnight): apply today's stars to understanding, then clear them.
	 * Called by World.advance before the calendar day increments. Younger PC only.
	 */
	function processMidnight(variables) {
		const vars = variables || V();
		if (!applies(vars)) return;
		ensure(vars);
		const key = dayKey(vars);
		const stars = vars.school.dailyProgress[key];
		if (stars && typeof stars === "object") {
			Object.keys(DEFAULT_LETTERS).forEach(subject => {
				const level = clampDaily(stars[subject]);
				const boost = STAR_UNDERSTANDING[level] || 0;
				if (boost) addUnderstanding(subject, boost, vars);
			});
		}
		delete vars.school.dailyProgress[key];
		delete vars.school.periodTurns[key];
		delete vars.school.periodFocuses;
	}

	/**
	 * Start-of-day hooks after the calendar rolls.
	 * Sundays: promote at 200% understanding, demote at -100%, else weekly decay.
	 * Letter raises normally come from passing weekly exams.
	 */
	function processNewDay(variables) {
		const vars = variables || V();
		if (!applies(vars)) return;
		ensure(vars);
		if (weekdayNum(vars) !== 0) return;
		Object.keys(DEFAULT_LETTERS).forEach(subject => {
			const understanding = getUnderstanding(subject, vars);
			if (understanding >= SUNDAY_PROMOTE_AT) {
				promoteGrade(subject, vars);
			} else if (understanding <= DEMOTE_AT) {
				demoteGrade(subject, vars);
			} else {
				const letter = getLetter(subject, vars);
				const decay = WEEKLY_DECAY[letter] != null ? WEEKLY_DECAY[letter] : 6;
				addUnderstanding(subject, -decay, vars);
			}
		});
	}

	function dailyStarIcon(level) {
		const n = clampDaily(level);
		if (n >= 3) return "star-gold";
		if (n >= 2) return "star-silver";
		if (n >= 1) return "star-bronze";
		return "star-empty";
	}

	/**
	 * Three daily-progress slots: bronze, then silver, then gold (empty until earned).
	 */
	function dailyStarIcons(level) {
		const n = clampDaily(level);
		return [
			n >= 1 ? "star-bronze" : "star-empty",
			n >= 2 ? "star-silver" : "star-empty",
			n >= 3 ? "star-gold" : "star-empty",
		];
	}

	function dailyStarsMarkup(level) {
		const n = clampDaily(level);
		const label =
			n >= 3 ? "Daily progress: gold" : n >= 2 ? "Daily progress: silver" : n >= 1 ? "Daily progress: bronze" : "Daily progress: none";
		return (
			`<span class="skills-stars" role="img" aria-label="${label}">` +
			dailyStarIcons(n).map(schoolIconImg).join("") +
			`</span>`
		);
	}

	/**
	 * Link/result chip: | ★ SubjectName for a daily star at the given level.
	 */
	function dailyStarEffectMarkup(subject, level) {
		const n = clampDaily(level);
		if (!n) return "";
		const skill = SKILLS.find(s => s.key === subject);
		const label = (skill && skill.label) || STUDY_BEFORE_LABELS[subject] || subject;
		return (
			`<span class="stat-effect-wrap">` +
			` <span class="stat-effect-pipe">|</span> ` +
			`<span class="stat-effect stat-effect-good">` +
			schoolIconImg(dailyStarIcon(n)) +
			`<span class="stat-name">${label}</span>` +
			`</span>` +
			`</span>`
		);
	}

	function formatPeriodTime(start, end, variables) {
		const startH = Math.floor(start / 60);
		const startM = start % 60;
		const endH = Math.floor(end / 60);
		const endM = end % 60;
		return (
			World.formatTimeAt(startH, startM, variables) +
			" – " +
			World.formatTimeAt(endH, endM, variables)
		);
	}

	/**
	 * Skill rows for the Skills modal (icon, time, daily stars, grade, percent).
	 * Younger PC only — Older PCs have no school timetable.
	 */
	function skillsList(variables) {
		const vars = variables || V();
		if (!applies(vars)) return [];
		ensure(vars);
		return SKILLS.map(skill => {
			const grade = getGrade(skill.key, vars);
			const daily = getDailyProgress(skill.key, vars);
			const letter = grade ? grade.letter : "F";
			const percent = grade ? grade.percent : 0;
			const barFill = grade ? grade.barFill : 0;
			const pctColour = scoreColourClass(Math.max(0, Math.min(100, percent)));
			return {
				key: skill.key,
				label: skill.label,
				icon: skill.icon,
				timeLabel: formatPeriodTime(skill.start, skill.end, vars),
				daily,
				starIcons: dailyStarIcons(daily),
				letter,
				understanding: grade ? grade.understanding : 0,
				score: percent,
				barFill,
				colour: gradeColourClass(letter),
				pctColour,
			};
		});
	}

	/**
	 * Legend row colour codes.
	 */
	function colourCodesLegendMarkup() {
		return QUALITY_LABELS.map((label, i) => {
			const cls = QUALITY_CLASSES[i];
			const sep = i < QUALITY_LABELS.length - 1 ? `<span class="colour-codes-sep" aria-hidden="true">|</span>` : "";
			return `<span class="${cls} colour-codes-item"><i>${label}</i></span>${sep}`;
		}).join("");
	}

	/**
	 * Titlebar tip: small "Colour Codes" label with hover/focus legend.
	 */
	function colourCodesTipMarkup() {
		return (
			`<span class="colour-codes-tip" tabindex="0" role="note" aria-label="Colour codes">` +
			`<span class="colour-codes-label">Colour Codes</span>` +
			`<span class="colour-codes-legend" role="tooltip">` +
			colourCodesLegendMarkup() +
			`</span></span>`
		);
	}

	function schoolIconImg(name) {
		const safe = String(name || "").replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) return "";
		return `<img class="icon icon-school" src="img/school-icons/${safe}.png" alt="" aria-hidden="true">`;
	}

	/**
	 * Full Skills modal body markup (school timetable). Younger PC only.
	 */
	function skillsMarkup(variables) {
		const vars = variables || V();
		if (!applies(vars)) {
			return `<div class="skills"><p class="skills-empty">No school timetable.</p></div>`;
		}
		ensure(vars);
		const rows = skillsList(vars)
			.map(skill => {
				const noStars = skill.key === "tech";
				const starLabel = noStars
					? "No daily stars"
					: skill.daily >= 3
						? "Gold star earned"
						: skill.daily >= 2
							? "Silver star earned"
							: skill.daily >= 1
								? "Bronze star earned"
								: "No daily progress";
				const dailyCell = noStars
					? `<span class="skills-daily-dash" aria-hidden="true">—</span>`
					: dailyStarsMarkup(skill.daily);
				return (
					`<div class="skills-row" role="row">` +
					`<div class="skills-cell skills-cell-icon" role="cell">` +
					schoolIconImg(skill.icon) +
					`<span class="skills-label">${skill.label}</span>` +
					`</div>` +
					`<div class="skills-cell skills-cell-time" role="cell">${skill.timeLabel}</div>` +
					`<div class="skills-cell skills-cell-daily" role="cell" title="${starLabel}">` +
					`<span class="skills-daily-label">Daily</span>` +
					dailyCell +
					`</div>` +
					`<div class="skills-cell skills-cell-grade" role="cell">` +
					`<span class="${skill.colour} skills-grade-letter">${skill.letter}</span>` +
					`</div>` +
					`<div class="skills-cell skills-cell-score" role="cell">` +
					`<span class="${skill.pctColour} skills-grade-pct">${skill.score}%</span>` +
					`<div class="skills-grade-bar" role="presentation" aria-hidden="true">` +
					`<div class="skills-grade-bar-fill ${skill.pctColour}" style="width:${skill.barFill}%"></div>` +
					`</div>` +
					`</div>` +
					`</div>`
				);
			})
			.join("");

		const lifeSkills =
			typeof Skills !== "undefined" && Skills.skillsSectionMarkup
				? Skills.skillsSectionMarkup(vars)
				: "";

		return (
			`<div class="skills">` +
			`<h3 class="skills-section">School</h3>` +
			`<div class="skills-table" role="table" aria-label="School skills">` +
			`<div class="skills-header" role="row">` +
			`<div class="skills-cell skills-cell-icon" role="columnheader">Skill</div>` +
			`<div class="skills-cell skills-cell-time" role="columnheader">Time</div>` +
			`<div class="skills-cell skills-cell-daily" role="columnheader">Daily Progress</div>` +
			`<div class="skills-cell skills-cell-grade" role="columnheader">Grade</div>` +
			`<div class="skills-cell skills-cell-score" role="columnheader">Pass Chance</div>` +
			`</div>` +
			rows +
			`</div>` +
			lifeSkills +
			`</div>`
		);
	}

	/**
	 * Opens the Skills modal. Life skills are always shown; school table is younger-only.
	 */
	function openDialog() {
		if (typeof Skills !== "undefined" && Skills.openDialog) {
			Skills.openDialog();
			return;
		}
		ensure();
		Dialog.setup("Skills", "skills-dialog");
		Dialog.wiki("<<skillsContents>>");
		Dialog.open();
	}

	function isSchoolDay(variables) {
		const vars = variables || V();
		return applies(vars) && World.isWeekday(vars);
	}

	/**
	 * Fifth-period elective (after lunch): History Mon/Wed; Art Tue/Thu; Guest lecture Fri.
	 */
	function period3Subject(variables) {
		const day = weekdayNum(variables);
		if (day === 5) return "Guest Lecture";
		if (day === 2 || day === 4) return "Art";
		return "History";
	}

	function isGuestEligible(id, variables) {
		if (id === "rafayel") return true;
		if (id === "zayne" || id === "valko" || id === "gideon") {
			return typeof LoveInterests !== "undefined" && LoveInterests.hasMet(id, variables);
		}
		return false;
	}

	/**
	 * Friday guest for today: scheduled slot, then walk forward until eligible.
	 * Zayne/Valko/Gideon require hasMet from outside school; Rafayel is always eligible.
	 */
	function fridayGuestId(variables) {
		const vars = variables || V();
		const start = ((weekIndex(vars) % 3) + 3) % 3;
		for (let i = 0; i < FRIDAY_GUESTS.length; i += 1) {
			const id = FRIDAY_GUESTS[(start + i) % FRIDAY_GUESTS.length];
			if (isGuestEligible(id, vars)) return id;
		}
		return "rafayel";
	}

	function guestLectureTitle(variables) {
		const id = fridayGuestId(variables);
		const name = typeof LoveInterests !== "undefined" ? LoveInterests.displayName(id, variables) : id;
		return name ? "Guest Lecture (" + name + ")" : "Guest Lecture";
	}

	/**
	 * Room for the after-lunch elective: History, Art, or Lecture Hall on guest Fridays.
	 */
	function period3Room(variables) {
		const elective = period3Subject(variables);
		if (elective === "Guest Lecture") return room("lectureHall");
		if (elective === "Art") return room("art");
		return room("history");
	}

	function periodsForDay(variables) {
		const vars = variables || V();
		if (!applies(vars)) return [];
		const elective = period3Subject(vars);
		const electiveRoom = period3Room(vars);

		const physics = room("physics");
		const math = room("math");
		const tech = room("computerLab");
		const lunch = room("lunch");
		const track = room("track");

		return [
			{
				key: "p1",
				title: "Physics",
				attendLabel: "Attend Physics Class",
				roomKey: physics.key,
				classroomLabel: physics.label,
				passage: physics.passage,
				icon: physics.icon,
				minutes: physics.minutes,
				gradeKey: "physics",
				start: 9 * 60,
				end: 9 * 60 + 50,
			},
			{
				key: "p2",
				title: "Math",
				attendLabel: "Attend Math Class",
				roomKey: math.key,
				classroomLabel: math.label,
				passage: math.passage,
				icon: math.icon,
				minutes: math.minutes,
				gradeKey: "math",
				start: 10 * 60,
				end: 10 * 60 + 50,
			},
			{
				key: "p3",
				title: "Tech",
				attendLabel: "Attend Tech Class",
				roomKey: tech.key,
				classroomLabel: tech.label,
				passage: tech.passage,
				icon: tech.icon,
				minutes: tech.minutes,
				gradeKey: "tech",
				start: 11 * 60,
				end: 11 * 60 + 50,
			},
			{
				key: "lunch",
				title: "Lunch",
				attendLabel: "Go to the cafeteria",
				roomKey: lunch.key,
				classroomLabel: lunch.label,
				passage: lunch.passage,
				icon: lunch.icon,
				minutes: lunch.minutes,
				gradeKey: null,
				start: 11 * 60 + 50,
				end: 13 * 60,
			},
			{
				key: "p4",
				title: elective === "Guest Lecture" ? guestLectureTitle(vars) : elective,
				attendLabel:
					elective === "Guest Lecture"
						? "Attend Guest Lecture"
						: "Attend " + elective + " Class",
				roomKey: electiveRoom.key,
				classroomLabel: electiveRoom.label,
				passage: electiveRoom.passage,
				icon: electiveRoom.icon,
				minutes: electiveRoom.minutes,
				gradeKey: elective === "Guest Lecture" ? null : elective.toLowerCase(),
				start: 13 * 60 + 10,
				end: 14 * 60,
			},
			{
				key: "p5",
				title: "PE",
				attendLabel: "Attend PE Class",
				roomKey: track.key,
				classroomLabel: track.label,
				passage: track.passage,
				icon: track.icon,
				minutes: track.minutes,
				gradeKey: "pe",
				start: 14 * 60 + 10,
				end: 15 * 60,
			},
		];
	}

	/**
	 * Campus rooms for the gate list. Pass "outside", "facilities", or "classrooms"
	 * to filter; omit for every room. Independent of the timetable: rooms are listed
	 * whether or not a class is running or has already been attended.
	 */
	function campusRooms(section, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return [];
		return ROOMS.filter(r => !r.hidden && (!section || r.section === section)).map(r => ({
			key: r.key,
			label: r.label,
			passage: r.passage,
			minutes: r.minutes,
			icon: r.icon || "",
			actionIcon: r.actionIcon || "",
		}));
	}

	function periodByKey(key, variables) {
		return periodsForDay(variables).find(p => p.key === key) || null;
	}

	function hasAttended(periodKey, variables) {
		const vars = variables || V();
		if (!applies(vars)) return false;
		ensure(vars);
		const day = vars.school.attended[dayKey(vars)];
		return !!(day && day[periodKey]);
	}

	function attendClass(periodKey, variables) {
		const vars = variables || V();
		if (!applies(vars)) return false;
		ensure(vars);
		const key = dayKey(vars);
		if (!vars.school.attended[key] || typeof vars.school.attended[key] !== "object") {
			vars.school.attended[key] = {};
		}
		vars.school.attended[key][periodKey] = true;
		return true;
	}

	function periodForRoom(roomKey, variables) {
		const vars = variables || V();
		if (!roomKey) return null;
		return periodsForDay(vars).find(p => p.roomKey === roomKey) || null;
	}

	/**
	 * Whether this classroom's graded period is in session and not yet attended.
	 */
	function isRoomInSession(roomKey, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		const period = periodForRoom(roomKey, vars);
		if (!period || !period.gradeKey) return false;
		if (hasAttended(period.key, vars)) return false;
		const now = World.minutesOfDay(vars);
		return now >= period.start && now < period.end;
	}

	/**
	 * Minutes before a period starts when early arrival / study / setup is allowed.
	 * First period: 1 hour (from campus open). After-lunch elective: lunch + passing.
	 * Other periods: passing window only.
	 */
	function earlyWindowMinutes(period, variables) {
		if (!period) return STUDY_BEFORE_WINDOW;
		if (period.key === "p1") return FIRST_STUDY_WINDOW;
		if (period.key === "p4") {
			const lunch = periodByKey("lunch", variables);
			if (lunch) return Math.max(STUDY_BEFORE_WINDOW, period.start - lunch.start);
		}
		return STUDY_BEFORE_WINDOW;
	}

	/**
	 * Period to use for early arrival in a room. Usually the gate period; the
	 * after-lunch elective also opens once lunch starts so you can go study there.
	 */
	function earlyPeriodForRoom(roomKey, variables) {
		const vars = variables || V();
		const gate = gatePeriod(vars);
		if (gate && gate.roomKey === roomKey) return gate;
		const elective = periodByKey("p4", vars);
		if (!elective || elective.roomKey !== roomKey) return null;
		if (hasAttended(elective.key, vars)) return null;
		const now = World.minutesOfDay(vars);
		if (now >= elective.start) return null;
		return elective;
	}

	/**
	 * After-lunch room (History / Art / Lecture Hall) while lunch is the gate period.
	 */
	function gateElective(variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return null;
		const gate = gatePeriod(vars);
		if (!gate || gate.key !== "lunch") return null;
		const elective = periodByKey("p4", vars);
		if (!elective || hasAttended(elective.key, vars)) return null;
		const now = World.minutesOfDay(vars);
		if (now >= elective.start) return null;
		const roomLabel = String(elective.classroomLabel || "").toLowerCase();
		return {
			key: elective.key,
			roomKey: elective.roomKey,
			goLabel: "Go to the " + roomLabel,
			passage: elective.passage,
			icon: elective.icon,
			minutes: elective.minutes,
		};
	}

	/**
	 * Early-arrival blurb for a campus room: only the next class in the timetable,
	 * and only inside that period's early window.
	 */
	function earlyArrival(roomKey, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return null;
		const period = earlyPeriodForRoom(roomKey, vars);
		if (!period || period.roomKey !== roomKey) return null;
		if (hasAttended(period.key, vars)) return null;
		const now = World.minutesOfDay(vars);
		if (now >= period.start) return null;
		const wait = period.start - now;
		if (wait > earlyWindowMinutes(period, vars)) return null;
		const copy = EARLY_COPY[roomKey] || {
			enter: "You arrive early. No one else is here yet.",
			subject: period.gradeKey,
			lesson: (period.title || "class").toLowerCase() + " lesson",
		};
		const grade = period.gradeKey ? getGrade(period.gradeKey, vars) : null;
		const startHour = Math.floor(period.start / 60);
		const startMinute = period.start % 60;
		return {
			roomKey,
			periodKey: period.key,
			enter: copy.enter,
			subject: copy.subject,
			lesson: copy.lesson,
			letter: grade ? grade.letter : null,
			comment: grade ? grade.comment : null,
			startLabel: World.formatTimeAt(startHour, startMinute, vars),
		};
	}

	/**
	 * Next period you can sit from the gates: from 8:00 until that period ends,
	 * then the following unattended period, and so on.
	 */
	function gatePeriod(variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return null;
		ensure(vars);
		const now = World.minutesOfDay(vars);
		if (now < GATE_OPEN) return null;
		return periodsForDay(vars).find(p => !hasAttended(p.key, vars) && now < p.end) || null;
	}

	/**
	 * How many classroom turns this period allows (4 on normal days, 2 before an exam).
	 */
	function maxTurnsForPeriod(periodKey, variables) {
		const period = periodByKey(periodKey, variables);
		if (!period || !period.gradeKey) return TURNS_PER_CLASS;
		return isExamDayForSubject(period.gradeKey, variables) ? TURNS_PER_EXAM_CLASS : TURNS_PER_CLASS;
	}

	function getPeriodTurns(periodKey, variables) {
		const vars = variables || V();
		if (!applies(vars) || !periodKey) return 0;
		ensure(vars);
		const day = vars.school.periodTurns[dayKey(vars)];
		const n = day && typeof day === "object" ? Number(day[periodKey]) || 0 : 0;
		return Math.max(0, Math.floor(n));
	}

	function addPeriodTurn(periodKey, variables) {
		const vars = variables || V();
		if (!applies(vars) || !periodKey) return 0;
		ensure(vars);
		const key = dayKey(vars);
		if (!vars.school.periodTurns[key] || typeof vars.school.periodTurns[key] !== "object") {
			vars.school.periodTurns[key] = {};
		}
		const day = vars.school.periodTurns[key];
		const next = getPeriodTurns(periodKey, vars) + 1;
		day[periodKey] = next;
		return next;
	}

	/**
	 * Minutes the next classroom turn will advance for this period.
	 * Splits remaining class time across turns left (4 on normal days).
	 */
	function turnMinutes(periodKey, variables) {
		const vars = variables || V();
		if (!applies(vars)) return 15;
		const period = periodByKey(periodKey, vars);
		if (!period || !period.gradeKey) return 15;
		const now = World.minutesOfDay(vars);
		const remaining = Math.max(1, period.end - Math.max(now, period.start));
		const done = getPeriodTurns(periodKey, vars);
		const turnsLeft = Math.max(1, maxTurnsForPeriod(periodKey, vars) - done);
		return Math.max(1, Math.ceil(remaining / turnsLeft));
	}

	/**
	 * Whether the PC can take a Focus turn during this graded period (in-session).
	 * Normal days: up to 4 turns (stars only while under gold, on Focus).
	 * Exam days: up to 2 turns before the test.
	 */
	function canFocus(periodKey, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		const period = periodByKey(periodKey, vars);
		if (!period || !period.gradeKey) return false;
		ensure(vars);
		if (hasAttended(periodKey, vars)) return false;
		if (getPeriodTurns(periodKey, vars) >= maxTurnsForPeriod(periodKey, vars)) return false;
		const now = World.minutesOfDay(vars);
		return now >= period.start && now < period.end;
	}

	/**
	 * Focus in class: spend one classroom turn, advance time, and gain understanding.
	 * Awards a daily star only while under gold (max 3). Later turns can be
	 * understanding-only; the final turn finishes a normal lesson.
	 * Exam days: study turns do not finish the class — takeExam does.
	 */
	function focus(periodKey, variables) {
		const vars = variables || V();
		if (!canFocus(periodKey, vars)) return null;
		const period = periodByKey(periodKey, vars);
		const examDay = isExamDayForSubject(period.gradeKey, vars);
		const minutes = turnMinutes(periodKey, vars);
		const turns = addPeriodTurn(periodKey, vars);
		let stars = getDailyProgress(period.gradeKey, vars);
		/* Tech uses life-skill Focus tracks instead of daily stars. */
		if (period.gradeKey !== "tech" && stars < MAX_DAILY_STARS) {
			stars = addDailyProgress(period.gradeKey, 1, vars);
		}
		addUnderstanding(period.gradeKey, FOCUS_UNDERSTANDING, vars);
		World.advance(minutes, vars);
		const now = World.minutesOfDay(vars);
		const maxTurns = maxTurnsForPeriod(periodKey, vars);
		if (!examDay && (turns >= maxTurns || now >= period.end)) {
			attendClass(periodKey, vars);
			const after = World.minutesOfDay(vars);
			if (after < period.end) {
				World.advance(period.end - after, vars);
			}
		} else if (examDay && now >= period.end) {
			attendClass(periodKey, vars);
		}
		return stars;
	}

	/**
	 * Whether this period is offering its weekly exam right now.
	 */
	function canTakeExam(periodKey, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		const period = periodByKey(periodKey, vars);
		if (!period || !period.gradeKey) return false;
		if (!isExamDayForSubject(period.gradeKey, vars)) return false;
		ensure(vars);
		if (hasAttended(periodKey, vars)) return false;
		const now = World.minutesOfDay(vars);
		return now >= period.start && now < period.end;
	}

	/**
	 * Sit the weekly exam. Pass chance = understanding % (roll 1–100; pass if chance >= roll).
	 * Pass raises the letter grade and resets understanding. Fail keeps the letter.
	 * Always finishes the period. Returns a result object for UI.
	 */
	function takeExam(periodKey, variables) {
		const vars = variables || V();
		if (!canTakeExam(periodKey, vars)) return null;
		const period = periodByKey(periodKey, vars);
		const subject = period.gradeKey;
		const skill = SKILLS.find(s => s.key === subject);
		const before = getLetter(subject, vars);
		const chance = examPassChance(subject, vars);
		const roll = getRandomIntInclusive(1, 100);
		const passed = chance >= roll;
		let after = before;
		let distinction = false;
		if (passed) {
			if (before === "S") {
				distinction = true;
				vars.school.understanding[subject] = 0;
			} else {
				after = promoteGrade(subject, vars);
			}
		}
		attendClass(periodKey, vars);
		const now = World.minutesOfDay(vars);
		if (now < period.end) {
			World.advance(period.end - now, vars);
		}
		const result = {
			periodKey,
			subject,
			label: skill ? skill.label : subject,
			passed,
			roll,
			chance: Math.round(chance),
			before,
			after,
			distinction,
		};
		vars.schoolExamResult = result;
		return result;
	}

	/**
	 * Free-time study (library): earn a daily star (up to gold) and understanding.
	 */
	function canStudy(subject, variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		if (!subject || !(subject in DEFAULT_LETTERS)) return false;
		/* Tech has no daily stars; progress comes from class Focus skill tracks. */
		if (subject === "tech") return false;
		ensure(vars);
		return getDailyProgress(subject, vars) < 3;
	}

	/**
	 * True while the lunch period is underway (after Tech ends until 13:00).
	 */
	function isInLunchPeriod(variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		const lunch = periodByKey("lunch", vars);
		if (!lunch) return false;
		const now = World.minutesOfDay(vars);
		return now >= lunch.start && now < lunch.end;
	}

	/**
	 * Minutes a free-time study action advances.
	 */
	function studySessionMinutes() {
		return STUDY_MINUTES;
	}

	function study(subject, variables) {
		const vars = variables || V();
		if (!canStudy(subject, vars)) return null;
		const minutes = studySessionMinutes();
		const stars = addDailyProgress(subject, 1, vars);
		const understanding = addUnderstanding(subject, STUDY_UNDERSTANDING, vars);
		World.advance(minutes, vars);
		return { subject, stars, understanding, minutes };
	}

	function studyOptions(variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return [];
		const minutes = studySessionMinutes();
		return SKILLS.filter(skill => canStudy(skill.key, vars)).map(skill => ({
			key: skill.key,
			label: skill.label,
			icon: skill.icon,
			stars: getDailyProgress(skill.key, vars),
			understanding: getUnderstanding(skill.key, vars),
			minutes,
		}));
	}

	function formatActionMinutes(minutes) {
		const n = Math.max(0, Math.floor(Number(minutes) || 0));
		const h = Math.floor(n / 60);
		const m = n % 60;
		return `${h}:${String(m).padStart(2, "0")}`;
	}

	/**
	 * Early study in Physics / Math / History / Art: that class's early window
	 * (1 hour before first period, lunch-through-start for the after-lunch elective,
	 * 10 minutes otherwise).
	 */
	function canStudyBeforeClass(roomKey, variables) {
		const vars = variables || V();
		const early = earlyArrival(roomKey, vars);
		if (!early || !early.periodKey) return false;
		const period = periodByKey(early.periodKey, vars);
		if (!period || !period.gradeKey) return false;
		if (STUDY_BEFORE_SUBJECTS.indexOf(period.gradeKey) < 0) return false;
		if (period.roomKey !== roomKey) return false;
		return canStudy(period.gradeKey, vars);
	}

	function studyBeforeMinutes(roomKey, variables) {
		const vars = variables || V();
		const early = earlyArrival(roomKey, vars);
		if (!early) return 0;
		const period = periodByKey(early.periodKey, vars);
		if (!period) return 0;
		const now = World.minutesOfDay(vars);
		return Math.max(1, period.start - now);
	}

	/**
	 * Link reward markup: | + (bronze/silver/gold star) ClassName
	 */
	function studyBeforeEffectMarkup(roomKey, variables) {
		const vars = variables || V();
		const early = earlyArrival(roomKey, vars);
		if (!early) return "";
		const period = periodByKey(early.periodKey, vars);
		if (!period || !period.gradeKey) return "";
		const subject = period.gradeKey;
		const next = clampDaily(getDailyProgress(subject, vars) + 1);
		return dailyStarEffectMarkup(subject, next);
	}

	/**
	 * Study until the period starts: consume all wait time, earn one daily star.
	 * Stores $schoolStudyBefore for classroom flavor text.
	 */
	function studyBeforeClass(roomKey, variables) {
		const vars = variables || V();
		if (!canStudyBeforeClass(roomKey, vars)) return null;
		const early = earlyArrival(roomKey, vars);
		const period = periodByKey(early.periodKey, vars);
		const subject = period.gradeKey;
		const letter = getLetter(subject, vars);
		const minutes = studyBeforeMinutes(roomKey, vars);
		const stars = addDailyProgress(subject, 1, vars);
		World.advance(minutes, vars);
		const result = {
			roomKey,
			subject,
			label: STUDY_BEFORE_LABELS[subject] || subject,
			letter,
			stars,
			minutes,
			general: STUDY_BEFORE_GENERAL,
			detail: STUDY_BEFORE_BY_GRADE[letter] || STUDY_BEFORE_BY_GRADE.D,
			effectMarkup: dailyStarEffectMarkup(subject, stars),
		};
		vars.schoolStudyBefore = result;
		return result;
	}

	function isCalebWaitingWindow(variables) {
		const vars = variables || V();
		if (!isSchoolDay(vars)) return false;
		return !World.isBefore(14, 45, vars) && World.isBefore(16, 0, vars);
	}

	Object.assign(School, {
		createDefaults,
		ensure,
		applies,
		isSchoolDay,
		period3Subject,
		fridayGuestId,
		periodsForDay,
		campusRooms,
		gateElective,
		periodByKey,
		periodForRoom,
		isRoomInSession,
		hasAttended,
		attendClass,
		canFocus,
		focus,
		turnMinutes,
		getPeriodTurns,
		maxTurnsForPeriod,
		isExamDayForSubject,
		examPassChance,
		focusSuccessChance,
		canTakeExam,
		takeExam,
		canStudy,
		study,
		studyOptions,
		studySessionMinutes,
		isInLunchPeriod,
		canStudyBeforeClass,
		studyBeforeMinutes,
		studyBeforeEffectMarkup,
		studyBeforeClass,
		formatActionMinutes,
		earlyArrival,
		getGrade,
		getLetter,
		getUnderstanding,
		addUnderstanding,
		promoteGrade,
		demoteGrade,
		processMidnight,
		processNewDay,
		gradeColourClass,
		scoreColourClass,
		qualityTier,
		qualityClass,
		getDailyProgress,
		addDailyProgress,
		dailyStarIcon,
		dailyStarIcons,
		dailyStarsMarkup,
		dailyStarEffectMarkup,
		skillsList,
		skillsMarkup,
		colourCodesLegendMarkup,
		colourCodesTipMarkup,
		openDialog,
		gatePeriod,
		isCalebWaitingWindow,
		QUALITY_CLASSES,
		QUALITY_LABELS,
		GRADE_ORDER,
		SUNDAY_PROMOTE_AT,
		DEMOTE_AT,
		STUDY_MINUTES,
		STUDY_BEFORE_WINDOW,
		FIRST_STUDY_WINDOW,
		MAX_DAILY_STARS,
		TURNS_PER_CLASS,
		SKILLS,
	});
})();

