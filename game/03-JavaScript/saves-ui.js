/**
 * Saves dialog: slot list, pager, and export/import controls at the bottom.
 * SugarCube's UI.buildSaves is non-writable, so we intercept the sidebar Saves link instead.
 */

defineGlobalNamespaces("SavesUI");

(function () {
	"use strict";

	const MAX_SLOTS = 500;
	const PREFS_KEY = "dod.saves.prefs";
	const PREFS_VERSION = 2;
	const DEFAULT_PREFS = {
		prefsVersion: PREFS_VERSION,
		page: 1,
		slotsPerPage: 5,
		confirmOverwrite: false,
		confirmLoad: false,
		confirmDelete: true,
	};

	let allowAutoSave = false;
	let hooksInstalled = false;
	let prefs = loadPrefs();

	function loadPrefs() {
		try {
			const raw = localStorage.getItem(PREFS_KEY);
			if (!raw) return Object.assign({}, DEFAULT_PREFS);
			const loaded = Object.assign({}, DEFAULT_PREFS, JSON.parse(raw));
			/* Drop prefs from the old Saves / Export tab UI. */
			delete loaded.activeTab;
			if ((loaded.prefsVersion || 0) < PREFS_VERSION) {
				loaded.slotsPerPage = DEFAULT_PREFS.slotsPerPage;
				loaded.prefsVersion = PREFS_VERSION;
				try {
					localStorage.setItem(PREFS_KEY, JSON.stringify(loaded));
				} catch (ex) {
					/* quota / private mode */
				}
			}
			return loaded;
		} catch (ex) {
			return Object.assign({}, DEFAULT_PREFS);
		}
	}

	function savePrefs() {
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		} catch (ex) {
			/* quota / private mode */
		}
	}

	function isAutoSaveAllowed() {
		return allowAutoSave;
	}

	function slotsPerPage() {
		const n = Math.trunc(Number(prefs.slotsPerPage)) || DEFAULT_PREFS.slotsPerPage;
		return Math.max(1, Math.min(20, n));
	}

	function slotCount() {
		const configured = Config.saves.maxSlotSaves || 0;
		return Math.min(configured, MAX_SLOTS);
	}

	function pageCount() {
		return Math.max(1, Math.ceil(slotCount() / slotsPerPage()));
	}

	function clampPage() {
		const pages = pageCount();
		const page = Math.trunc(Number(prefs.page)) || 1;
		prefs.page = Math.max(1, Math.min(pages, page));
	}

	function alertError(ex) {
		const message = ex && ex.message ? ex.message : String(ex);
		UI.alert(`${message.toUpperFirst()}.</p><p>${L10n.get("textAborting")}.`);
	}

	function confirmAction(message) {
		return window.confirm(message);
	}

	/**
	 * Optional custom save ID/name from Game Settings ($saveName).
	 */
	function customSaveName() {
		try {
			const vars = typeof V === "function" ? V() : null;
			const name = vars && vars.saveName != null ? String(vars.saveName).trim() : "";
			return name.slice(0, 32);
		} catch (ex) {
			return "";
		}
	}

	/**
	 * Current passage name. Do not use Passage#description() — in SugarCube 2.37 that is always "Turn N".
	 */
	function currentPassageTitle() {
		try {
			const name = typeof passage === "function" ? passage() : "";
			if (name) return String(name);
		} catch (ex) {
		}
		try {
			if (typeof State !== "undefined" && State.passage) return String(State.passage);
		} catch (ex) {
		}
		return "";
	}

	/**
	 * Story dialogue snippet for the Details column
	 */
	function passageExcerpt(maxLen) {
		const limit = Math.max(24, Math.trunc(Number(maxLen)) || 72);
		let text = "";

		try {
			const root = document.querySelector("#passages .passage") || document.querySelector("#passages");
			if (root) {
				const clone = root.cloneNode(true);
				clone.querySelectorAll("a, button, input, select, textarea, script, style, .macro-link, .link-internal").forEach(el => {
					el.remove();
				});
				text = String(clone.textContent || "")
					.replace(/\s+/g, " ")
					.trim();
			}
		} catch (ex) {
			text = "";
		}

		if (!text) {
			try {
				const title = currentPassageTitle();
				const p = title && typeof Story !== "undefined" && Story.get ? Story.get(title) : null;
				if (p && p.text) {
					text = String(p.text)
						.replace(/\/\*[\s\S]*?\*\//g, " ")
						.replace(/<<[\s\S]*?>>/g, " ")
						.replace(/\[\[(?:[^\]]*\|)?([^\]]*)\]\]/g, "$1")
						.replace(/\s+/g, " ")
						.trim();
				}
			} catch (ex) {
			}
		}

		if (!text) text = currentPassageTitle();
		if (text.length <= limit) return text;
		return `${text
			.slice(0, limit)
			.replace(/\s+\S*$/, "")
			.trim()}…`;
	}

	function savePayload() {
		const saveName = customSaveName();
		const detail = passageExcerpt(72);
		return {
			desc: detail || saveName || currentPassageTitle(),
			metadata: { saveName, detail },
		};
	}

	/**
	 * Stamp ID name + dialogue excerpt onto every save (slot, auto, disk).
	 */
	function onSave(save) {
		const payload = savePayload();
		if (payload.desc) save.desc = payload.desc;
		save.metadata = Object.assign({}, save.metadata || {}, payload.metadata);
	}

	function isTurnLabel(text) {
		return /^Turn\s+\d+/i.test(String(text || "").trim());
	}

	function displayName(info) {
		if (!info) return "";
		const fromMeta = info.metadata && info.metadata.saveName != null ? String(info.metadata.saveName).trim() : "";
		if (fromMeta && !isTurnLabel(fromMeta)) return fromMeta;
		return "";
	}

	function displayDetail(info) {
		if (!info) return "";
		if (info.metadata && info.metadata.detail) {
			const detail = String(info.metadata.detail).trim();
			if (detail && !isTurnLabel(detail)) return detail;
		}
		const desc = String(info.desc || "").trim();
		if (desc && !isTurnLabel(desc)) return desc;
		return "";
	}

	function createFileInput(id, callback) {
		const input = document.createElement("input");
		jQuery(input)
			.attr({ id, type: "file", tabindex: -1, "aria-hidden": true })
			.css({
				display: "block",
				visibility: "hidden",
				position: "fixed",
				left: "-16128px",
				top: "-16128px",
				width: "1px",
				height: "1px",
			})
			.on("change", callback);
		return input;
	}

	function makeButton(label, classNames, onClick) {
		const $btn = jQuery(document.createElement("button")).text(label);
		if (classNames) $btn.addClass(classNames);
		if (onClick) $btn.ariaClick({ label }, onClick);
		else $btn.prop("disabled", true).ariaDisabled(true);
		return $btn;
	}

	function loadSlot(index) {
		return Save.browser.slot.load(index).then(Engine.show, alertError);
	}

	function loadAuto(index) {
		return Save.browser.auto.load(index).then(Engine.show, alertError);
	}

	function requestSave(index, info) {
		const slotAllowed = typeof Config.saves.isAllowed !== "function" || Config.saves.isAllowed(Save.Type.Slot);
		if (!slotAllowed) {
			alertError(new Error(L10n.get("saveErrorDisallowed") || "Saving is not allowed here."));
			return;
		}
		if (info && prefs.confirmOverwrite && !confirmAction(`Overwrite save on slot ${index + 1}?`)) return;
		const payload = savePayload();
		try {
			Save.browser.slot.save(index, payload.desc, payload.metadata);
			render();
		} catch (ex) {
			alertError(ex);
		}
	}

	function requestLoad(kind, index, info) {
		if (!info) return;
		const label = kind === "auto" ? "autosave" : `slot ${index + 1}`;
		if (prefs.confirmLoad && !confirmAction(`Load ${label}?`)) return;
		jQuery(document).one(":dialogclosed", () => {
			if (kind === "auto") loadAuto(index);
			else loadSlot(index);
		});
		Dialog.close();
	}

	function requestDelete(kind, index, info) {
		if (!info) return;
		const label = kind === "auto" ? "autosave" : `slot ${index + 1}`;
		if (prefs.confirmDelete && !confirmAction(`Delete save in ${label}?`)) return;
		try {
			if (kind === "auto") Save.browser.auto.delete(index);
			else Save.browser.slot.delete(index);
			render();
		} catch (ex) {
			alertError(ex);
		}
	}

	function jumpToMostRecent() {
		const entries = Save.browser.slot.entries();
		if (!entries.length) return;
		let best = entries[0];
		entries.forEach(entry => {
			const bestDate = (best.info && best.info.date) || 0;
			const date = (entry.info && entry.info.date) || 0;
			if (date >= bestDate) best = entry;
		});
		prefs.page = Math.floor(best.index / slotsPerPage()) + 1;
		savePrefs();
		render();
	}

	function appendPager($parent) {
		clampPage();
		const pages = pageCount();
		const $row = jQuery(document.createElement("div")).addClass("dod-saves-pager");

		$row.append(jQuery(document.createElement("span")).addClass("dod-saves-pager-label").text("Page:"));

		const $prev = makeButton("<", "dod-saves-page-btn", () => {
			prefs.page = Math.max(1, prefs.page - 1);
			savePrefs();
			render();
		});
		if (prefs.page <= 1) $prev.prop("disabled", true).ariaDisabled(true);

		const $input = jQuery(document.createElement("input")).addClass("dod-saves-page-input").attr({
			type: "number",
			min: 1,
			max: pages,
			value: prefs.page,
			"aria-label": "Save page number",
		});
		$input.on("change", () => {
			prefs.page = $input.val();
			clampPage();
			savePrefs();
			render();
		});
		$input.on("keydown", ev => {
			if (ev.key === "Enter") {
				ev.preventDefault();
				prefs.page = $input.val();
				clampPage();
				savePrefs();
				render();
			}
		});

		const $next = makeButton(">", "dod-saves-page-btn", () => {
			prefs.page = Math.min(pages, prefs.page + 1);
			savePrefs();
			render();
		});
		if (prefs.page >= pages) $next.prop("disabled", true).ariaDisabled(true);

		const $perLabel = jQuery(document.createElement("span")).addClass("dod-saves-pager-label").text("Saves per page:");
		const $per = jQuery(document.createElement("input")).addClass("dod-saves-per-input").attr({
			type: "number",
			min: 1,
			max: 20,
			value: slotsPerPage(),
			"aria-label": "Saves per page",
		});
		$per.on("change", () => {
			prefs.slotsPerPage = $per.val();
			clampPage();
			savePrefs();
			render();
		});

		const $jump = makeButton("Jump to most recent manual save", "dod-saves-jump", jumpToMostRecent);
		if (!Save.browser.slot.size) $jump.prop("disabled", true).ariaDisabled(true);

		$row.append($prev, $input, $next, $perLabel, $per, $jump);
		$parent.append($row);
	}

	function appendExportControls($parent) {
		const $actions = jQuery(document.createElement("div")).addClass("dod-saves-export-actions");

		if (Has.fileAPI) {
			const diskSaveAllowed = typeof Config.saves.isAllowed !== "function" || Config.saves.isAllowed(Save.Type.Disk);
			$actions.append(makeButton("Save to File…", "dod-saves-btn dod-saves-btn-export", diskSaveAllowed ? () => Save.disk.save(Story.name) : null));

			$actions.append(
				makeButton("Save to Clipboard…", "dod-saves-btn dod-saves-btn-export", () => {
					try {
						const data = Save.base64.save();
						navigator.clipboard.writeText(data).then(
							() => UI.alert("Save data copied to clipboard."),
							() => alertError(new Error("Could not write to the clipboard."))
						);
					} catch (ex) {
						alertError(ex);
					}
				})
			);

			const loadInput = createFileInput("dod-saves-disk-load", ev => {
				jQuery(document).one(":dialogclosed", () => {
					Save.disk.load(ev).then(Engine.show, alertError);
				});
				Dialog.close();
			});
			$actions.append(makeButton("Load from File…", "dod-saves-btn dod-saves-btn-export", () => loadInput.click()));
			jQuery(loadInput).appendTo($parent);
		}

		$actions.append(
			makeButton(
				"Delete All",
				"dod-saves-btn dod-saves-btn-delete-all",
				Save.browser.size > 0
					? () => {
							if (!confirmAction("Delete all browser saves? This cannot be undone.")) return;
							Save.browser.clear();
							render();
					  }
					: null
			)
		);

		$parent.append($actions);
	}

	function appendConfirmRow($parent) {
		const $confirm = jQuery(document.createElement("div")).addClass("dod-saves-confirm-row");
		$confirm.append(jQuery(document.createElement("span")).text("Require confirmation on:"));

		[
			["confirmOverwrite", "Overwrite"],
			["confirmLoad", "Load"],
			["confirmDelete", "Delete"],
		].forEach(([key, label], i, arr) => {
			const id = `dod-saves-${key}`;
			const $label = jQuery(document.createElement("label")).attr("for", id);
			const $cb = jQuery(document.createElement("input")).attr({ id, type: "checkbox" }).prop("checked", !!prefs[key]);
			$cb.on("change", () => {
				prefs[key] = $cb.prop("checked");
				savePrefs();
			});
			$label.append($cb, document.createTextNode(` ${label}`));
			$confirm.append($label);
			if (i < arr.length - 1) $confirm.append(jQuery(document.createElement("span")).addClass("dod-saves-sep").text("|"));
		});

		$parent.append($confirm);
	}

	function appendSlotRow($tbody, opts) {
		const { label, kind, index, info } = opts;
		const $tr = jQuery(document.createElement("tr")).addClass(info ? "dod-saves-filled" : "dod-saves-empty");

		$tr.append(jQuery(document.createElement("td")).addClass("dod-saves-num").text(label));

		const $actions = jQuery(document.createElement("td")).addClass("dod-saves-actions");
		if (kind === "slot") {
			$actions.append(
				makeButton("Save", "dod-saves-btn dod-saves-btn-save", () => requestSave(index, info)),
				makeButton("Load", "dod-saves-btn dod-saves-btn-load", info ? () => requestLoad("slot", index, info) : null)
			);
		} else {
			$actions.append(makeButton("Load", "dod-saves-btn dod-saves-btn-load", info ? () => requestLoad("auto", index, info) : null));
		}
		$tr.append($actions);

		$tr.append(jQuery(document.createElement("td")).addClass("dod-saves-id").text(displayName(info)));

		const $details = jQuery(document.createElement("td")).addClass("dod-saves-details");
		if (info) {
			const detail = displayDetail(info);
			if (detail) {
				jQuery(document.createElement("div")).addClass("dod-saves-detail-text").text(detail).appendTo($details);
			}
			jQuery(document.createElement("div"))
				.addClass("dod-saves-datestamp")
				.text(info.date ? new Date(info.date).toLocaleString() : "")
				.appendTo($details);
		}
		$tr.append($details);

		const $del = jQuery(document.createElement("td")).addClass("dod-saves-delete");
		$del.append(makeButton("Delete", "dod-saves-btn dod-saves-btn-delete", info ? () => requestDelete(kind, index, info) : null));
		$tr.append($del);

		$tbody.append($tr);
	}

	/**
	 * Rebuild dialog body.
	 */
	function render() {
		prefs = Object.assign(prefs, loadPrefs());
		clampPage();

		const browserEnabled = Save.browser.isEnabled();
		if (!browserEnabled && !Has.fileAPI) {
			UI.alert(L10n.get("warningNoSaves"));
			return false;
		}

		Dialog.create(L10n.get("savesTitle") || "Saves", "dod-saves");
		const $body = jQuery(Dialog.body());

		jQuery(document.createElement("p"))
			.addClass("dod-saves-warning")
			.text("Warning: If your browser cache is cleared, saves here will be lost! Consider saving to file every so often!")
			.appendTo($body);

		const $table = jQuery(document.createElement("table")).addClass("dod-saves-table").attr("id", "saves-list");
		const $thead = jQuery(document.createElement("thead")).appendTo($table);
		const $headRow = jQuery(document.createElement("tr")).appendTo($thead);
		["#", "Save/Load", "ID/Name", "Details", ""].forEach(text => {
			$headRow.append(jQuery(document.createElement("th")).text(text));
		});

		const $tbody = jQuery(document.createElement("tbody")).appendTo($table);

		const autoEntries = Save.browser.auto.entries();
		if (autoEntries.length) {
			autoEntries.forEach(entry => {
				appendSlotRow($tbody, {
					label: "A",
					kind: "auto",
					index: entry.index,
					info: entry.info,
				});
			});
		} else if (Config.saves.maxAutoSaves > 0) {
			appendSlotRow($tbody, {
				label: "A",
				kind: "auto",
				index: 0,
				info: null,
			});
		}

		const filled = Object.create(null);
		Save.browser.slot.entries().forEach(entry => {
			filled[entry.index] = entry.info;
		});

		const per = slotsPerPage();
		const start = (prefs.page - 1) * per;
		const end = Math.min(start + per, slotCount());

		for (let i = start; i < end; i++) {
			appendSlotRow($tbody, {
				label: String(i + 1),
				kind: "slot",
				index: i,
				info: filled[i],
			});
		}

		$body.append($table);
		appendExportControls($body);
		appendPager($body);
		appendConfirmRow($body);

		return true;
	}

	function open() {
		if (!render()) return false;
		Dialog.open();
		return true;
	}

	function autosave(desc) {
		if (!Save.browser.auto.isEnabled()) return false;
		allowAutoSave = true;
		try {
			const payload = savePayload();
			Save.browser.auto.save(desc || payload.desc, payload.metadata);
			return true;
		} catch (ex) {
			console.error("Autosave failed:", ex);
			return false;
		} finally {
			allowAutoSave = false;
		}
	}

	/**
	 * Register save hooks once; bind the sidebar link when the menu exists.
	 */
	function install() {
		if (!hooksInstalled) {
			hooksInstalled = true;
			Save.onSave.add(onSave);
			Config.saves.descriptions = () => savePayload().desc;
		}

		const link = document.querySelector("#menu-item-saves a");
		if (link && !link.dataset.dodSavesBound) {
			link.dataset.dodSavesBound = "1";
			link.addEventListener(
				"click",
				ev => {
					ev.preventDefault();
					ev.stopImmediatePropagation();
					open();
				},
				true
			);
		}

		try {
			Object.defineProperty(UI, "saves", { configurable: true, writable: true, value: open });
		} catch (ex) {
		}
	}

	install();
	jQuery(document).one(":storyready", install);

	Object.assign(SavesUI, {
		isAutoSaveAllowed,
		open,
		autosave,
	});
})();
