/**
 * Campus rooms, timetable, study-before copy, and grade-curve tables. Engine: School.
 */

(function () {
	"use strict";

	const FRIDAY_GUESTS = ["rafayel", "zayne", "valko", "gideon"];
	/** Earliest time the gate "Attend … Class" link appears on a school day. */
	const GATE_OPEN = 8 * 60;
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

	ConstantsLoader.add("school", {
		fridayGuests: FRIDAY_GUESTS,
		gateOpen: GATE_OPEN,
		defaultLetters: DEFAULT_LETTERS,
		defaultUnderstanding: DEFAULT_UNDERSTANDING,
		starUnderstanding: STAR_UNDERSTANDING,
		maxDailyStars: MAX_DAILY_STARS,
		turnsPerClass: TURNS_PER_CLASS,
		turnsPerExamClass: TURNS_PER_EXAM_CLASS,
		focusUnderstanding: FOCUS_UNDERSTANDING,
		studyMinutes: STUDY_MINUTES,
		studyUnderstanding: STUDY_UNDERSTANDING,
		studyBeforeSubjects: STUDY_BEFORE_SUBJECTS,
		firstStudyWindow: FIRST_STUDY_WINDOW,
		studyBeforeWindow: STUDY_BEFORE_WINDOW,
		studyBeforeLabels: STUDY_BEFORE_LABELS,
		studyBeforeGeneral: STUDY_BEFORE_GENERAL,
		studyBeforeByGrade: STUDY_BEFORE_BY_GRADE,
		understandingMin: UNDERSTANDING_MIN,
		understandingMax: UNDERSTANDING_MAX,
		demoteAt: DEMOTE_AT,
		sundayPromoteAt: SUNDAY_PROMOTE_AT,
		weeklyDecay: WEEKLY_DECAY,
		skills: SKILLS,
		qualityClasses: QUALITY_CLASSES,
		qualityLabels: QUALITY_LABELS,
		gradeComments: GRADE_COMMENTS,
		rooms: ROOMS,
		earlyCopy: EARLY_COPY,
		focusGradeBonus: FOCUS_GRADE_BONUS,
	});
})();
