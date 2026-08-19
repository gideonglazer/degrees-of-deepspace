/**
 * Physics class vignette pools. Engine: PhysicsClass + ClassLesson.create.
 */

(function () {
	"use strict";

	/** Weather keys treated as sunny for classroom sunlight beats. */
	const SUNNY = ["clear", "fair"];
	/** Weather keys treated as raining. */
	const RAINING = ["rain", "storm"];

	const DURING = [
		{
			id: "centripetal",
			text: "Professor Lorenz drones on about centripetal force, following up with a brief demonstration that is much more interesting than what he has to say.",
		},
		{
			id: "boring-story",
			text: "You can barely keep your eyes open as Professor Lorenz goes on about a boring, personal experience he had to endure. Somehow, he relates it back to the subject he was talking about.",
			effects: { energy: "-" },
		},
		{
			id: "speed-velocity",
			text: "A student raises their hand, asking a question barely above a whisper. Professor Lorenz provides brief oversight about the difference between speed and velocity in response.",
		},
		{
			id: "principle-ashina",
			text: "“…’s not about that, it’s about the principle, Miss Ashina.” the Professor snaps at a student, drawing your attention back to the front of the class. Seems they were having a heated debate about perpetual motion and its relativity to the laws of thermodynamics and energy conservation.",
		},
		{
			id: "sunlight",
			text: "Sunlight streams through the classroom windows, making it difficult to see the writing on the board.",
			effects: { energy: "-" },
			weather: SUNNY,
		},
		{
			id: "rain",
			text: "Rain taps against the windows. The classroom grows noticeably darker as the clouds pass overhead.",
			effects: { stress: "-" },
			weather: RAINING,
		},
		{
			id: "textbook",
			text: "The class is quiet as Professor Lorenz allows everyone the opportunity to read through a section of the textbook.",
		},
		{
			id: "diagram",
			text: "Professor Lorenz pauses mid-sentence to draw an unnecessarily complicated diagram on the board. After staring at it for a moment, you realize you have absolutely no idea what any of it means. The Professor doesn’t understand it either…",
		},
		{
			id: "answers-himself",
			text: "Professor Lorenz asks the class a question. Nobody answers. He waits, but the silence stretches on long enough that he finally sighs and answers it himself.",
		},
		{
			id: "asleep",
			text: "You notice a student has fallen asleep with their textbook propped up before them. Professor Lorenz walks past without saying anything, seemingly choosing to let them suffer the consequences at a later time.",
		},
		{
			id: "good-question",
			text: "Someone raises their hand with an unusually complicated question. Professor Lorenz considers it for a moment before condescendingly admitting that it’s “a surprisingly good question.”",
		},
		{
			id: "projector",
			text: "The projector flickers off in the middle of a presentation. Professor Lorenz rapidly begins to press the clicker in his hand. Nothing happens. He stares at the blank screen with increasing irritation before deciding to continue without it.",
		},
		{
			id: "pop-quiz",
			text: "Professor Lorenz announces a pop quiz. A collective groan passes through the class.",
			effects: { stress: "++" },
		},
		{
			id: "doodling",
			text: "You find yourself doodling in the margins of your notes. Before you know it, you’ve filled half the page with tiny sketches.",
			effects: { stress: "-" },
		},
		{
			id: "sneeze",
			text: "A student sneezes loudly enough to interrupt the lecture. Professor Lorenz stops, looks toward them with a deadpan expression, and simply says, “Bless you,” before continuing.",
		},
		{
			id: "aching-hand",
			text: "Your hand begins to ache from taking notes. You glance at the clock. Barely any time has passed…",
			effects: { pain: "+" },
		},
		{
			id: "what-page",
			text: "Professor Lorenz asks everyone to turn to a particular page. Several students immediately begin flipping through their books. Someone asks, “What page?” despite the Professor having just said it.",
		},
		{
			id: "whispering",
			text: "You hear quiet whispering from somewhere behind you. It stops abruptly when Professor Lorenz turns toward the sound.",
		},
		{
			id: "erase-board",
			text: "The professor erases part of the board, only to realize he still needs it. He stares at the blank space for a moment before sighing and rewriting everything.",
		},
		{
			id: "clock-ticks",
			text: "The clock ticks loudly during a particularly quiet portion of the lecture.",
			effects: { energy: "-" },
		},
		{
			id: "stomach",
			text: "Your stomach growls. You hope nobody heard that…",
			effects: { hunger: "+" },
		},
	];

	const END = [
		{
			id: "bell-dismiss",
			text: "The bell rings, students making haste to leave the room. However, Professor Lorenz demands everyone sit back down.<br><br>“The bell doesn’t dismiss you, I do.” He scowls.<br><br>A couple of minutes pass, before he finally allows everyone to go on with their day.",
			minutes: 5,
		},
		{
			id: "newspaper",
			text: "Engrossed with a newspaper article that laid flat across his desk, the Professor gives a quiet hum as students quietly slipped from the classroom.",
			minutes: 1,
		},
		{
			id: "tired-watch",
			text: "The bell rings, and chairs scrape against the floor as students immediately begin packing their things. Professor Lorenz watches the commotion with a tired expression before finally closing his textbook.",
			minutes: 1,
		},
		{
			id: "assignment",
			text: "The bell rings and students begin filing out. Professor Lorenz calls after them before anyone can escape: “Your assignment is due tomorrow! And yes, I <i>will</i> know if you copied it.”",
			minutes: 1,
		},
	];

	const FOCUS = [
		{
			id: "ask-for-help",
			text:
				"Professor Lorenz moves on to the next section, but you're still staring at the previous problem. You understand most of it. There's just one part that refuses to make sense.",
			choices: [
				{
					id: "raise-hand",
					label: "Raise your hand.",
					effects: { stress: "+" },
					bonusStar: true,
					result:
						'Professor Lorenz pauses beside your desk and looks over your work. He clicks his tongue.<br><br>"You\'re making this more complicated than it needs to be, {honorific} Xia." He muses.<br><br>Kneeling beside your desk, he begins to explain the problem again, this time breaking it down into smaller steps. The back of his pen running along the page as he guides you.',
				},
				{
					id: "figure-it-out",
					label: "Figure it out yourself.",
					effects: { energy: "-" },
					bonusStar: true,
					result:
						"You stare at the problem for another few minutes, tapping your pencil against your bottom lip. Eventually, something clicks.",
				},
			],
		},
		{
			id: "difficult-question",
			text:
				'Professor Lorenz writes a complicated problem on the board, stepping aside and raising a hand.<br><br>"Who would like to try and solve this?” The classroom immediately grows quiet.',
			choices: [
				{
					id: "raise-hand",
					label: "Raise your hand.",
					effects: { control: "+" },
					bonusStar: true,
					result:
						"You walk through the solution at the board. Halfway through, you nearly lose your train of thought, but you manage to reach the correct answer. Professor Lorenz nods approvingly.",
				},
				{
					id: "head-down",
					label: "Keep your head down.",
					result: "Someone else volunteers.<br><br>You follow along as they work through the problem.",
				},
			],
		},
		{
			id: "called-on",
			text:
				'The lesson drones on so much so that you’re certain nobody is paying attention. “{honorific} Xia.”<br><br>Professor Lorenz is looking directly at you. Your wide eyes dart to meet his.<br><br>"What equation do we use in this scenario?”',
			choices: [
				{
					id: "give-answer",
					label: "Give an answer.",
					successChance: "understanding",
					success: {
						result:
							"You give your answer, and a brief silence follows, Professor Lorenz offering nothing more than a curt nod of his head.<br><br>You feel a small surge of confidence grow within.",
						effects: { control: "+" },
						bonusStar: true,
					},
					failure: {
						result:
							'You give your answer, and a brief silence follows. Professor Lorenz clicks his tongue, shaking his head.<br><br>“Eyes up front, everyone. I expect you all to commit this equation to heart before the next exam.”',
						effects: { stress: "+", control: "-" },
					},
				},
				{
					id: "admit-unknown",
					label: "Admit you don't know.",
					effects: { stress: "+", control: "-" },
					result:
						'You slouch in your seat, shake your head.<br><br>"I don\'t know, sir.”<br><br>Professor Lorenz sighs and explains the answer himself.',
				},
			],
		},
		{
			id: "take-better-notes",
			text:
				"Your notebook is filling quickly. Professor Lorenz moves through the material faster than you can comfortably write.",
			choices: [
				{
					id: "write-everything",
					label: "Write down everything.",
					effects: { pain: "+" },
					bonusStar: true,
					result:
						"Your hand aches as you desperately try to keep up. But, at least you won't forget anything.",
				},
				{
					id: "listen",
					label: "Put your pen down and listen.",
					effects: { stress: "+" },
					bonusStar: true,
					result:
						"You stop worrying about recording every word and focus on understanding the explanation instead. In the back of your mind, you can’t help but hope the material sticks.",
				},
			],
		},
		{
			id: "question-for-professor",
			text:
				"Something Professor Lorenz says catches your attention. You have a question, but you're not sure whether it's worth interrupting the lecture.",
			choices: [
				{
					id: "ask",
					label: "Ask the question.",
					effects: { control: "+" },
					bonusStar: true,
					result:
						'Professor Lorenz turns, listening to your quizzical insight.<br><br>“…That’s actually quite important." He elaborates on the subject for several minutes.<br><br>You understand the material much better now.',
				},
				{
					id: "keep-to-yourself",
					label: "Keep it to yourself.",
					result: "You make a note to look it up later.",
				},
			],
		},
		{
			id: "temptation-to-give-up",
			text:
				"The problem in front of you seems ridiculously complicated. You've tried solving it twice already, but the answer differs from the answer the Professor has written on the board. Neither attempt worked.",
			choices: [
				{
					id: "try-again",
					label: "Try one more time.",
					successChance: "understandingHard",
					success: {
						result:
							"You work through the problem once again, carefully checking each step. This time, you find your mistake. The answer finally makes sense.",
						effects: { stress: "+", energy: "-" },
						bonusStar: true,
					},
					failure: {
						result:
							"You work through the problem again, unable to spot where exactly you went wrong. You set your pencil down in a huff.",
						effects: { stress: "+", energy: "-" },
					},
				},
				{
					id: "move-on",
					label: "Move on.",
					result: "You decide there's no point wasting the rest of the lesson on one problem.",
				},
			],
		},
	];

	ConstantsLoader.add("physicsClass", {
		sunny: SUNNY,
		raining: RAINING,
		during: DURING,
		end: END,
		focus: FOCUS,
	});
})();
