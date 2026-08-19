/**
 * Math class vignette pools. Engine: MathClass + ClassLesson.create.
 */

(function () {
	"use strict";

	const DURING = [
		{
			id: "spouse-circle",
			text: 'Professor Zhang pauses halfway through writing an equation. “Now, this next part is very important.” He turns dramatically toward the class. “You must remember this! Your future spouse may ask you to calculate the area of a circle one day.” The class is thoroughly amused.',
			effects: { stress: "-" },
		},
		{
			id: "writes-on-wall",
			text: "Professor Zhang writes a particularly long equation across the board. When he reaches the edge, he pauses, looks at the remaining space, and simply continues onto the wall beside it.",
		},
		{
			id: "elaborate-metaphor",
			text: "The Professor attempts to explain a complicated formula using an unnecessarily elaborate metaphor. Somehow, the metaphor becomes more confusing than the formula itself.",
		},
		{
			id: "what-page",
			text: 'Professor Zhang asks everyone to turn to a specific page. Several students begin flipping through their textbooks. “Page 247, my young friends!” A student raises their hand abruptly. “Yes?” The Professor smiles. “What page?” the student asks. Professor Zhang stares at them for a long moment. “…247.”',
		},
		{
			id: "projector-huff",
			text: 'After several minutes spent attempting to connect his laptop to the projector, Professor Zhang gives up in a huff. The screen repeatedly refuses to cooperate. “This is exactly why I prefer chalk, my young friends.”',
		},
		{
			id: "smartwatch",
			text: 'Professor Zhang’s smartwatch begins vibrating repeatedly on his wrist. He looks down at it, puckering his lips. “…Apparently, I am supposed to stand up and walk around.” He begins walking around the classroom, looking over everyone’s shoulders to check their work. For some reason, he lingers a little longer beside you.',
			effects: { stress: "+" },
		},
		{
			id: "aching-hand",
			text: "Your hand begins to ache from writing. You flex your fingers beneath the desk before returning to your notes.",
			effects: { pain: "+" },
		},
		{
			id: "finish-early",
			text: "You finish the problem before most of the class, checking your answer twice, just to make sure you haven't made any mistakes.",
			effects: { control: "+" },
		},
		{
			id: "blue-birds",
			text: 'Professor Zhang gets distracted by a pair of blue birds sitting on the ledge outside the classroom window. He watches for several seconds, mumbling something under his breath about how he longs to find “his own blue bird someday.” Then, suddenly, he remembers that he is supposed to be teaching. “My apologies, my young friends… Now, where were we, again?”',
		},
		{
			id: "numbers-blur",
			text: "You stare at a particularly complicated equation until the numbers begin to blur together.",
			effects: { energy: "-", stress: "+" },
		},
		{
			id: "classmate-groans",
			text: "Someone across the room quietly groans after looking at their worksheet. You can't help but feel a little better knowing you're not the only one struggling.",
			effects: { stress: "-" },
		},
		{
			id: "exchange-notes",
			text: "You exchange notes with another student beside you.",
		},
		{
			id: "fuck-marry-kill",
			text: "You hear an exchange between two students in the class. They're talking about which Professors they would fuck, marry, and kill: Lorenz, Zhang, and Qi are mentioned. You feel flustered, heat rising in the pit of your stomach as you imagine each Professor engulfing you in a tender, forbidden embrace.",
			effects: { arousal: "+" },
		},
		{
			id: "tea-sip",
			text: "Professor Zhang takes a sip of tea, droplets of the concoction spilling past his lips. He sweeps a thumb over the side of his mouth, playing it off by sweeping his lithe fingers through his hair.",
			effects: { arousal: "+" },
		},
		{
			id: "familiar-formula",
			text: "You recognize a formula from an earlier lesson. The familiar equation gives you a small boost of confidence.",
			effects: { control: "+" },
		},
		{
			id: "chalk-falls",
			text: "A piece of chalk falls to the floor. Professor Zhang bends over to pick it up, giving you a clear view of his toned ass.",
			effects: { arousal: "+" },
		},
		{
			id: "who-will-solve",
			text: '“All right! Would anyone like to try and solve this equation before the rest of the class?” Professor Zhang asks, only to be met with complete and utter silence.',
		},
		{
			id: "projector-relationship",
			text: 'Professor Zhang attempts to connect his laptop to the projector for the millionth time. While he has brief success, it shuts down the very next minute. He stares at the blank screen, before looking at the ground. “I see our relationship means nothing to you.” He sighs and reaches for the chalk.',
		},
		{
			id: "projector-success",
			text: 'Professor Zhang successfully gets the projector working on his first attempt. He looks genuinely surprised, before a proud smile spreads across his face. “I see. I am becoming quite modern!”',
			effects: { stress: "-" },
		},
		{
			id: "dim-lights",
			text: 'For some reason, the Professor starts complaining that the classroom lights are too bright. He walks toward the front and dims them considerably. “There. Much better.” The room is now almost too dark.',
			effects: { energy: "-" },
		},
		{
			id: "looking-at-you",
			text: "Your classmate slides you a note: <i>Professor Zhang is looking at you.</i>",
			effects: { stress: "+", arousal: "+" },
		},
	];

	const END = [
		{
			id: "holds-class",
			text: 'The bell rings, but Professor Zhang waves his hand, preventing everyone from leaving.<br><br>“It’s imperative you all know how to solve this equation! You will see another one like this in your homework tonight!” He continues with his demonstration.<br><br>Soon enough, seven minutes pass. Students immediately pile out of the room, hopeful they’ll have enough time to make it to their next class.',
			minutes: 7,
		},
		{
			id: "quiet-dismissal",
			text: 'The bell rings, and chairs scrape against the floor as students begin gathering their belongings.<br><br>Professor Zhang cracks open his book, waving everyone out with a grin.<br><br>“Goodbye, my young friends.”',
			minutes: 1,
		},
	];

	const FOCUS = [
		{
			id: "check-your-work",
			text:
				"Professor Zhang finishes another demonstration, writing a problem on the board. He asks everyone to solve it.<br><br>You work through your calculations, being thorough with each step. Your answer doesn't match when he walks through the problem.",
			choices: [
				{
					id: "check-work",
					label: "Check your work.",
					effects: { control: "+" },
					bonusStar: true,
					result:
						"You carefully go through each step in your work again, until you find the mistake. Looks like you mixed up two signs.",
				},
				{
					id: "start-over",
					label: "Start over.",
					effects: { energy: "-" },
					bonusStar: true,
					result:
						"You erase everything and start over from the beginning until the answer matches the one on the board.",
				},
				{
					id: "give-up",
					label: "Give up.",
					effects: { stress: "+" },
					result:
						"You decide working through such a complex equation isn't worth the headache.",
				},
			],
		},
		{
			id: "explain-method",
			text:
				'Professor Zhang walks around the classroom, checking everyone’s work. He stops at your desk.<br><br>“It seems you have the correct answer. But… how did you arrive at the conclusion?”',
			choices: [
				{
					id: "explain",
					label: "Explain your method.",
					effects: { control: "+" },
					bonusStar: true,
					result:
						'You walk him through your calculations. He listens carefully before nodding.<br><br>“Excellent. Understanding the answer is much more valuable than simply knowing it.”',
				},
				{
					id: "dont-remember",
					label: "Admit you don't remember.",
					effects: { stress: "-" },
					bonusStar: true,
					result:
						'You stare at your work, lost for words. You know the answer is right, you just can\'t remember how you got there.<br><br>Professor Zhang simply chuckles. “Well, that\'s something we\'ll have to work on~”',
				},
			],
		},
		{
			id: "formula-memory",
			text:
				"You need a particular formula to solve the problem on a pop quiz Professor Zhang sprung on everyone.<br><br>You remember most of it, but you wouldn't say you have the formula committed to memory just yet…",
			choices: [
				{
					id: "trust-memory",
					label: "Trust your memory.",
					successChance: "understanding",
					success: {
						result: "You write down what you remember and use it to solve the problem.",
						effects: { control: "+" },
						bonusStar: true,
					},
					failure: {
						result: "You write down what you remember and use it to solve the problem. Unfortunately, your recollection was a little off.",
						effects: { stress: "+", control: "-" },
					},
				},
				{
					id: "look-it-up",
					label: "Look it up.",
					effects: { energy: "-" },
					bonusStar: true,
					result:
						"You flip through your notes until you stop on the formula in question; looks like you knew it all along.",
				},
			],
		},
	];

	ConstantsLoader.add("mathClass", {
		during: DURING,
		end: END,
		focus: FOCUS,
	});
})();
