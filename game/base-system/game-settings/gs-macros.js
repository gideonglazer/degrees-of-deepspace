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

	const PANELS = [
		{ id: "creator", label: "Character Creator", widget: "<<ccSelf>>", contexts: ["start"] },
		{ id: "loveInterest", label: "Love Interest Modifier", widget: "<<ccLoveInterest>>", contexts: ["start", "ingame"] },
		{ id: "general", label: "General", widget: "<<ccGeneral>>", contexts: ["start", "ingame"] },
		{ id: "themes", label: "Themes", widget: "<<ccThemes>>", contexts: ["start", "ingame"] },
	];

	let currentContext = "start";

	function setContext(value) {
		currentContext = value === "ingame" ? "ingame" : "start";
		return currentContext;
	}

	function context() {
		return currentContext;
	}

	function visiblePanels(ctx) {
		const c = ctx || currentContext;
		return PANELS.filter(panel => panel.contexts.indexOf(c) !== -1);
	}

	function panelAllowed(id, ctx) {
		return visiblePanels(ctx).some(panel => panel.id === id);
	}

	function fallbackPanelId(ctx) {
		const allowed = visiblePanels(ctx);
		const general = allowed.find(panel => panel.id === "general");
		return (general || allowed[0] || PANELS[0]).id;
	}

	/**
	 * Clamps `$ccPanel` to a tab allowed in the current (or given) context.
	 */
	function ensurePanel(ctx) {
		const vars = V();
		if (!panelAllowed(vars.ccPanel, ctx)) {
			vars.ccPanel = fallbackPanelId(ctx);
		}
		return vars.ccPanel;
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
					`<span class="${classes.join(" ")}"${style}>${Utils.escapeHtml(entry.label)}</span>` +
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
	 * Seeds left/right eye colours when heterochromia turns on, always as two different colours.
	 * Copies left back to the shared colour when it turns off.
	 */
	function syncHeterochromia(enabled) {
		const player = V().player;
		if (!player) return;
		if (enabled) {
			const base = player.eyeColor || player.eyeColorLeft || "gold";
			player.eyeColorLeft = base;
			player.eyeColorRight = Player.otherEyeColor(base);
		} else if (player.eyeColorLeft) {
			player.eyeColor = player.eyeColorLeft;
		}
	}

	/**
	 * Re-renders the eye-colour fieldsets after heterochromia toggles or a left/right pick.
	 */
	function refreshEyeColors() {
		const $target = jQuery("#ccEyeColors");
		if ($target.length) $target.empty().wiki("<<ccEyeColors>>");
	}

	/**
	 * After a left/right eye pick, keep the two colours different and rebuild the lists
	 * so the other eye's current colour is not offered twice.
	 */
	function bindHeterochromiaEyes() {
		setTimeout(function () {
			const $panel = jQuery("#ccEyeColors");
			$panel.off("change.dodHeterochromia").on("change.dodHeterochromia", "input[type='radio']", function () {
				const name = String(this.name || "");
				setTimeout(function () {
					const player = V().player;
					if (!player || !player.heterochromia) return;
					if (player.eyeColorLeft === player.eyeColorRight) {
						if (name.indexOf("eyeColorRight") !== -1) {
							player.eyeColorLeft = Player.otherEyeColor(player.eyeColorRight);
						} else {
							player.eyeColorRight = Player.otherEyeColor(player.eyeColorLeft);
						}
					}
					refreshEyeColors();
				}, 0);
			});
		}, 0);
	}

	/**
	 * Marks the active tab. Deferred so the widget's HTML is in the document before we query it.
	 * Must live in JS — SugarCube treats `$` inside `<<run>>` as a story-variable sigil.
	 */
	function bindShell() {
		setTimeout(function () {
			const $tabs = jQuery(".cc-tabs button");
			$tabs.addClass("cc-tab");
			visiblePanels().forEach((panel, index) => {
				$tabs.eq(index).attr("data-panel", panel.id);
			});
			$tabs.removeClass("is-active");
			const active = V().ccPanel || fallbackPanelId();
			jQuery('.cc-tab[data-panel="' + active + '"]').addClass("is-active");
		}, 0);
	}

	function tabsMarkup() {
		return visiblePanels()
			.map(panel => `<<button "${escapeAttr(panel.label)}">><<ccPanelSwitch "${panel.id}">><</button>>`)
			.join("");
	}

	/**
	 * Re-wikifies StoryCaption so clock / date / money / hints pick up `$options` immediately.
	 */
	function refreshHud() {
		const $cap = jQuery("#story-caption");
		if (!$cap.length || typeof Story === "undefined") return;
		const passage = Story.get("StoryCaption");
		if (!passage) return;
		const source = typeof passage.processText === "function" ? passage.processText() : passage.text;
		$cap.empty().wiki(source);
	}

	/**
	 * Wires General-tab radios so HUD formatters update without a passage change.
	 */
	function bindGeneral() {
		setTimeout(function () {
			const $general = jQuery("#ccGeneral");
			$general.off("change.dodGeneral").on("change.dodGeneral", "select, input[type='radio'], input[type='checkbox']", function () {
				setTimeout(refreshHud, 0);
			});
		}, 0);
	}

	/**
	 * StoryMenu is built once at startup, so Options cannot be gated with `passage()` in twee.
	 * Keep it visible on Start but unclickable.
	 */
	function syncOptionsMenuState() {
		const onStart = typeof passage === "function" && passage() === "Start";
		jQuery("#menu-story li").each(function () {
			const $item = jQuery(this);
			const label = $item.text().replace(/\s+/g, " ").trim();
			if (label !== "Options") return;
			const $link = $item.find("a");
			$link.toggleClass("is-disabled", onStart);
			if (onStart) {
				$link.attr({ "aria-disabled": "true", tabindex: "-1" });
			} else {
				$link.removeAttr("aria-disabled").removeAttr("tabindex");
			}
		});
	}

	/**
	 * Opens the in-game Options dialog (no Character Creator, no Starting Season).
	 */
	function openDialog() {
		if (typeof passage === "function" && passage() === "Start") return;
		if (typeof Options !== "undefined") Options.ensure();
		if (typeof LoveInterests !== "undefined") LoveInterests.ensure();
		setContext("ingame");
		ensurePanel("ingame");
		Dialog.setup("Options", "options-dialog");
		Dialog.wiki('<<gameSettingsShell "ingame">>');
		Dialog.open();
		if (typeof Options !== "undefined") Options.applyTypography();
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
	 * Styles the Begin button and wires Save Name required-field UX.
	 */
	function styleBegin() {
		setTimeout(function () {
			jQuery("#ccBeginWrap button").addClass("cc-begin");
			bindSaveNameField();
		}, 0);
	}

	function saveNameValue() {
		const $input = jQuery("#ccSaveName input[type='text']");
		const fromDom = $input.length ? String($input.val() || "") : "";
		const fromVar = String((V() && V().saveName) || "");
		return (fromDom || fromVar).trim().slice(0, 48);
	}

	function setSaveNameError(show) {
		const $wrap = jQuery("#ccSaveName");
		const $error = jQuery("#ccSaveNameError");
		const $input = $wrap.find('input[type="text"]');
		if (show) {
			$wrap.addClass("is-invalid");
			$error.removeAttr("hidden");
			$input.attr("aria-invalid", "true");
			if ($input.length) $input.trigger("focus");
		} else {
			$wrap.removeClass("is-invalid");
			$error.attr("hidden", "hidden");
			$input.removeAttr("aria-invalid");
		}
	}

	function bindSaveNameField() {
		const $input = jQuery("#ccSaveName input[type='text']");
		if (!$input.length) return;
		$input.off("input.ccSaveName change.ccSaveName").on("input.ccSaveName change.ccSaveName", function () {
			if (String(this.value || "").trim()) setSaveNameError(false);
		});
	}

	/**
	 * Starts a new game after validating the required Save Name.
	 */
	function begin() {
		const name = saveNameValue();
		if (!name) {
			setSaveNameError(true);
			return;
		}
		V().saveName = name;
		setSaveNameError(false);
		World.startNew();
		jQuery(document.createDocumentFragment()).wiki("<<initPlayState>>");
		Engine.play(Player.isYounger() ? "Intro Younger" : "Intro Older");
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
		PANELS,
		setContext,
		context,
		visiblePanels,
		ensurePanel,
		bindShell,
		bindThemes,
		bindGeneral,
		refreshHud,
		openDialog,
		styleBegin,
		begin,
		randomizeCreator,
		resetCreator,
		refreshEyeColors,
		bindHeterochromiaEyes,
		syncHeterochromia,
		syncLiListbox,
		onLiListboxChange,
		refreshLiNameHeader,
		refreshLiListboxLabels,
	});

	jQuery(document).on(":dialogclosing", function () {
		const body = typeof Dialog !== "undefined" && Dialog.body ? Dialog.body() : null;
		if (body && body.classList && body.classList.contains("options-dialog")) {
			refreshHud();
		}
	});

	jQuery(document).on(":storyready :passagedisplay", syncOptionsMenuState);

	/**
	 * <<gsTabs>>
	 * Renders the Character Creator / Options tab buttons for the current context.
	 */
	DefineMacro("gsTabs", function () {
		jQuery(this.output).wiki(tabsMarkup());
	});

	/**
	 * <<gsPanel>>
	 * Wikifies the widget for `$ccPanel` if that tab is allowed in the current context.
	 */
	DefineMacro("gsPanel", function () {
		ensurePanel();
		const id = V().ccPanel;
		const panel = visiblePanels().find(entry => entry.id === id) || visiblePanels()[0];
		if (panel) jQuery(this.output).wiki(panel.widget);
	});

	/**
	 * <<ccPanelSwitch "creator">>
	 * Switches the Start-page / Options tab and re-renders #ccPanel without a full passage reload.
	 */
	DefineMacro("ccPanelSwitch", function (args) {
		let panel = args[0] || fallbackPanelId();
		if (!panelAllowed(panel)) panel = fallbackPanelId();
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
					`<span class="cc-option-label">${Utils.escapeHtml(name)} (${Utils.escapeHtml(locale.code)})</span>` +
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
		const exclude = args[2] != null && String(args[2]).trim() !== "" ? String(args[2]) : "";
		const list = exclude ? options.filter(entry => entry.value !== exclude) : options;
		return `<div class="cc-options">${radiosMarkup(varPath, list)}</div>`;
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
				`<span class="cc-option-label">${Utils.escapeHtml(labelText)}</span>` +
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
