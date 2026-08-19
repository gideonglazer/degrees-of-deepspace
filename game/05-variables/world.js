/**
 * World clock, calendar, weather, and location. Display formatters respect $options.
 */

defineGlobalNamespaces("World");

(function () {
	"use strict";

	const W = C().world;
	const WEEKDAYS = W.weekdays;
	const MONTH_NAMES = W.monthNames;
	const WEATHER_TEXT = W.weatherText;
	const SEASON_STARTS = W.seasonStarts;
	const SEASON_IDS = W.seasonIds;
	const TIME_BANDS = W.timeBands;
	const HOME_BY_AGE = W.homeByAge;

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
	 */
	function resolveStartingSeason(variables) {
		const vars = variables || V();
		const options = typeof Options !== "undefined" ? Options.ensure(vars) : { startingSeason: "spring" };
		let season = String(options.startingSeason || "autumn");
		if (season === "random") {
			season = SEASON_IDS[getRandomIntInclusive(0, SEASON_IDS.length - 1)];
		}
		if (!SEASON_STARTS[season]) season = "autumn";
		return season;
	}

	/**
	 * Applies the creator Starting Season choice to $world (date, weather, temp).
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

	/**
	 * Home spawn / identity for the player's age.
	 */
	function homeForAge(variables) {
		const ageKey = typeof Player !== "undefined" && Player.isYounger(variables) ? "younger" : "older";
		return HOME_BY_AGE[ageKey];
	}

	/**
	 * True if locationId belongs to the player's gated home (safe zone).
	 */
	function isPlayerHome(locationId, variables) {
		const home = homeForAge(variables);
		const id = String(locationId || "");
		if (!id || !home || !home.locationIds) return false;
		return home.locationIds.indexOf(id) !== -1;
	}

	/**
	 * Fresh calendar for a new run from the character creator.
	 */
	function startNew(variables) {
		const vars = variables || V();
		vars.world = createDefaults(vars);
		applyStartingSeason(vars);
		return vars.world;
	}

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
	 */
	function daysInMonth(year, month) {
		return new Date(year, month, 0).getDate();
	}

	function toDate(world) {
		return new Date(world.year, world.month - 1, world.day, world.hour, world.minute, 0, 0);
	}

	function weekdayName(variables) {
		const world = ensure(variables);
		return WEEKDAYS[toDate(world).getDay()];
	}

	/**
	 * Short weekday label for the HUD (Sun, Mon, …).
	 */
	function weekdayShort(variables) {
		return weekdayName(variables).slice(0, 3);
	}

	/**
	 * Analog clock hand angles (degrees) for the current world time.
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

	function seasonForMonth(month) {
		if (month >= 3 && month <= 5) return "spring";
		if (month >= 6 && month <= 8) return "summer";
		if (month >= 9 && month <= 11) return "autumn";
		return "winter";
	}

	function season(variables) {
		return seasonForMonth(ensure(variables).month);
	}

	/**
	 * True when the current calendar day is Monday–Friday.
	 */
	function isWeekday(variables) {
		const day = toDate(ensure(variables)).getDay();
		return day >= 1 && day <= 5;
	}

	/**
	 * Minutes past midnight for the current world clock.
	 */
	function minutesOfDay(variables) {
		const world = ensure(variables);
		return Math.max(0, Math.floor(Number(world.hour) || 0)) * 60
			+ Math.max(0, Math.min(59, Math.floor(Number(world.minute) || 0)));
	}

	/**
	 * True when the clock is strictly before hour:minute.
	 */
	function isBefore(hour, minute, variables) {
		const target = Math.max(0, Math.min(23, Math.floor(Number(hour) || 0))) * 60
			+ Math.max(0, Math.min(59, Math.floor(Number(minute) || 0)));
		return minutesOfDay(variables) < target;
	}

	/**
	 * Advances the clock by minutes and applies awake or asleep stat effects.
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
			if (typeof School !== "undefined" && School.processMidnight) {
				School.processMidnight(vars);
			}
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
			if (typeof School !== "undefined" && School.processNewDay) {
				School.processNewDay(vars);
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
	 */
	function formatDateLong(variables) {
		const world = ensure(variables);
		return `${weekdayName(variables)}, ${MONTH_NAMES[world.month - 1]} ${world.day}, ${world.year}`;
	}

	function formatTime(variables) {
		const vars = variables || V();
		const world = ensure(vars);
		return formatTimeAt(world.hour, world.minute, vars);
	}

	/**
	 * Formats an arbitrary clock time using $options.timeFormat.
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
	 */
	function weatherText(variables) {
		const world = ensure(variables);
		return WEATHER_TEXT[world.weather] || world.weather || "fair";
	}

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

	function setLocation(id, label, variables) {
		const world = ensure(variables);
		world.location = id || "";
		world.locationLabel = label || id || "";
	}

	/**
	 * Stable calendar key for once-a-day flags, e.g. "2048-3-23".
	 */
	function dayKey(variables) {
		const world = ensure(variables);
		return world.year + "-" + world.month + "-" + world.day;
	}

	/**
	 * Time-of-day band for location flavor: night / morning / afternoon / evening.
	 */
	function timeBand(variables) {
		const minutes = minutesOfDay(variables);
		for (let i = 0; i < TIME_BANDS.length; i++) {
			if (minutes < TIME_BANDS[i].until) return TIME_BANDS[i].id;
		}
		return "night";
	}

	/**
	 * Duration for action links, e.g. "0:15" or "1:05".
	 */
	function formatActionMinutes(minutes) {
		const n = Math.max(0, Math.floor(Number(minutes) || 0));
		const h = Math.floor(n / 60);
		const m = n % 60;
		return `${h}:${String(m).padStart(2, "0")}`;
	}

	Object.assign(World, {
		WEEKDAYS,
		MONTH_NAMES,
		WEATHER_TEXT,
		SEASON_STARTS,
		SEASON_IDS,
		TIME_BANDS,
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
		dayKey,
		timeBand,
		formatActionMinutes,
	});
})();
