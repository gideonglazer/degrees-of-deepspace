/**
 * World clock, calendar, weather, and location. Display formatters respect $options.
 */

defineGlobalNamespaces("World");

(function () {
	"use strict";

	const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	const WEATHER_TEXT = {
		clear: "clear",
		fair: "fair",
		cloudy: "cloudy",
		overcast: "overcast",
		rain: "rainy",
		storm: "stormy",
		fog: "foggy",
		snow: "snowy",
	};

	const SEASON_STARTS = {
		spring: { month: 3, day: 21, weather: "fair", temperatureC: 16 },
		summer: { month: 6, day: 21, weather: "clear", temperatureC: 26 },
		autumn: { month: 9, day: 21, weather: "cloudy", temperatureC: 14 },
		winter: { month: 12, day: 21, weather: "overcast", temperatureC: 2 },
	};

	const SEASON_IDS = ["spring", "summer", "autumn", "winter"];

	/**
	 * Moves a calendar date forward to the Monday on or after it.
	 *
	 * @param {number} year
	 * @param {number} month 1–12
	 * @param {number} day
	 * @returns {{ year: number, month: number, day: number }}
	 */
	function mondayOnOrAfter(year, month, day) {
		const date = new Date(year, month - 1, day, 12, 0, 0, 0);
		const weekday = date.getDay(); /* 0 Sun … 1 Mon … 6 Sat */
		const delta = weekday === 0 ? 1 : weekday === 1 ? 0 : 8 - weekday;
		if (delta) date.setDate(date.getDate() + delta);
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
		};
	}

	/**
	 * Resolves $options.startingSeason into a concrete season id.
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function resolveStartingSeason(variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { startingSeason: "spring" };
		let season = String(options.startingSeason || "spring");
		if (season === "random") {
			season = SEASON_IDS[getRandomIntInclusive(0, SEASON_IDS.length - 1)];
		}
		if (!SEASON_STARTS[season]) season = "spring";
		return season;
	}

	/**
	 * Applies the creator Starting Season choice to $world (date, weather, temp).
	 *
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function applyStartingSeason(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const season = resolveStartingSeason(vars);
		const start = SEASON_STARTS[season];
		const monday = mondayOnOrAfter(world.year, start.month, start.day);
		world.year = monday.year;
		world.month = monday.month;
		world.day = monday.day;
		world.weather = start.weather;
		world.temperatureC = start.temperatureC;
		world.hour = 8;
		world.minute = 0;
		return world;
	}

	const HOME_BY_AGE = {
		older: {
			id: "apartment-bedroom",
			label: "Garden South Street — Apartment",
			passage: "Apartment Bedroom",
			locationIds: [
				"apartment-bedroom",
				"apartment-living-room",
				"apartment-kitchen",
				"apartment-hallway",
				"apartment-hallway-upper",
				"apartment-hallway-lower",
			],
		},
		younger: {
			id: "bloomshore-bedroom",
			label: "Bloomshore District — Home",
			passage: "Bloomshore Bedroom",
			locationIds: [
				"bloomshore-bedroom",
				"bloomshore-hallway",
				"bloomshore-caleb-bedroom",
				"bloomshore-grandma-bedroom",
				"bloomshore-downstairs",
				"bloomshore-living-room",
				"bloomshore-kitchen",
			],
		},
	};

	/**
	 * Home spawn / identity for the player's age.
	 *
	 * @param {object} [variables]
	 * @returns {{ id: string, label: string, passage: string, locationIds: string[] }}
	 */
	function homeForAge(variables) {
		const ageKey = typeof Player !== "undefined" && Player.isYounger(variables) ? "younger" : "older";
		return HOME_BY_AGE[ageKey];
	}

	/**
	 * True if locationId belongs to the player's gated home (safe zone).
	 *
	 * @param {string} locationId
	 * @param {object} [variables]
	 * @returns {boolean}
	 */
	function isPlayerHome(locationId, variables) {
		const home = homeForAge(variables);
		const id = String(locationId || "");
		if (!id || !home || !home.locationIds) return false;
		return home.locationIds.indexOf(id) !== -1;
	}

	/**
	 * Fresh calendar for a new run from the character creator.
	 *
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function startNew(variables) {
		const vars = variables || V();
		vars.world = createDefaults(vars);
		applyStartingSeason(vars);
		return vars.world;
	}

	/**
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function createDefaults(variables) {
		const monday = mondayOnOrAfter(2048, 3, 21);
		const home = homeForAge(variables);
		return {
			year: monday.year,
			month: monday.month,
			day: monday.day,
			hour: 8,
			minute: 0,
			weather: "fair",
			temperatureC: 16,
			location: home.id,
			locationLabel: home.label,
		};
	}

	/**
	 * @param {object} [variables]
	 * @returns {object}
	 */
	function ensure(variables) {
		const vars = variables || V();
		if (!vars.world || typeof vars.world !== "object") {
			vars.world = createDefaults();
		} else {
			const defaults = createDefaults();
			Object.keys(defaults).forEach(key => {
				if (vars.world[key] === undefined) vars.world[key] = defaults[key];
			});
		}
		if (vars.money === undefined) {
			vars.money = typeof Money !== "undefined" ? Money.startingAmount(vars) : 1200;
		}
		return vars.world;
	}

	/**
	 * Days in a month (Gregorian, including leap years).
	 *
	 * @param {number} year
	 * @param {number} month 1–12
	 * @returns {number}
	 */
	function daysInMonth(year, month) {
		return new Date(year, month, 0).getDate();
	}

	/**
	 * @param {object} world
	 * @returns {Date}
	 */
	function toDate(world) {
		return new Date(world.year, world.month - 1, world.day, world.hour, world.minute, 0, 0);
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function weekdayName(variables) {
		const world = ensure(variables);
		return WEEKDAYS[toDate(world).getDay()];
	}

	/**
	 * Short weekday label for the HUD (Sun, Mon, …).
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function weekdayShort(variables) {
		return weekdayName(variables).slice(0, 3);
	}

	/**
	 * Analog clock hand angles (degrees) for the current world time.
	 *
	 * @param {object} [variables]
	 * @returns {{ hour: number, minute: number }}
	 */
	function clockHandAngles(variables) {
		const world = ensure(variables);
		const minute = Math.max(0, Math.min(59, Math.floor(Number(world.minute) || 0)));
		const hour = Math.max(0, Math.min(23, Math.floor(Number(world.hour) || 0)));
		return {
			hour: (hour % 12) * 30 + minute * 0.5,
			minute: minute * 6,
		};
	}

	/**
	 * @param {number} month 1–12
	 * @returns {string}
	 */
	function seasonForMonth(month) {
		if (month >= 3 && month <= 5) return "spring";
		if (month >= 6 && month <= 8) return "summer";
		if (month >= 9 && month <= 11) return "autumn";
		return "winter";
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function season(variables) {
		return seasonForMonth(ensure(variables).month);
	}

	/**
	 * True when the current calendar day is Monday–Friday.
	 *
	 * @param {object} [variables]
	 * @returns {boolean}
	 */
	function isWeekday(variables) {
		const day = toDate(ensure(variables)).getDay();
		return day >= 1 && day <= 5;
	}

	/**
	 * Minutes past midnight for the current world clock.
	 *
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function minutesOfDay(variables) {
		const world = ensure(variables);
		return Math.max(0, Math.floor(Number(world.hour) || 0)) * 60
			+ Math.max(0, Math.min(59, Math.floor(Number(world.minute) || 0)));
	}

	/**
	 * True when the clock is strictly before hour:minute.
	 *
	 * @param {number} hour
	 * @param {number} minute
	 * @param {object} [variables]
	 * @returns {boolean}
	 */
	function isBefore(hour, minute, variables) {
		const target = Math.max(0, Math.min(23, Math.floor(Number(hour) || 0))) * 60
			+ Math.max(0, Math.min(59, Math.floor(Number(minute) || 0)));
		return minutesOfDay(variables) < target;
	}

	/**
	 * Advances the clock by minutes and applies awake or asleep stat effects.
	 *
	 * @param {number} minutes
	 * @param {object} [variables]
	 * @param {{ asleep?: boolean }} [options]
	 * @returns {object}
	 */
	function advance(minutes, variables, options) {
		const vars = variables || V();
		const world = ensure(vars);
		const amount = Math.max(0, Math.floor(Number(minutes) || 0));
		if (!amount) return world;

		let total = world.hour * 60 + world.minute + amount;
		let dayDelta = Math.floor(total / (24 * 60));
		total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
		world.hour = Math.floor(total / 60);
		world.minute = total % 60;

		while (dayDelta > 0) {
			world.day += 1;
			const dim = daysInMonth(world.year, world.month);
			if (world.day > dim) {
				world.day = 1;
				world.month += 1;
				if (world.month > 12) {
					world.month = 1;
					world.year += 1;
				}
			}
			dayDelta -= 1;
		}

		if (typeof Stats !== "undefined") {
			if (options && options.asleep && Stats.sleepEffects) {
				Stats.sleepEffects(amount, vars);
			} else if (Stats.passiveDecay) {
				Stats.passiveDecay(amount, vars);
			}
		}
		return world;
	}

	/**
	 * Minutes from now until the next occurrence of hour:minute (today or tomorrow).
	 *
	 * @param {number} targetHour
	 * @param {number} targetMinute
	 * @param {object} [variables]
	 * @returns {number}
	 */
	function minutesUntil(targetHour, targetMinute, variables) {
		const world = ensure(variables);
		const now = world.hour * 60 + world.minute;
		const target = Math.max(0, Math.min(23, Math.floor(Number(targetHour) || 0))) * 60
			+ Math.max(0, Math.min(59, Math.floor(Number(targetMinute) || 0)));
		let delta = target - now;
		if (delta <= 0) delta += 24 * 60;
		return delta;
	}

	/**
	 * How long a requested sleep would actually last. On weekdays when exhausted,
	 * the body wakes at 8:00 regardless of what was asked for.
	 *
	 * @param {number} hours
	 * @param {object} [variables]
	 * @returns {{ minutes: number, forcedWake: boolean }}
	 */
	function plannedSleep(hours, variables) {
		const vars = variables || V();
		ensure(vars);

		if (typeof Stats !== "undefined" && Stats.isExhausted && Stats.isExhausted(vars) && isWeekday(vars)) {
			return { minutes: minutesUntil(8, 0, vars), forcedWake: true };
		}
		return { minutes: Math.round(Math.max(0, Number(hours) || 0) * 60), forcedWake: false };
	}

	/**
	 * Clock time the player would wake at, for previewing sleep options.
	 *
	 * @param {number} hours
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function wakeTimeFor(hours, variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const total = (world.hour * 60 + world.minute + plannedSleep(hours, vars).minutes) % (24 * 60);
		return formatTimeAt(Math.floor(total / 60), total % 60, vars);
	}

	/**
	 * Sleep for a chosen number of hours, advancing the clock with asleep stat effects.
	 * Writes an autosave after sleeping so rest is a progress checkpoint.
	 *
	 * @param {number} hours
	 * @param {object} [variables]
	 * @returns {{ minutes: number, hours: number, forcedWake: boolean }}
	 */
	function sleepFor(hours, variables) {
		const vars = variables || V();
		const planned = plannedSleep(hours, vars);
		advance(planned.minutes, vars, { asleep: true });
		const result = {
			minutes: planned.minutes,
			hours: Math.round((planned.minutes / 60) * 10) / 10,
			forcedWake: planned.forcedWake,
		};
		delete vars.sleepHours;
		vars.sleepResult = result;
		if (typeof SavesUI !== "undefined" && SavesUI.autosave) {
			SavesUI.autosave();
		}
		return result;
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatDate(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { dateFormat: "MM/DD/YYYY" };
		const y = String(world.year);
		const m = String(world.month).padStart(2, "0");
		const d = String(world.day).padStart(2, "0");
		const format = options.dateFormat || "MM/DD/YYYY";
		if (format === "DD/MM/YYYY") return `${d}/${m}/${y}`;
		if (format === "YYYY/MM/DD") return `${y}/${m}/${d}`;
		return `${m}/${d}/${y}`;
	}

	/**
	 * Long date for prose, e.g. "Monday, March 23, 2048".
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatDateLong(variables) {
		const world = ensure(variables);
		return `${weekdayName(variables)}, ${MONTH_NAMES[world.month - 1]} ${world.day}, ${world.year}`;
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTime(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		return formatTimeAt(world.hour, world.minute, vars);
	}

	/**
	 * Formats an arbitrary clock time using $options.timeFormat.
	 *
	 * @param {number} hour
	 * @param {number} minute
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTimeAt(hour, minute, variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { timeFormat: "12" };
		const h = Math.max(0, Math.min(23, Math.floor(Number(hour) || 0)));
		const m = String(Math.max(0, Math.min(59, Math.floor(Number(minute) || 0)))).padStart(2, "0");
		if (String(options.timeFormat) === "24") {
			return `${String(h).padStart(2, "0")}:${m}`;
		}
		const period = h >= 12 ? "PM" : "AM";
		let hour12 = h % 12;
		if (hour12 === 0) hour12 = 12;
		return `${hour12}:${m} ${period}`;
	}

	/**
	 * Weather adjective for prose ("fair", "rainy", …).
	 *
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function weatherText(variables) {
		const world = ensure(variables);
		return WEATHER_TEXT[world.weather] || world.weather || "fair";
	}

	/**
	 * @param {object} [variables]
	 * @returns {string}
	 */
	function formatTemperature(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { temperature: "fahrenheit" };
		const c = Number(world.temperatureC) || 0;
		if (options.temperature === "celsius") {
			return `${Math.round(c)}°C`;
		}
		return `${Math.round(c * (9 / 5) + 32)}°F`;
	}

	/**
	 * @param {string} id
	 * @param {string} [label]
	 * @param {object} [variables]
	 */
	function setLocation(id, label, variables) {
		const world = ensure(variables);
		world.location = id || "";
		world.locationLabel = label || id || "";
	}

	Object.assign(World, {
		WEEKDAYS,
		MONTH_NAMES,
		WEATHER_TEXT,
		SEASON_STARTS,
		SEASON_IDS,
		HOME_BY_AGE,
		mondayOnOrAfter,
		homeForAge,
		isPlayerHome,
		createDefaults,
		ensure,
		resolveStartingSeason,
		applyStartingSeason,
		startNew,
		daysInMonth,
		toDate,
		weekdayName,
		weekdayShort,
		clockHandAngles,
		isWeekday,
		minutesOfDay,
		isBefore,
		seasonForMonth,
		season,
		advance,
		minutesUntil,
		plannedSleep,
		wakeTimeFor,
		sleepFor,
		formatDate,
		formatDateLong,
		formatTime,
		formatTimeAt,
		weatherText,
		formatTemperature,
		setLocation,
	});
})();
