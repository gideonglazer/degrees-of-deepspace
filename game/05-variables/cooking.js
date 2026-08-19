/**
 * Cooking catalog, cookbook learning, and craft actions.
 * Inventory owns counts; this file is recipes + can/do helpers + cook-screen wiki.
 */

defineGlobalNamespaces("Cooking");

(function () {
	"use strict";

	const LEARN_MINUTES = 10;
	const DIFFICULTY_XP = C().cooking.difficultyXp;
	const EASY_IDS = C().cooking.easyIds;
	const ITEMS = C().cooking.items;
	const RECIPES = C().cooking.recipes;

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
		return World.formatActionMinutes(mins);
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
		return ensure(vars).lastLearnDay !== World.dayKey(vars);
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
		state.lastLearnDay = World.dayKey(vars);
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
		refresh(vars);
		return { text: state.lastResult, last };
	}

	function select(id, variables) {
		const vars = variables || V();
		const state = ensure(vars);
		if (!unlocked(id, vars)) return;
		state.selectedId = id;
		state.lastResult = "";
		refreshSelection(vars);
	}

	function open(returnPassage, variables) {
		const state = ensure(variables);
		state.returnPassage = returnPassage || "Apartment Kitchen";
		state.lastResult = "";
	}

	function close(variables) {
		const state = ensure(variables);
		state.selectedId = "";
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
		const attrs = `class="${cls}" data-recipe="${row.id}"`;
		if (!openable) {
			const name = known ? row.name : "-";
			return `<div ${attrs}>${img}<span class="cooking-card-name">${name}</span></div>`;
		}
		return (
			`<div ${attrs}>${img}` +
			`<span class="cooking-card-name">` +
			`<<link ${JSON.stringify(row.name)}>>` +
			`<<run Cooking.select(${JSON.stringify(row.id)})>>` +
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
					`<</link>>`;
			} else {
				html += missingWarningWiki(step, vars);
			}
			html += `</div>`;
		});
		return html;
	}

	function bannerWiki(variables) {
		const state = ensure(variables);
		return state.lastResult ? `<p class="cooking-banner">${state.lastResult}</p>` : "";
	}

	function mainWiki(variables) {
		const vars = variables || V();
		const byDiff = { easy: [], medium: [], hard: [] };
		RECIPES.forEach(row => {
			if (byDiff[row.difficulty]) byDiff[row.difficulty].push(row);
		});
		let html = "";
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
		html += `</div>`;
		return html;
	}

	function screenMarkup(variables) {
		const vars = variables || V();
		const state = ensure(vars);
		Inventory.ensure(vars);
		Skills.ensure(vars);

		return (
			`<div class="cooking-screen"><h2 class="cooking-title">Let's Cook!</h2>` +
			`<div class="cooking-banner-slot">${bannerWiki(vars)}</div>` +
			`<div class="cooking-layout">` +
			`<div class="cooking-main">${mainWiki(vars)}</div>` +
			`<div class="cooking-sidebar">${sidebarWiki(vars)}</div>` +
			`</div>` +
			`<div class="cooking-finish"><<link "Finish">><<run Cooking.close()>><<goto ${JSON.stringify(state.returnPassage)}>><</link>></div>` +
			`</div>`
		);
	}

	function screenNode() {
		const $screen = jQuery("#passages").find(".cooking-screen");
		return $screen.length ? $screen : null;
	}

	function redraw($target, wiki) {
		if (!$target || !$target.length) return;
		$target.empty();
		if (wiki) $target.wiki(wiki);
	}

	function markSelected($screen, state) {
		$screen.find(".cooking-card").each(function () {
			const $card = jQuery(this);
			$card.toggleClass("cooking-card-selected", $card.attr("data-recipe") === state.selectedId);
		});
	}

	function renumber() {
		if (typeof LinkNumberify !== "undefined" && LinkNumberify.numberify) LinkNumberify.numberify();
	}

	/**
	 * Picking a recipe leaves the recipe grid and ingredient list alone, so only the card
	 * highlight and the sidebar are redrawn.
	 */
	function refreshSelection(variables) {
		const $screen = screenNode();
		if (!$screen) return;
		const vars = variables || V();
		markSelected($screen, ensure(vars));
		redraw($screen.find(".cooking-banner-slot"), bannerWiki(vars));
		redraw($screen.find(".cooking-sidebar"), sidebarWiki(vars));
		renumber();
	}

	/**
	 * Cooking a step changes counts, unlocks, and the clock, so the whole screen and the HUD
	 * are redrawn in place rather than revisiting the passage.
	 */
	function refresh(variables) {
		const $screen = screenNode();
		if (!$screen) return;
		const vars = variables || V();
		redraw($screen.find(".cooking-banner-slot"), bannerWiki(vars));
		redraw($screen.find(".cooking-main"), mainWiki(vars));
		redraw($screen.find(".cooking-sidebar"), sidebarWiki(vars));
		if (typeof GameSettings !== "undefined" && GameSettings.refreshHud) GameSettings.refreshHud();
		renumber();
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
		close,
		screenMarkup,
		refresh,
		refreshSelection,
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
