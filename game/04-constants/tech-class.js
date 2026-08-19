/**
 * Tech class vignette pools. Engine: TechClass + ClassLesson.create.
 */

(function () {
	"use strict";

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

	ConstantsLoader.add("techClass", {
		during: DURING,
		end: END,
		setup: SETUP,
		project: PROJECT,
		coding: CODING,
		focusChoices: FOCUS_CHOICES,
	});
})();
