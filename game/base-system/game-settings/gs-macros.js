/**
 * Game-settings UI macros (character creator + love interest modifier). Radios are generated from
 * Constants.character catalogues so the option lists stay in one place and passages stay short.
 */

defineGlobalNamespaces("GameSettings");

(function () {
	"use strict";

	/**
	 * Escapes text for safe use inside HTML attribute values.
	 */
	function escapeAttr(value) {
		return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
	}

	/**
	 * Escapes text for use as HTML body content.
	 */
	function escapeHtml(value) {
		return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	/**
	 * Builds a labelled radiobutton row from a Constants.character option list.
	 */
	function radiosMarkup(varPath, options) {
		return options
			.map(entry => {
				const classes = ["cc-option-label"];
				if (entry.tone) classes.push(`cc-tone-${entry.tone}`);
				if (entry.color) classes.push("cc-swatch");
				const style = entry.color ? ` style="color:${escapeAttr(entry.color)}"` : "";
				return (
					`<label class="cc-option">` +
					`<<radiobutton "${escapeAttr(varPath)}" "${escapeAttr(entry.value)}" autocheck>>` +
					`<span class="${classes.join(" ")}"${style}>${escapeHtml(entry.label)}</span>` +
					`</label>`
				);
			})
			.join("");
	}

	/**
	 * Reads a `$`-prefixed story variable path like `$player.freckles`.
	 */
	function readVar(varPath) {
		const path = String(varPath || "").replace(/^\$/, "");
		return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), V());
	}

	/**
	 * Writes a boolean (or any value) to a `$`-prefixed story variable path.
	 */
	function writeVar(varPath, value) {
		const keys = String(varPath || "")
			.replace(/^\$/, "")
			.split(".");
		const last = keys.pop();
		const parent = keys.reduce((node, key) => (node == null ? undefined : node[key]), V());
		if (parent && last) parent[last] = value;
	}

	/**
	 * Seeds left/right eye colours from the shared colour when heterochromia turns on, and copies
	 * left back to the shared colour when it turns off.
	 */
	function syncHeterochromia(enabled) {
		const player = V().player;
		if (!player) return;
		if (enabled) {
			const base = player.eyeColor || "gold";
			if (!player.eyeColorLeft) player.eyeColorLeft = base;
			if (!player.eyeColorRight) player.eyeColorRight = base;
		} else if (player.eyeColorLeft) {
			player.eyeColor = player.eyeColorLeft;
		}
	}

	/**
	 * Re-renders the eye-colour fieldsets after heterochromia toggles.
	 */
	function refreshEyeColors() {
		const $target = jQuery("#ccEyeColors");
		if ($target.length) $target.empty().wiki("<<ccEyeColors>>");
	}

	/**
	 * Marks the active tab. Deferred so the widget's HTML is in the document before we query it.
	 * Must live in JS — SugarCube treats `$` inside `<<run>>` as a story-variable sigil.
	 */
	function bindShell() {
		setTimeout(function () {
			const $tabs = jQuery(".cc-tabs button");
			$tabs.addClass("cc-tab");
			$tabs.eq(0).attr("data-panel", "creator");
			$tabs.eq(1).attr("data-panel", "loveInterest");
			$tabs.eq(2).attr("data-panel", "general");
			$tabs.eq(3).attr("data-panel", "themes");
			$tabs.removeClass("is-active");
			jQuery('.cc-tab[data-panel="' + (V().ccPanel || "creator") + '"]').addClass("is-active");
		}, 0);
	}

	/**
	 * Wires Themes-tab radios, listboxes, and animation previews.
	 */
	function bindThemes() {
		setTimeout(function () {
			Theme.initControl();
			Options.refreshAnimPreviews();
			Options.applyTypography();

			const $themes = jQuery("#ccThemes");
			$themes.off("change.dodThemes").on("change.dodThemes", "select, input[type='radio']", function () {
				/* Defer so SugarCube finishes writing $options before we read it */
				setTimeout(function () {
					Options.applyTypography();
				}, 0);
			});
		}, 0);
	}

	/**
	 * Styles the Begin button after SugarCube renders it.
	 */
	function styleBegin() {
		setTimeout(function () {
			jQuery("#ccBeginWrap button").addClass("cc-begin");
		}, 0);
	}

	/**
	 * Re-renders #ccPanel after Character Creator state changes so radios/checkboxes match.
	 */
	function refreshCreatorPanel() {
		const $panel = jQuery("#ccPanel");
		if ($panel.length) $panel.empty().wiki("<<ccPanel>>");
	}

	/**
	 * Randomizes Character Creator fields and re-renders the panel.
	 */
	function randomizeCreator() {
		Player.randomize();
		refreshCreatorPanel();
	}

	/**
	 * Resets Character Creator fields to defaults and re-renders the panel.
	 */
	function resetCreator() {
		Player.resetToDefaults();
		refreshCreatorPanel();
	}

	/**
	 * Keeps the love-interest listbox in sync after Previous/Next navigation.
	 * SugarCube listboxes use numeric <option value> indices in the DOM, so we select by roster index.
	 */
	function syncLiListbox() {
		setTimeout(function () {
			const focus = V().liFocus;
			const index = LoveInterests.roster().findIndex(li => li.id === focus);
			const $select = jQuery("#ccLiListbox select");
			if ($select.length && index >= 0) $select.val(String(index));
		}, 0);
	}

	/**
	 * Re-renders the love-interest editor when the dropdown changes.
	 */
	function onLiListboxChange() {
		const $editor = jQuery("#ccLiEditor");
		if ($editor.length) $editor.empty().wiki("<<ccLiEditor>>");
	}

	/**
	 * Updates the love-interest editor header after a Display Name locale change.
	 */
	function refreshLiNameHeader() {
		const $target = jQuery("#ccLiName");
		if ($target.length) $target.text(LoveInterests.displayTitle(V().liFocus));
	}

	/**
	 * Rewrites jump-listbox option labels to match each LI's selected display name.
	 */
	function refreshLiListboxLabels() {
		const $select = jQuery("#ccLiListbox select");
		if (!$select.length) return;
		LoveInterests.roster().forEach((li, index) => {
			const $opt = $select.find("option").eq(index);
			if ($opt.length) $opt.text(LoveInterests.displayName(li.id));
		});
	}

	Object.assign(GameSettings, {
		bindShell,
		bindThemes,
		styleBegin,
		randomizeCreator,
		resetCreator,
		refreshEyeColors,
		syncHeterochromia,
		syncLiListbox,
		onLiListboxChange,
		refreshLiNameHeader,
		refreshLiListboxLabels,
	});

	/**
	 * <<ccPanelSwitch "creator">>
	 * Switches the Start-page tab and re-renders #ccPanel without a full passage reload.
	 */
	DefineMacro("ccPanelSwitch", function (args) {
		const panel = args[0] || "creator";
		V().ccPanel = panel;
		const $panel = jQuery("#ccPanel");
		if ($panel.length) $panel.empty().wiki("<<ccPanel>>");
		jQuery(".cc-tab").removeClass("is-active");
		jQuery('.cc-tab[data-panel="' + panel + '"]').addClass("is-active");
		if (panel === "loveInterest") {
			setTimeout(function () {
				bindLiListboxListener();
			}, 0);
		}
	});

	/**
	 * Attaches a change listener to the love-interest listbox (idempotent).
	 */
	function bindLiListboxListener() {
		const $select = jQuery("#ccLiListbox select");
		if (!$select.length) return;
		$select.off("change.ccLi").on("change.ccLi", function () {
			onLiListboxChange();
		});
	}

	/**
	 * <<ccLiListbox>>
	 * Renders a SugarCube listbox of love interests bound to $liFocus.
	 * Option labels use each LI's currently selected display name.
	 */
	DefineMacro("ccLiListbox", function () {
		LoveInterests.ensure();
		const optionMarkup = LoveInterests.roster()
			.map(li => `<<option "${escapeAttr(LoveInterests.displayName(li.id))}" "${escapeAttr(li.id)}">>`)
			.join("");

		const $wrap = jQuery(`<span id="ccLiListbox" class="cc-li-listbox"></span>`);
		$wrap.wiki(`<<listbox "$liFocus" autoselect>>${optionMarkup}<</listbox>>`);
		jQuery(this.output).append($wrap);

		setTimeout(bindLiListboxListener, 0);
	});

	/**
	 * <<ccLiNameRadios>>
	 * Renders Display Name locale options for the focused love interest and refreshes the header.
	 */
	DefineMacro("ccLiNameRadios", function () {
		LoveInterests.ensure();
		const id = V().liFocus;
		const li = LoveInterests.get(id);
		if (!li || !li.names) {
			jQuery(this.output).append(`<p class="cc-li-empty">No name variants available.</p>`);
			return;
		}

		const current = (V().loveInterests[id] && V().loveInterests[id].nameLocale) || "en";
		const $wrap = jQuery(`<div class="cc-options"></div>`);

		LoveInterests.nameLocales().forEach(locale => {
			const name = li.names[locale.value];
			if (!name) return;
			const $label = jQuery(
				`<label class="cc-option">` +
					`<input type="radio" name="ccLiNameLocale" value="${escapeAttr(locale.value)}"${current === locale.value ? " checked" : ""}>` +
					`<span class="cc-option-label">${escapeHtml(name)} (${escapeHtml(locale.code)})</span>` +
					`</label>`
			);
			$wrap.append($label);
		});

		$wrap.on("change", "input[type='radio']", function () {
			if (!V().loveInterests[id]) return;
			V().loveInterests[id].nameLocale = this.value;
			refreshLiNameHeader();
			refreshLiListboxLabels();
		});

		jQuery(this.output).append($wrap);
	});

	/**
	 * <<ccRadios "$player.gender" "genders">>
	 * Renders every option in Constants.character[listKey] as an autocheck radiobutton.
	 */
	DefineMacroS("ccRadios", function (args) {
		const varPath = args[0];
		const listKey = args[1];
		if (!varPath || !listKey) throw new Error("<<ccRadios>> needs a variable path and a catalogue key");
		const options = C().character[listKey];
		if (!Array.isArray(options)) throw new Error(`<<ccRadios>>: unknown catalogue "${listKey}"`);
		return `<div class="cc-options">${radiosMarkup(varPath, options)}</div>`;
	});

	/**
	 * <<ccCheck "$player.freckles">>
	 * <<ccCheck "$options.textAnimsDrunk" "Drunk sway">>
	 * Native boolean checkbox. Avoids SugarCube <<checkbox>> init races that desync State from the UI
	 * (notably for heterochromia defaults).
	 */
	DefineMacro("ccCheck", function (args) {
		const varPath = args[0];
		const labelText = args[1] || "Enabled";
		if (!varPath) throw new Error("<<ccCheck>> needs a variable path");

		const isOn = readVar(varPath) === true;
		const $label = jQuery(
			`<label class="cc-option">` +
				`<input type="checkbox"${isOn ? " checked" : ""}>` +
				`<span class="cc-option-label">${escapeHtml(labelText)}</span>` +
				`</label>`
		);

		$label.on("change", "input[type='checkbox']", function () {
			const enabled = this.checked;
			writeVar(varPath, enabled);
			const path = String(varPath).replace(/^\$/, "");
			if (path === "player.heterochromia") {
				syncHeterochromia(enabled);
				refreshEyeColors();
			}
			if (path.indexOf("options.textAnims") === 0) {
				Options.refreshAnimPreviews();
			}
		});

		jQuery(this.output).append($label);
	});
})();
