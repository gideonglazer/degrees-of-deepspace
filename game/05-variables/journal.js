/**
 * Journal reminders (appointments, permanent notes)
 */

defineGlobalNamespaces("Journal");

(function () {
	"use strict";

	function createDefaults() {
		return {
			reminders: [],
		};
	}

	function ensure(variables) {
		const vars = variables || V();
		if (!vars.journal || typeof vars.journal !== "object") {
			vars.journal = createDefaults();
		}
		if (!Array.isArray(vars.journal.reminders)) {
			vars.journal.reminders = [];
		}
		return vars.journal;
	}

	function find(id, variables) {
		const journal = ensure(variables);
		return journal.reminders.find(entry => entry.id === id) || null;
	}

	/**
	 * Adds or replaces a reminder. Pass permanent: true for lasting notes.
	 */
	function addReminder(id, text, opts, variables) {
		const journal = ensure(variables);
		const options = opts || {};
		const existing = find(id, variables);
		if (existing) {
			existing.text = String(text || "");
			if (options.permanent !== undefined) existing.permanent = !!options.permanent;
			return existing;
		}
		const entry = {
			id: String(id),
			text: String(text || ""),
			permanent: !!options.permanent,
			created: Date.now(),
		};
		journal.reminders.push(entry);
		return entry;
	}

	function update(id, text, variables) {
		const existing = find(id, variables);
		if (!existing) return addReminder(id, text, { permanent: true }, variables);
		existing.text = String(text || "");
		return existing;
	}

	function remove(id, variables) {
		const journal = ensure(variables);
		const before = journal.reminders.length;
		journal.reminders = journal.reminders.filter(entry => entry.id !== id);
		return journal.reminders.length < before;
	}

	function list(variables) {
		return ensure(variables).reminders.slice();
	}

	/**
	 * Permanent notes first, then the rest in insertion order.
	 */
	function listSorted(variables) {
		const items = list(variables);
		return items.slice().sort((a, b) => {
			if (a.permanent === b.permanent) return (a.created || 0) - (b.created || 0);
			return a.permanent ? -1 : 1;
		});
	}

	/**
	 * Opens the journal in a SugarCube modal dialog
	 */
	function openDialog() {
		ensure();
		Dialog.setup("Journal", "journal-dialog");
		Dialog.wiki("<<journalContents>>");
		Dialog.open();
	}

	Object.assign(Journal, {
		createDefaults,
		ensure,
		find,
		addReminder,
		update,
		remove,
		list,
		listSorted,
		openDialog,
	});
})();
