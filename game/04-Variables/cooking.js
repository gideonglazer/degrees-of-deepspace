/**
 * Cooking catalog, cookbook learning, and craft actions.
 * Inventory owns counts; this file is recipes + can/do helpers + cook-screen wiki.
 */

defineGlobalNamespaces("Cooking");

(function () {
	"use strict";

	const LEARN_MINUTES = 10;
	const DIFFICULTY_XP = { easy: 20, medium: 35, hard: 50 };
	const EASY_IDS = ["popcorn", "ramen", "bread-loaf", "sandwich", "mac-and-cheese"];

	const ITEMS = [
		{ id: "apple", name: "Apple", kind: "ingredient" },
		{ id: "butter", name: "Butter", kind: "ingredient", condiment: true },
		{ id: "cheese", name: "Cheese", kind: "ingredient" },
		{ id: "cheese-slice", name: "Cheese Slice", kind: "ingredient" },
		{ id: "egg", name: "Egg", kind: "ingredient" },
		{ id: "flour", name: "Flour", kind: "ingredient" },
		{ id: "ketchup", name: "Ketchup", kind: "ingredient", condiment: true },
		{ id: "lettuce", name: "Lettuce", kind: "ingredient" },
		{ id: "bread-slice", name: "Bread Slice", kind: "ingredient" },
		{ id: "meat", name: "Meat", kind: "ingredient" },
		{ id: "milk", name: "Milk", kind: "ingredient" },
		{ id: "mushrooms", name: "Mushrooms", kind: "ingredient" },
		{ id: "oil", name: "Oil", kind: "ingredient", condiment: true },
		{ id: "olive-oil", name: "Olive Oil", kind: "ingredient", condiment: true },
		{ id: "pepper", name: "Pepper", kind: "ingredient", condiment: true },
		{ id: "popcorn-kernels", name: "Popcorn Kernels", kind: "ingredient", image: "popcorn" },
		{ id: "potato", name: "Potato", kind: "ingredient" },
		{ id: "salt", name: "Salt", kind: "ingredient", condiment: true },
		{ id: "sausage", name: "Sausage", kind: "ingredient" },
		{ id: "raw-steak", name: "Steak", kind: "ingredient", image: "steak" },
		{ id: "sugar", name: "Sugar", kind: "ingredient" },
		{ id: "water", name: "Water", kind: "ingredient" },
		{
			id: "bun",
			name: "Bun",
			kind: "component",
			storage: "pantry",
			eatDescription: "The bun is soft and a little sweet. It is not a meal, but it takes the edge off.",
		},
		{
			id: "patty",
			name: "Patty",
			kind: "component",
			storage: "fridge",
			eatDescription: "You eat the seasoned patty on its own. It is savory and filling, if a little unfinished.",
		},
		{
			id: "meatball",
			name: "Meatball",
			kind: "component",
			storage: "fridge",
			eatDescription: "One meatball is a small, savory bite. You could easily eat more.",
		},
		{
			id: "french-fries",
			name: "French Fries",
			kind: "component",
			storage: "fridge",
			eatDescription: "The fries are salty and crisp at the edges. A handful disappears before you think about ketchup.",
		},
		{
			id: "dumpling",
			name: "Dumpling",
			kind: "component",
			storage: "fridge",
			eatDescription: "You eat a single dumpling. The filling is good, but it is clearly meant to be part of a plate.",
		},
		{
			id: "dough",
			name: "Dough",
			kind: "component",
			storage: "fridge",
			eatDescription: "The raw dough is bland and chewy. You regret this almost immediately.",
		},
		{
			id: "pizza-unbaked",
			name: "Unbaked Pizza",
			kind: "component",
			storage: "fridge",
			eatDescription: "Cold cheese on raw dough is not pizza. You chew through it anyway.",
		},
		{
			id: "cookie",
			name: "Cookie Dough",
			kind: "component",
			storage: "fridge",
			eatDescription: "The sweet, buttery dough is better than it has any right to be.",
		},
	];

	const RECIPES = [
		{
			id: "popcorn",
			name: "Popcorn",
			difficulty: "easy",
			description: "A delicious bowl of freshly popped, buttery popcorn that fills the air with its warm, comforting aroma.",
			storage: "pantry",
			eatDescription:
				"The warm, buttery kernels melt in your mouth with a satisfying crunch. The salty flavor coats your tongue, and you find yourself reaching for more.",
			learnText: {
				book: "You find a cookbook and flip through its pages. A simple recipe for making popcorn catches your eye — just popcorn kernels, butter, and salt. You learn {recipe} It seems easy enough to try.",
				tv: "You catch a cooking show where the chef demonstrates making simple buttery popcorn. You watch intently as they pop kernels and season them with butter and salt. You learn {recipe} You think you could try making this yourself!",
			},
			steps: [
				{
					name: "Popcorn",
					minutes: 5,
					description: "You pop the kernels and season them with butter and salt.",
					ingredients: [
						{ id: "popcorn-kernels", qty: 1 },
						{ id: "butter", qty: 1 },
						{ id: "salt", qty: 1 },
					],
					output: { id: "popcorn", qty: 1 },
				},
			],
		},
		{
			id: "ramen",
			name: "Ramen",
			difficulty: "easy",
			description: "A steaming, savory bowl of ramen with tender noodles, rich broth, and perfectly cooked toppings.",
			storage: "fridge",
			eatDescription:
				"The warm, savory broth fills your mouth with umami richness. The noodles are perfectly tender, and the egg adds a creamy texture that complements the tender meat.",
			learnText: {
				book: "You browse through a cookbook and discover a ramen recipe. The instructions are clear: boil water, add noodles, meat, and an egg, then season with salt. You learn {recipe} You feel like you could make this.",
				tv: "A cooking show features a chef making a steaming bowl of ramen. You watch them boil water, add noodles, meat, and an egg, finishing with a pinch of salt. You learn {recipe} You feel confident you could recreate this dish.",
			},
			steps: [
				{
					name: "Ramen",
					minutes: 10,
					description: "You boil water and add noodles, meat, and an egg. A pinch of salt finishes it off.",
					ingredients: [
						{ id: "water", qty: 1 },
						{ id: "meat", qty: 1, optional: true },
						{ id: "egg", qty: 1, optional: true },
						{ id: "salt", qty: 1 },
					],
					output: { id: "ramen", qty: 1 },
				},
			],
		},
		{
			id: "bread-loaf",
			name: "Bread Loaf",
			difficulty: "easy",
			description: "A freshly baked, golden-brown loaf of bread with a crisp crust and soft, fluffy interior.",
			storage: "pantry",
			eatDescription:
				"The crust gives a satisfying crunch as you bite in, followed by the soft, pillowy interior. The warm, yeasty flavor is comforting and simple.",
			learnText: {
				book: "A bread recipe in the cookbook catches your attention. Mixing flour, water, and sugar, then letting it rise and bake seems manageable. You learn {recipe} You bookmark the page for later.",
				tv: "You watch a baking show where they demonstrate making a fresh bread loaf. The process of mixing flour, water, and sugar seems straightforward enough. You learn {recipe} You make a mental note of the technique.",
			},
			steps: [
				{
					name: "Bread Loaf",
					minutes: 20,
					description: "You mix flour, water, and sugar, then let it rise and bake.",
					ingredients: [
						{ id: "flour", qty: 3 },
						{ id: "water", qty: 1 },
						{ id: "sugar", qty: 1 },
					],
					output: { id: "bread-loaf", qty: 1 },
				},
			],
		},
		{
			id: "sandwich",
			name: "Sandwich",
			difficulty: "easy",
			description: "A hearty, well-stacked sandwich with fresh ingredients layered between perfectly toasted bread slices.",
			storage: "fridge",
			eatDescription:
				"Each bite offers a perfect combination of textures — the crispy toast, fresh lettuce, savory meat, and creamy cheese meld together in a satisfying harmony.",
			learnText: {
				book: "You read about making sandwiches in a cooking magazine. The article emphasizes using fresh ingredients and properly toasting the bread. You learn {recipe} It seems like something you could easily make.",
				tv: "A cooking program shows how to make a perfect sandwich with fresh ingredients layered between toasted bread. You learn {recipe} The technique looks simple enough to try yourself.",
			},
			steps: [
				{
					name: "Sandwich",
					minutes: 7,
					description: "You layer bread slices with cheese, lettuce, and your choice of meat or egg.",
					ingredients: [
						{ id: "bread-slice", qty: 2 },
						{ id: "cheese-slice", qty: 1 },
						{ id: "lettuce", qty: 1 },
						{ id: "meat", qty: 1, optional: true },
						{ id: "egg", qty: 1, optional: true },
					],
					output: { id: "sandwich", qty: 1 },
				},
			],
		},
		{
			id: "mac-and-cheese",
			name: "Mac & Cheese",
			difficulty: "easy",
			description: "A creamy, decadent bowl of macaroni and cheese with a rich, velvety cheese sauce that melts in your mouth.",
			storage: "fridge",
			eatDescription:
				"The creamy cheese sauce coats your tongue with its rich, velvety texture. The pasta is perfectly cooked, and every bite is pure comfort food bliss.",
			learnText: {
				book: "You find a comfort food recipe book with a section on mac and cheese. The creamy cheese sauce recipe looks decadent. You learn {recipe} You're tempted to try making it yourself.",
				tv: "You watch a comfort food segment making creamy mac and cheese. The rich, velvety cheese sauce looks irresistible. You learn {recipe} You feel inspired to try making it yourself.",
			},
			steps: [
				{
					name: "Mac & Cheese",
					minutes: 15,
					description: "You cook pasta in a creamy cheese sauce, seasoned with salt and pepper.",
					ingredients: [
						{ id: "milk", qty: 1 },
						{ id: "cheese", qty: 1 },
						{ id: "cheese-slice", qty: 1 },
						{ id: "butter", qty: 1 },
						{ id: "flour", qty: 1 },
						{ id: "salt", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "mac-and-cheese", qty: 1 },
				},
			],
		},
		{
			id: "burger",
			name: "Burger",
			difficulty: "medium",
			requiredRank: "D",
			storage: "fridge",
			description: "A perfectly assembled, juicy burger stacked high with fresh vegetables, melted cheese, and a flavorful patty.",
			eatDescription:
				"The juicy patty bursts with flavor as you bite in. The melted cheese, fresh vegetables, and soft bun create a perfect balance of savory, crisp, and tender textures.",
			steps: [
				{
					name: "Bun",
					minutes: 10,
					description: "You mix flour and water to create the perfect bun dough, adding butter.",
					ingredients: [
						{ id: "flour", qty: 2 },
						{ id: "water", qty: 1 },
						{ id: "butter", qty: 1 },
					],
					output: { id: "bun", qty: 1 },
				},
				{
					name: "Patty",
					minutes: 8,
					description: "You shape the meat into a patty, seasoning it with salt and pepper.",
					ingredients: [
						{ id: "meat", qty: 2 },
						{ id: "salt", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "patty", qty: 1 },
				},
				{
					name: "Burger",
					minutes: 5,
					description: "You assemble the burger with the bun, patty, cheese, and lettuce.",
					ingredients: [
						{ id: "bun", qty: 1 },
						{ id: "patty", qty: 1 },
						{ id: "cheese-slice", qty: 1 },
						{ id: "lettuce", qty: 1 },
					],
					output: { id: "burger", qty: 1 },
				},
			],
		},
		{
			id: "fried-egg",
			name: "Fried Egg",
			difficulty: "medium",
			requiredRank: "D",
			storage: "fridge",
			description: "A perfectly fried egg with a golden, crispy edge and a runny, rich yolk at the center.",
			eatDescription:
				"The crispy edges give way to a rich, runny yolk that flows over your tongue. It's simple but satisfying, with a perfect balance of texture and flavor.",
			steps: [
				{
					name: "Fried Egg",
					minutes: 8,
					description: "You crack an egg into a hot pan with butter, seasoning it with salt and pepper.",
					ingredients: [
						{ id: "egg", qty: 1 },
						{ id: "butter", qty: 1 },
						{ id: "salt", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "fried-egg", qty: 1 },
				},
			],
		},
		{
			id: "meatballs",
			name: "Meatballs",
			difficulty: "medium",
			requiredRank: "D",
			storage: "fridge",
			description: "A generous plate of savory, tender meatballs served piping hot with a rich, flavorful sauce.",
			eatDescription:
				"The tender meatballs are perfectly seasoned and soak up the rich, savory sauce. Each bite is flavorful and satisfying, leaving you craving more.",
			steps: [
				{
					name: "Meatball",
					minutes: 5,
					needed: 3,
					description: "You roll a meatball up, mixing meat with egg, bread, and salt.",
					ingredients: [
						{ id: "meat", qty: 1 },
						{ id: "egg", qty: 1 },
						{ id: "bread-slice", qty: 1 },
						{ id: "salt", qty: 1 },
					],
					output: { id: "meatball", qty: 1 },
				},
				{
					name: "Meatballs",
					minutes: 10,
					description: "You cook the meatballs in oil with pepper, creating a savory dish.",
					ingredients: [
						{ id: "meatball", qty: 3 },
						{ id: "oil", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "meatballs", qty: 1 },
				},
			],
		},
		{
			id: "spaghetti",
			name: "Spaghetti",
			difficulty: "medium",
			requiredRank: "D",
			storage: "fridge",
			description: "A hearty, satisfying plate of spaghetti with rich, savory sauce and perfectly al dente noodles.",
			eatDescription:
				"The noodles are perfectly al dente, offering a pleasant resistance. The rich, savory sauce clings to each strand, filling your mouth with robust, satisfying flavor.",
			steps: [
				{
					name: "Spaghetti",
					minutes: 20,
					description: "You cook the pasta with meat and mushrooms in oil, seasoned with salt and pepper.",
					ingredients: [
						{ id: "bread-slice", qty: 1 },
						{ id: "meat", qty: 2 },
						{ id: "mushrooms", qty: 1 },
						{ id: "oil", qty: 1 },
						{ id: "salt", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "spaghetti", qty: 1 },
				},
			],
		},
		{
			id: "french-fries",
			name: "French Fries",
			difficulty: "medium",
			requiredRank: "D",
			storage: "fridge",
			description: "A generous basket of crispy, golden french fries perfectly seasoned and served with tangy ketchup.",
			eatDescription:
				"The fries are perfectly crispy on the outside and soft on the inside. The salt enhances the potato flavor, and the tangy ketchup adds a sweet contrast.",
			steps: [
				{
					name: "French Fries",
					minutes: 7,
					needed: 2,
					description: "You cut potatoes into strips and fry them in oil with salt.",
					ingredients: [
						{ id: "potato", qty: 1 },
						{ id: "oil", qty: 1 },
						{ id: "salt", qty: 1 },
					],
					output: { id: "french-fries", qty: 1 },
				},
				{
					name: "French Fries Basket",
					minutes: 5,
					description: "You arrange the french fries in a basket and add ketchup.",
					ingredients: [
						{ id: "french-fries", qty: 2 },
						{ id: "ketchup", qty: 1 },
					],
					output: { id: "french-fries-basket", qty: 1 },
				},
			],
		},
		{
			id: "apple-pie",
			name: "Apple Pie",
			difficulty: "hard",
			requiredRank: "C",
			storage: "fridge",
			description: "A beautifully baked, homemade apple pie with a flaky, buttery crust and warm, cinnamon-spiced apple filling.",
			eatDescription:
				"The flaky, buttery crust crumbles perfectly as you bite in. The warm, cinnamon-spiced apples are tender and sweet, creating a nostalgic, comforting flavor.",
			steps: [
				{
					name: "Apple Pie",
					minutes: 60,
					description: "You create a flaky crust, fill it with spiced apples, and bake it to golden perfection.",
					ingredients: [
						{ id: "flour", qty: 2 },
						{ id: "sugar", qty: 2 },
						{ id: "butter", qty: 1 },
						{ id: "apple", qty: 2 },
					],
					output: { id: "apple-pie", qty: 1 },
				},
			],
		},
		{
			id: "dumplings",
			name: "Dumplings",
			difficulty: "hard",
			requiredRank: "C",
			storage: "fridge",
			description: "A steaming plate of perfectly cooked dumplings with tender, flavorful filling and a delicate, slightly crispy wrapper.",
			eatDescription:
				"The delicate wrapper gives way to reveal a tender, flavorful filling. Each dumpling is perfectly seasoned, and the slightly crispy edges add textural interest.",
			steps: [
				{
					name: "Dumpling",
					minutes: 5,
					needed: 4,
					description: "You carefully fold the dough around the meat filling.",
					ingredients: [
						{ id: "flour", qty: 1 },
						{ id: "egg", qty: 1 },
						{ id: "meat", qty: 1 },
					],
					output: { id: "dumpling", qty: 1 },
				},
				{
					name: "Dumplings",
					minutes: 15,
					description: "You cook the dumplings in oil with salt, creating a delicious plate.",
					ingredients: [
						{ id: "dumpling", qty: 4 },
						{ id: "oil", qty: 1 },
						{ id: "salt", qty: 1 },
					],
					output: { id: "dumplings", qty: 1 },
				},
			],
		},
		{
			id: "pizza",
			name: "Pizza",
			difficulty: "hard",
			requiredRank: "C",
			storage: "fridge",
			description: "A hot, perfectly baked pizza with a golden, crispy crust and your choice of delicious, melted toppings.",
			eatDescription:
				"The crispy, golden crust provides the perfect base for the melted cheese and savory toppings. Each bite is a perfect combination of textures and flavors.",
			steps: [
				{
					name: "Dough",
					minutes: 15,
					description: "You knead the dough, mixing flour, water, and olive oil.",
					ingredients: [
						{ id: "flour", qty: 2 },
						{ id: "water", qty: 1 },
						{ id: "olive-oil", qty: 1 },
					],
					output: { id: "dough", qty: 1 },
				},
				{
					name: "Unbaked Pizza",
					minutes: 5,
					description: "You spread cheese and your choice of mushrooms or sausage over the dough.",
					ingredients: [
						{ id: "dough", qty: 1 },
						{ id: "cheese", qty: 1 },
						{ id: "mushrooms", qty: 1, optional: true },
						{ id: "sausage", qty: 1, optional: true },
					],
					output: { id: "pizza-unbaked", qty: 1 },
				},
				{
					name: "Pizza",
					minutes: 20,
					description: "You bake the pizza until the cheese is bubbly and the crust is golden.",
					ingredients: [{ id: "pizza-unbaked", qty: 1 }],
					output: { id: "pizza", qty: 1 },
				},
			],
		},
		{
			id: "steak",
			name: "Steak",
			difficulty: "hard",
			requiredRank: "C",
			storage: "fridge",
			description: "A perfectly seared, tender steak cooked to perfection with a juicy center and rich, savory flavor.",
			eatDescription:
				"The steak is perfectly seared on the outside, creating a flavorful crust that gives way to a tender, juicy interior. The rich, savory flavor is deeply satisfying.",
			steps: [
				{
					name: "Steak",
					minutes: 25,
					description: "You sear the steak in butter, seasoning it perfectly with salt and pepper.",
					ingredients: [
						{ id: "raw-steak", qty: 1 },
						{ id: "butter", qty: 1 },
						{ id: "salt", qty: 1 },
						{ id: "pepper", qty: 1 },
					],
					output: { id: "steak", qty: 1 },
				},
			],
		},
		{
			id: "cookies",
			name: "Cookies",
			difficulty: "hard",
			requiredRank: "C",
			storage: "pantry",
			description: "A tempting plate of warm, freshly baked cookies with a perfect balance of chewy centers and crispy edges.",
			eatDescription:
				"The cookies are warm and fragrant, with a perfect balance between the chewy center and crispy edges. The sweet, buttery flavor melts in your mouth.",
			steps: [
				{
					name: "Cookie Dough",
					minutes: 10,
					needed: 3,
					description: "You mix the cookie dough with flour, sugar, butter, and egg.",
					ingredients: [
						{ id: "flour", qty: 1 },
						{ id: "sugar", qty: 1 },
						{ id: "butter", qty: 1 },
						{ id: "egg", qty: 1 },
					],
					output: { id: "cookie", qty: 1 },
				},
				{
					name: "Cookies",
					minutes: 5,
					description: "You arrange the cookies on a plate and dust them with sugar.",
					ingredients: [
						{ id: "cookie", qty: 3 },
						{ id: "sugar", qty: 1 },
					],
					output: { id: "cookies", qty: 1 },
				},
			],
		},
	];

	function createDefaults() {
		return {
			learnedRecipes: [],
			madeRecipes: [],
			lastLearnDay: "",
			lastLearnSource: "book",
			returnPassage: "Apartment Kitchen",
			selectedId: "",
			lastResult: "",
			dishesCooked: 0,
		};
	}

	function dayKey(variables) {
		const world = World.ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.cooking || typeof vars.cooking !== "object") {
			vars.cooking = createDefaults();
		}
		const state = vars.cooking;
		if (!Array.isArray(state.learnedRecipes)) state.learnedRecipes = [];
		if (!Array.isArray(state.madeRecipes)) state.madeRecipes = [];
		if (state.lastLearnDay == null) state.lastLearnDay = "";
		if (state.lastLearnSource !== "tv") state.lastLearnSource = "book";
		if (!state.returnPassage) state.returnPassage = "Apartment Kitchen";
		if (state.selectedId == null) state.selectedId = "";
		if (state.lastResult == null) state.lastResult = "";
		state.dishesCooked = Math.max(0, Math.round(Number(state.dishesCooked) || 0));
		backfillMade(state, vars);
		return state;
	}

	function backfillMade(state, variables) {
		if (typeof Inventory === "undefined") return;
		RECIPES.forEach(row => {
			if (state.madeRecipes.indexOf(row.id) >= 0) return;
			if (Inventory.count(dishId(row), variables) > 0) state.madeRecipes.push(row.id);
		});
	}

	function recipes() {
		return RECIPES;
	}

	function items() {
		return ITEMS;
	}

	function recipe(id) {
		return RECIPES.find(row => row.id === id) || null;
	}

	function item(id) {
		return ITEMS.find(row => row.id === id) || null;
	}

	function itemName(id) {
		const found = item(id);
		if (found) return found.name;
		const dish = recipe(id) || recipeForDish(id);
		return dish ? dish.name : id;
	}

	function dishId(rowOrId) {
		const row = typeof rowOrId === "string" ? recipe(rowOrId) : rowOrId;
		if (!row || !row.steps || !row.steps.length) return typeof rowOrId === "string" ? rowOrId : "";
		return row.steps[row.steps.length - 1].output.id;
	}

	function recipeForDish(id) {
		return RECIPES.find(row => dishId(row) === id) || recipe(id);
	}

	function formatMinutes(mins) {
		const n = Math.max(0, Math.round(Number(mins) || 0));
		const h = Math.floor(n / 60);
		const m = n % 60;
		return h + ":" + String(m).padStart(2, "0");
	}

	function totalMinutes(row) {
		return row.steps.reduce((sum, step) => sum + (step.minutes || 0) * (step.needed || 1), 0);
	}

	function meetsRank(row, variables) {
		if (!row.requiredRank) return true;
		const skill = Skills.get("cooking", variables);
		if (!skill) return false;
		return Skills.GRADE_ORDER.indexOf(skill.letter) >= Skills.GRADE_ORDER.indexOf(row.requiredRank);
	}

	function learned(id, variables) {
		return ensure(variables).learnedRecipes.indexOf(id) >= 0;
	}

	function made(id, variables) {
		return ensure(variables).madeRecipes.indexOf(id) >= 0;
	}

	function unlocked(id, variables) {
		const row = recipe(id);
		if (!row) return false;
		return learned(id, variables) && meetsRank(row, variables);
	}

	function easyUnlearned(variables) {
		return EASY_IDS.map(recipe).filter(row => row && !learned(row.id, variables));
	}

	function hasMoreToLearn(variables) {
		return easyUnlearned(variables).length > 0;
	}

	function canLearn(variables) {
		const vars = variables || V();
		if (!hasMoreToLearn(vars)) return false;
		return ensure(vars).lastLearnDay !== dayKey(vars);
	}

	function learn(source, variables) {
		if (source && typeof source === "object") {
			variables = source;
			source = "book";
		}
		const src = source === "tv" ? "tv" : "book";
		const vars = variables || V();
		const state = ensure(vars);
		if (!canLearn(vars)) return null;
		const pool = easyUnlearned(vars);
		const pick = pickRandomItemInArray(pool);
		if (!pick) return null;
		state.learnedRecipes.push(pick.id);
		state.lastLearnDay = dayKey(vars);
		state.lastLearnSource = src;
		World.advance(LEARN_MINUTES, vars);
		return pick;
	}

	function learnPhrase(row) {
		const name = String((row && row.name) || "").toLowerCase();
		const article = /^[aeiou]/.test(name) ? "an" : "a";
		const id = String((row && row.id) || "").replace(/[^a-zA-Z0-9_-]/g, "");
		return `<<important>>${article} ${name} recipe <<kitchenIcon "recipes" "${id}">>.<</important>>`;
	}

	function learnMarkup(row, source) {
		if (!row) return "";
		const src = source === "tv" || source === "book" ? source : ensure().lastLearnSource || "book";
		const texts = row.learnText;
		const raw = texts && typeof texts === "object" ? texts[src] || texts.book || "" : String(texts || "");
		return raw.replace(/\{recipe\}/g, learnPhrase(row));
	}

	function storageFor(id) {
		const found = item(id);
		if (found && found.storage) return found.storage;
		const row = recipeForDish(id) || recipe(id);
		if (row && row.storage) return row.storage;
		return "fridge";
	}

	function storageLine(id) {
		const place = storageFor(id) === "pantry" ? "pantry" : "fridge";
		return "This dish has been placed in the " + place + ".";
	}

	function dishEffects(row) {
		const EAT_EFFECTS = { easy: { hunger: "--" }, medium: { hunger: "---" }, hard: { hunger: "---", stress: "-" } };
		return (row && EAT_EFFECTS[row.difficulty]) || EAT_EFFECTS.easy;
	}

	function eatable(id) {
		const found = item(id);
		if (found && found.kind === "component") {
			return {
				id: found.id,
				name: found.name,
				kind: "component",
				eatDescription: found.eatDescription || "You eat the " + found.name + ".",
				storage: found.storage || "fridge",
				folder: "ingredients",
				image: found.image || found.id,
				effects: { hunger: "-" },
			};
		}
		const row = recipeForDish(id);
		if (!row || dishId(row) !== id) return null;
		return {
			id,
			name: row.name,
			kind: "dish",
			eatDescription: row.eatDescription || "You eat the " + row.name + ".",
			storage: row.storage || "fridge",
			folder: "recipes",
			image: row.id,
			effects: dishEffects(row),
		};
	}

	function eatables(storage, variables) {
		const want = storage === "pantry" ? "pantry" : "fridge";
		const vars = variables || V();
		const seen = {};
		const list = [];
		function add(id) {
			if (seen[id] || storageFor(id) !== want) return;
			if (typeof Inventory === "undefined" || Inventory.count(id, vars) < 1) return;
			const entry = eatable(id);
			if (!entry) return;
			seen[id] = true;
			list.push(entry);
		}
		RECIPES.forEach(row => add(dishId(row)));
		ITEMS.forEach(it => {
			if (it.kind === "component") add(it.id);
		});
		return list;
	}

	function storageMarkup(storage, variables) {
		const vars = variables || V();
		ensure(vars);
		if (typeof Inventory !== "undefined") Inventory.ensure(vars);
		const want = storage === "pantry" ? "pantry" : "fridge";
		const empty = want === "pantry" ? "The pantry is empty." : "The fridge is empty.";
		const last = vars.inventory && vars.inventory.lastEat ? vars.inventory.lastEat : "";
		const list = eatables(want, vars);
		let html = `<div class="kitchen-storage">`;
		if (last) html += `<p class="kitchen-storage-eat">${last}</p>`;
		if (!list.length) {
			html += `<p>${empty}</p>`;
		} else {
			html += `<div class="kitchen-storage-list">`;
			list.forEach(entry => {
				const owned = Inventory.count(entry.id, vars);
				const mins = typeof Inventory !== "undefined" ? Inventory.EAT_MINUTES : 10;
				html +=
					`<div class="kitchen-storage-row">` +
					kitchenImg(entry.folder, entry.image) +
					`<span class="kitchen-storage-name">${entry.name}</span>` +
					`<span class="kitchen-storage-qty">${owned}</span>` +
					`<<link ${JSON.stringify("Eat " + entry.name + " <span class='action-time'>(" + formatMinutes(mins) + ")</span>")}>>` +
					`<<run Inventory.eat(${JSON.stringify(entry.id)})>>` +
					`<<goto ${JSON.stringify(passage())}>>` +
					`<</link>>` +
					(typeof Stats !== "undefined" ? " " + Stats.effectsMarkup(entry.effects) : "") +
					`</div>`;
			});
			html += `</div>`;
		}
		html += `</div>`;
		return html;
	}

	function canMake(id, stepIndex, variables) {
		const vars = variables || V();
		if (!unlocked(id, vars)) return false;
		const row = recipe(id);
		const step = row && row.steps[stepIndex];
		if (!step) return false;
		return Inventory.hasAll(step.ingredients, vars);
	}

	function make(id, stepIndex, variables) {
		const vars = variables || V();
		const state = ensure(vars);
		if (!canMake(id, stepIndex, vars)) return null;
		const row = recipe(id);
		const step = row.steps[stepIndex];
		if (!Inventory.takeAll(step.ingredients, vars)) return null;
		Inventory.add(step.output.id, step.output.qty, vars);
		World.advance(step.minutes, vars);
		const last = stepIndex === row.steps.length - 1;
		if (last) {
			Skills.addProgress("cooking", DIFFICULTY_XP[row.difficulty] || 20, vars);
			state.dishesCooked += 1;
			if (state.madeRecipes.indexOf(id) < 0) state.madeRecipes.push(id);
		}
		state.lastResult = step.description + " " + storageLine(step.output.id);
		return { text: state.lastResult, last };
	}

	function select(id, variables) {
		const state = ensure(variables);
		if (!unlocked(id, variables)) return;
		state.selectedId = id;
		state.lastResult = "";
	}

	function open(returnPassage, variables) {
		const state = ensure(variables);
		state.returnPassage = returnPassage || "Apartment Kitchen";
		state.lastResult = "";
	}

	function kitchenImg(folder, id) {
		const safe = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) return "";
		return `<img class="icon" src="img/kitchen-icons/${folder}/${safe}.png" alt="" aria-hidden="true">`;
	}

	function reqLine(req, variables) {
		const have = Inventory.count(req.id, variables);
		const label = itemName(req.id);
		const qty = have === Infinity ? "∞" : String(have);
		const ok = req.optional || have >= req.qty;
		const extra = req.optional ? " (optional)" : "";
		return (
			`<span class="cooking-req${ok ? "" : " cooking-req-short"}">` +
			kitchenImg("ingredients", (item(req.id) && item(req.id).image) || req.id) +
			`${label} ${req.qty}${extra} · ${qty}</span>`
		);
	}

	function missingNeeded(step, variables) {
		if (!step || !step.ingredients) return [];
		return step.ingredients.filter(req => {
			if (req.optional) return false;
			const have = Inventory.count(req.id, variables);
			return have < req.qty;
		});
	}

	function missingWarningWiki(step, variables) {
		const missing = missingNeeded(step, variables);
		if (!missing.length) return "";
		const list = missing.map(req => `${itemName(req.id)} (${req.qty})`).join(", ");
		return `<div class="cooking-step-blocked">` + `<<warning>>You don't have the ingredients to make this. Need: ${list}.<</warning>>` + `</div>`;
	}

	function recipeCardWiki(row, variables) {
		const state = ensure(variables);
		const known = learned(row.id, variables);
		const cooked = made(row.id, variables);
		const openable = unlocked(row.id, variables);
		const selected = state.selectedId === row.id;
		const cls =
			"cooking-card" +
			(known ? "" : " cooking-card-unknown") +
			(known && !cooked ? " cooking-card-unmade" : "") +
			(openable ? "" : " cooking-card-locked") +
			(selected ? " cooking-card-selected" : "");
		const img = kitchenImg("recipes", row.id);
		if (!openable) {
			const name = known ? row.name : "-";
			return `<div class="${cls}">${img}<span class="cooking-card-name">${name}</span></div>`;
		}
		return (
			`<div class="${cls}">${img}` +
			`<span class="cooking-card-name">` +
			`<<link ${JSON.stringify(row.name)}>>` +
			`<<run Cooking.select(${JSON.stringify(row.id)})>>` +
			`<<goto "Kitchen Cook">>` +
			`<</link>>` +
			`</span>` +
			`</div>`
		);
	}

	function sidebarWiki(variables) {
		const vars = variables || V();
		const state = ensure(vars);
		const row = recipe(state.selectedId);
		if (!row || !unlocked(row.id, vars)) {
			return `<p class="cooking-sidebar-empty">Select a recipe to begin.</p>`;
		}
		let html =
			`<h3 class="cooking-sidebar-title">${row.name}</h3>` +
			`<p class="cooking-sidebar-desc">${row.description}</p>` +
			`<p class="cooking-sidebar-meta">` +
			`<span class="action-time">(${formatMinutes(totalMinutes(row))})</span>` +
			Skills.effectMarkup("cooking") +
			`</p>`;
		row.steps.forEach((step, index) => {
			const needed = step.needed || 1;
			const have = Inventory.count(step.output.id, vars);
			const progress = needed > 1 ? ` (${Math.min(have, needed)}/${needed})` : "";
			html += `<div class="cooking-step"><div class="cooking-step-name">${index + 1}. ${step.name}${progress}</div>`;
			html += `<div class="cooking-step-reqs">${step.ingredients.map(req => reqLine(req, vars)).join("")}</div>`;
			if (canMake(row.id, index, vars)) {
				html +=
					`<<link "Make ${step.name} <span class='action-time'>(${formatMinutes(step.minutes)})</span>">>` +
					`<<run Cooking.make(${JSON.stringify(row.id)}, ${index})>>` +
					`<<goto "Kitchen Cook">>` +
					`<</link>>`;
			} else {
				html += missingWarningWiki(step, vars);
			}
			html += `</div>`;
		});
		return html;
	}

	function screenMarkup(variables) {
		const vars = variables || V();
		ensure(vars);
		Inventory.ensure(vars);
		Skills.ensure(vars);
		const state = ensure(vars);
		const byDiff = { easy: [], medium: [], hard: [] };
		RECIPES.forEach(row => {
			if (byDiff[row.difficulty]) byDiff[row.difficulty].push(row);
		});

		let html = `<div class="cooking-screen"><h2 class="cooking-title">Let's Cook!</h2>`;
		if (state.lastResult) {
			html += `<p class="cooking-banner">${state.lastResult}</p>`;
		}
		html += `<div class="cooking-layout"><div class="cooking-main">`;
		["easy", "medium", "hard"].forEach(diff => {
			html += `<h3 class="cooking-section">${diff}</h3><div class="cooking-grid">`;
			byDiff[diff].forEach(row => {
				html += recipeCardWiki(row, vars);
			});
			html += `</div>`;
		});
		html += `<h3 class="cooking-section">Ingredients</h3><div class="cooking-ingredients">`;
		ITEMS.filter(it => it.kind === "ingredient").forEach(it => {
			const n = Inventory.count(it.id, vars);
			const qty = n === Infinity ? "∞" : String(n);
			html +=
				`<span class="cooking-ing${n < 1 ? " cooking-ing-empty" : ""}">` + kitchenImg("ingredients", it.image || it.id) + `${it.name} ${qty}</span>`;
		});
		html += `</div></div><div class="cooking-sidebar">${sidebarWiki(vars)}</div></div>`;
		html += `<div class="cooking-finish">` + `<<link "Finish">>` + `<<goto ${JSON.stringify(state.returnPassage)}>>` + `<</link>>` + `</div></div>`;
		return html;
	}

	Object.assign(Cooking, {
		ensure,
		recipes,
		items,
		recipe,
		recipeForDish,
		item,
		itemName,
		dishId,
		formatMinutes,
		unlocked,
		learned,
		made,
		canLearn,
		hasMoreToLearn,
		learn,
		canMake,
		make,
		select,
		open,
		screenMarkup,
		learnMarkup,
		storageFor,
		eatable,
		eatables,
		storageMarkup,
		LEARN_MINUTES,
		DIFFICULTY_XP,
	});

	DefineMacroS("cookingScreen", function () {
		return screenMarkup();
	});

	DefineMacroS("learnedRecipeText", function (args) {
		return learnMarkup(args[0]);
	});

	DefineMacroS("kitchenStorage", function (args) {
		return storageMarkup(args[0]);
	});
})();
