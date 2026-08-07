/**
 * Cross-platform compile entry point.
 *
 * Ensures Tweego is available, then runs compile.sh (Unix) or compile.bat (Windows).
 *
 * Usage: node tools/compile.mjs [-w] […]
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensureTweego } from "./ensure-tweego.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

/**
 * Spawns the platform compile script with the given args, inheriting stdio.
 */
export function runCompile(compileArgs = [], env = process.env) {
	const isWin = process.platform === "win32";
	const child = isWin
		? spawn("cmd.exe", ["/c", "compile.bat", ...compileArgs], { cwd: root, env, stdio: "inherit", windowsHide: true })
		: spawn("bash", ["compile.sh", ...compileArgs], { cwd: root, env, stdio: "inherit" });

	return new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("exit", code => resolve(code ?? 1));
	});
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	try {
		await ensureTweego();
		const code = await runCompile(args);
		process.exit(code);
	} catch (err) {
		process.stderr.write(`${err.message || err}\n`);
		process.exit(1);
	}
}
