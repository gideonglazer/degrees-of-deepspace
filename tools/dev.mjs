/**
 * Development server for Degrees of Deepspace.
 *
 * Rebuilds the story whenever a source file changes, serves the project root over HTTP (so runtime
 * assets like style.css and img/ resolve), and pushes a reload to open tabs.
 *
 * Usage: npm run dev  (PORT=8080 by default)
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensureTweego } from "./ensure-tweego.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Empty FORCE_VERSION omits the version suffix, giving the dev server a stable output path.
const BUILD_ENV = { ...process.env, FORCE_VERSION: "" };
const OUTPUT_HTML = "Degrees of Deepspace.html";

/** Sources that require a full tweego rebuild when touched. */
const REBUILD_PATHS = ["game", "modules", "devTools/head.html"];
/** Sources the browser loads at runtime, so a reload without a rebuild is enough. */
const RELOAD_PATHS = ["style.css"];
/** File extensions worth reacting to; everything else is editor noise. */
const WATCHED_EXTENSIONS = new Set([".twee", ".tw", ".js", ".css", ".html", ".json"]);
const POLL_INTERVAL_MS = 400;

const clients = new Set();

function log(label, message) {
	process.stdout.write(`[${label}] ${message}\n`);
}

function notifyReload() {
	for (const res of clients) res.write("data: reload\n\n");
}

let building = false;
let buildQueued = false;

function spawnCompile() {
	const isWin = process.platform === "win32";
	return isWin
		? spawn("cmd.exe", ["/c", "compile.bat"], { cwd: root, env: BUILD_ENV, windowsHide: true })
		: spawn("bash", ["compile.sh"], { cwd: root, env: BUILD_ENV });
}

function build() {
	if (building) {
		buildQueued = true;
		return;
	}
	building = true;

	const child = spawnCompile();
	let stderr = "";
	child.stdout.on("data", d => process.stdout.write(`[build] ${d}`));
	child.stderr.on("data", d => {
		stderr += d;
		process.stderr.write(`[build] ${d}`);
	});
	child.on("error", err => {
		building = false;
		log("build", err.message);
	});
	child.on("exit", code => {
		building = false;
		if (code === 0) {
			notifyReload();
		} else {
			log("build", `failed with code ${code}`);
			if (stderr) log("build", "see the tweego output above for the failing passage");
		}
		if (buildQueued) {
			buildQueued = false;
			build();
		}
	});
}

/**
 * Builds a "path -> mtime" snapshot of the given files and directory trees.
 *
 * Polling rather than fs.watch: recursive fs.watch is FSEvents-backed on macOS and inotify-backed on
 * Linux, and both can fail on limits or under sandboxing in ways that kill the process. The source
 * tree here is small enough that scanning it is cheaper than the bug reports.
 *
 * @param {string[]} relPaths
 * @returns {Map<string, number>}
 */
function snapshot(relPaths) {
	const seen = new Map();

	const visit = absPath => {
		let stats;
		try {
			stats = fs.statSync(absPath);
		} catch {
			return;
		}

		if (stats.isDirectory()) {
			fs.readdirSync(absPath)
				.filter(name => !name.startsWith("."))
				.forEach(name => visit(path.join(absPath, name)));
			return;
		}

		if (!WATCHED_EXTENSIONS.has(path.extname(absPath).toLowerCase())) return;
		seen.set(absPath, stats.mtimeMs);
	};

	relPaths.map(relPath => path.join(root, relPath)).forEach(visit);
	return seen;
}

/**
 * Calls `onChange` when any watched file is added, removed, or modified.
 *
 * @param {string[]} relPaths
 * @param {Function} onChange
 */
function watch(relPaths, onChange) {
	let previous = snapshot(relPaths);

	setInterval(() => {
		const current = snapshot(relPaths);
		if (current.size === previous.size && Array.from(current).every(([file, mtime]) => previous.get(file) === mtime)) return;
		previous = current;
		onChange();
	}, POLL_INTERVAL_MS).unref();
}

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
};

const RELOAD_SNIPPET = `<script>new EventSource("/__dev/events").onmessage=function(){location.reload()};</script>`;

function serve(req, res) {
	const urlPath = decodeURIComponent(req.url.split("?")[0]);

	if (urlPath === "/__dev/events") {
		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});
		res.write("retry: 1000\n\n");
		clients.add(res);
		req.on("close", () => clients.delete(res));
		return;
	}

	const filePath = path.join(root, urlPath === "/" ? OUTPUT_HTML : urlPath);
	if (!filePath.startsWith(root)) {
		res.writeHead(403).end("Forbidden");
		return;
	}

	fs.readFile(filePath, (err, data) => {
		if (err) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end(err.code === "ENOENT" ? `Not found: ${urlPath}` : String(err));
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		let body = data;
		if (ext === ".html") body = data.toString("utf8").replace("</body>", `${RELOAD_SNIPPET}</body>`);

		res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
		res.end(body);
	});
}

function listen(port, attemptsLeft) {
	if (attemptsLeft <= 0) {
		log("serve", "could not find a free port; set PORT to choose one");
		process.exit(1);
	}
	const server = http.createServer(serve);
	server.once("error", err => {
		if (err.code !== "EADDRINUSE") throw err;
		log("serve", `port ${port} in use, trying ${port + 1}`);
		listen(port + 1, attemptsLeft - 1);
	});
	server.listen(port, () => {
		log("serve", `http://localhost:${port}`);
		log("serve", `watching ${REBUILD_PATHS.join(", ")} — the page reloads itself after each build`);
	});
}

try {
	await ensureTweego();
} catch (err) {
	process.stderr.write(`[tweego] ${err.message || err}\n`);
	process.exit(1);
}

build();
watch(REBUILD_PATHS, build);
watch(RELOAD_PATHS, notifyReload);
listen(Number(process.env.PORT) || 8080, 10);
