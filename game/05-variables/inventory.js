/**
 * Single-bag inventory: $inventory.counts is { id: number }.
 * Staples are never stored. Cooking and eat both use this API.
 */

defineGlobalNamespaces("Inventory");

(function () {
	"use strict";

	const STAPLES = {
		flour: true,
		sugar: true,
		water: true,
		salt: true,
		oil: true,
	};

	const EAT_MINUTES = 10;
	const EAT_EFFECTS = {
		easy: { hunger: "--" },
		medium: { hunger: "---" },
		hard: { hunger: "---", stress: "-" },
	};

	function createDefaults() {
		return { counts: {}, lastEat: "" };
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.inventory || typeof vars.inventory !== "object") {
			vars.inventory = createDefaults();
		}
		const inv = vars.inventory;
		if (!inv.counts || typeof inv.counts !== "object") inv.counts = {};
		if (inv.lastEat == null) inv.lastEat = "";
		if (inv.starterGranted) {
			[
				"popcorn-kernels",
				"butter",
				"milk",
				"cheese",
				"cheese-slice",
				"bread-slice",
				"lettuce",
				"meat",
				"egg",
				"pepper",
				"ketchup",
				"olive-oil",
				"apple",
				"potato",
				"mushrooms",
				"sausage",
				"raw-steak",
			].forEach(id => {
				delete inv.counts[id];
			});
			delete inv.starterGranted;
		}
		return inv;
	}

	function isStaple(id) {
		return !!STAPLES[id];
	}

	function count(id, variables) {
		if (isStaple(id)) return Infinity;
		const inv = ensure(variables);
		return Math.max(0, Math.round(Number(inv.counts[id]) || 0));
	}

	function add(id, amount, variables) {
		if (!id || isStaple(id)) return count(id, variables);
		const inv = ensure(variables);
		const n = Math.round(Number(amount) || 0);
		if (n <= 0) return count(id, variables);
		inv.counts[id] = count(id, variables) + n;
		return inv.counts[id];
	}

	function take(id, amount, variables) {
		if (!id) return false;
		if (isStaple(id)) return true;
		const n = Math.round(Number(amount) || 0);
		if (n <= 0) return true;
		const inv = ensure(variables);
		const have = count(id, variables);
		if (have < n) return false;
		const next = have - n;
		if (next <= 0) delete inv.counts[id];
		else inv.counts[id] = next;
		return true;
	}

	function hasAll(reqs, variables) {
		if (!reqs || !reqs.length) return true;
		for (let i = 0; i < reqs.length; i++) {
			const req = reqs[i];
			if (req.optional) continue;
			if (count(req.id, variables) < req.qty) return false;
		}
		return true;
	}

	function takeAll(reqs, variables) {
		if (!hasAll(reqs, variables)) return false;
		for (let i = 0; i < reqs.length; i++) {
			const req = reqs[i];
			if (req.optional) continue;
			if (!take(req.id, req.qty, variables)) return false;
		}
		return true;
	}

	function eat(id, variables) {
		const vars = variables || V();
		ensure(vars);
		if (count(id, vars) < 1) return "";
		if (!take(id, 1, vars)) return "";
		World.advance(EAT_MINUTES, vars);
		const entry = typeof Cooking !== "undefined" ? Cooking.eatable(id) : null;
		const effects = (entry && entry.effects) || EAT_EFFECTS.easy;
		const fx = Stats.applyEffects(effects, vars);
		const name = entry ? entry.name : id;
		const text = (entry && entry.eatDescription) || "You eat the " + name + ".";
		vars.inventory.lastEat = text + " " + fx;
		return vars.inventory.lastEat;
	}

	function itemImg(folder, id) {
		const safe = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) return "";
		return `<img class="icon" src="img/kitchen-icons/${folder}/${safe}.png" alt="" aria-hidden="true">`;
	}

	function cardHtml(item, owned, visual, canEat) {
		const qty = owned === Infinity ? "∞" : String(owned);
		const unknown = visual === "unknown";
		const unmade = visual === "unmade";
		const empty = !unknown && !unmade && owned < 1;
		const cls =
			"inventory-card" +
			(unknown ? " inventory-card-unknown" : "") +
			(unmade ? " inventory-card-unmade" : "") +
			(empty ? " inventory-card-empty" : "");
		const name = unknown ? "" : item.name;
		let eat = "";
		if (canEat && owned > 0) {
			eat =
				`<<link "Eat">>` +
				`<<run Inventory.eat(${JSON.stringify(item.id)})>>` +
				`<<run Inventory.openDialog()>>` +
				`<</link>>`;
		}
		return (
			`<div class="${cls}">` +
			itemImg(item.kind === "dish" ? "recipes" : "ingredients", item.image || item.id) +
			`<span class="inventory-card-name">${name}</span>` +
			`<span class="inventory-card-qty">${owned > 0 ? qty : ""}</span>` +
			eat +
			`</div>`
		);
	}

	function recipeRowHtml(recipe, owned, visual, takeId) {
		const unknown = visual === "unknown";
		const unmade = visual === "unmade";
		const empty = !unknown && !unmade && owned < 1;
		const cls =
			"inventory-recipe" +
			(unknown ? " inventory-recipe-unknown" : "") +
			(unmade ? " inventory-recipe-unmade" : "") +
			(empty ? " inventory-recipe-empty" : "");
		const name = unknown ? "???" : recipe.name;
		const desc = unknown
			? "You have not learned this recipe yet"
			: unmade
				? "You have not made this recipe yet"
				: recipe.description || "";
		let meta = "";
		if (owned > 0) {
			meta =
				`<div class="inventory-recipe-meta">` +
				`<span class="inventory-recipe-qty">${owned}</span>` +
				`<<link ${JSON.stringify("Eat " + recipe.name)}>>` +
				`<<run Inventory.eat(${JSON.stringify(takeId)})>>` +
				`<<run Inventory.openDialog()>>` +
				`<</link>>` +
				`</div>`;
		}
		return (
			`<div class="${cls}">` +
			itemImg("recipes", recipe.id) +
			`<div class="inventory-recipe-copy">` +
			`<span class="inventory-recipe-name">${name}</span>` +
			(desc ? `<p class="inventory-recipe-desc">${desc}</p>` : "") +
			meta +
			`</div>` +
			`</div>`
		);
	}

	function bodyWiki(variables) {
		const vars = variables || V();
		ensure(vars);
		if (typeof Cooking !== "undefined") Cooking.ensure(vars);
		if (typeof Skills !== "undefined") Skills.ensure(vars);

		const skill = typeof Skills !== "undefined" ? Skills.get("cooking", vars) : null;
		const cooked = typeof Cooking !== "undefined" ? Cooking.ensure(vars).dishesCooked : 0;
		const last = vars.inventory.lastEat || "";

		let html = `<div class="inventory">`;
		if (last) html += `<p class="inventory-eat-result">${last}</p>`;
		if (skill) {
			html +=
				`<div class="inventory-skill">` +
				Skills.iconImg("cooking") +
				`<span class="inventory-skill-label">Cooking</span>` +
				`<span class="${skill.colour} inventory-skill-grade">${skill.letter}</span>` +
				`<span class="inventory-skill-meta">${skill.percent}% · ${cooked} cooked</span>` +
				`</div>`;
		}

		const recipes = typeof Cooking !== "undefined" ? Cooking.recipes() : [];
		const items = typeof Cooking !== "undefined" ? Cooking.items() : [];

		html += `<div class="inventory-layout">`;
		html += `<div class="inventory-pane inventory-recipes">`;
		html += `<h3 class="inventory-section">Recipes</h3>`;
		html += `<div class="inventory-recipe-list">`;
		recipes.forEach(row => {
			const takeId = Cooking.dishId(row);
			const owned = count(takeId, vars);
			const known = Cooking.learned(row.id, vars);
			const made = Cooking.made(row.id, vars);
			const visual = !known ? "unknown" : made ? "" : "unmade";
			html += recipeRowHtml(row, owned, visual, takeId);
		});
		html += `</div></div>`;

		const components = items.filter(it => it.kind === "component");
		html += `<div class="inventory-side">`;
		html += `<div class="inventory-pane">`;
		html += `<h3 class="inventory-section">Components</h3>`;
		if (!components.length) {
			html += `<p class="inventory-empty">No recipe components yet.</p>`;
		} else {
			html += `<div class="inventory-grid">${components.map(it => cardHtml(it, count(it.id, vars), false, true)).join("")}</div>`;
		}
		html += `</div>`;

		const pantry = items.filter(it => it.kind === "ingredient");
		html += `<div class="inventory-pane">`;
		html += `<h3 class="inventory-section">Ingredients</h3>`;
		if (!pantry.length) {
			html += `<p class="inventory-empty">No ingredients.</p>`;
		} else {
			html += `<div class="inventory-grid">${pantry.map(it => cardHtml(it, count(it.id, vars), false)).join("")}</div>`;
		}
		html += `</div></div></div></div>`;
		return html;
	}

	function openDialog() {
		ensure();
		if (typeof Cooking !== "undefined") Cooking.ensure();
		Dialog.setup("Inventory", "inventory-dialog");
		Dialog.wiki(bodyWiki());
		Dialog.open();
	}

	Object.assign(Inventory, {
		ensure,
		isStaple,
		count,
		add,
		take,
		hasAll,
		takeAll,
		eat,
		bodyWiki,
		openDialog,
		EAT_MINUTES,
	});
})();
