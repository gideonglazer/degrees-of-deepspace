/**
 * Ensures a Tweego binary is available for this platform.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TWEEGO_VERSION = "2.1.1";
const RELEASE_BASE = `https://github.com/tmedwards/tweego/releases/download/v${TWEEGO_VERSION}`;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = path.join(root, "devTools", "tweego");

function platformSpec() {
	const platform = process.platform;
	const arch = process.arch;

	if (platform === "win32") {
		if (arch === "ia32") {
			return { archive: `tweego-${TWEEGO_VERSION}-windows-x86.zip`, binaryName: "tweego.exe", vendorName: "tweego_win86.exe" };
		}
		return { archive: `tweego-${TWEEGO_VERSION}-windows-x64.zip`, binaryName: "tweego.exe", vendorName: "tweego_win64.exe" };
	}

	if (platform === "darwin") {
		return { archive: `tweego-${TWEEGO_VERSION}-macos-x64.zip`, binaryName: "tweego", vendorName: "tweego_osx64" };
	}

	if (platform === "linux") {
		if (arch === "ia32") {
			return { archive: `tweego-${TWEEGO_VERSION}-linux-x86.zip`, binaryName: "tweego", vendorName: "tweego_linux86" };
		}
		return { archive: `tweego-${TWEEGO_VERSION}-linux-x64.zip`, binaryName: "tweego", vendorName: "tweego_linux64" };
	}

	return null;
}

function tweegoOnPath() {
	const result =
		process.platform === "win32"
			? spawnSync("where", ["tweego"], { encoding: "utf8", windowsHide: true })
			: spawnSync("bash", ["-c", "command -v tweego"], { encoding: "utf8" });
	return result.status === 0;
}

function vendoredPath(vendorName) {
	return path.join(vendorDir, vendorName);
}

function log(message) {
	process.stdout.write(`[tweego] ${message}\n`);
}

/**
 * Downloads the platform binary into devTools/tweego/ if neither PATH nor a vendored copy exists.
 */
export async function ensureTweego() {
	if (tweegoOnPath()) return;

	const spec = platformSpec();
	if (!spec) {
		throw new Error(`No Tweego binary is available for ${process.platform}/${process.arch}. Install from http://www.motoslave.net/tweego/`);
	}

	const dest = vendoredPath(spec.vendorName);
	if (fs.existsSync(dest)) return;

	fs.mkdirSync(vendorDir, { recursive: true });

	const url = `${RELEASE_BASE}/${spec.archive}`;
	log(`downloading ${spec.archive} (one-time)…`);

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download Tweego (${response.status} ${response.statusText}): ${url}`);
	}

	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tweego-"));
	const zipPath = path.join(tmpDir, spec.archive);
	const extracted = path.join(tmpDir, spec.binaryName);

	try {
		fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));

		const tar = spawnSync("tar", ["-xf", zipPath, "-C", tmpDir, spec.binaryName], {
			encoding: "utf8",
			windowsHide: true,
		});
		if (tar.status !== 0 || !fs.existsSync(extracted)) {
			throw new Error(`Failed to extract ${spec.binaryName} from ${spec.archive}: ${tar.stderr || tar.stdout || "unknown error"}`);
		}

		fs.copyFileSync(extracted, dest);
		if (process.platform !== "win32") {
			fs.chmodSync(dest, 0o755);
		}
		log(`installed ${path.relative(root, dest)}`);
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	}
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	ensureTweego().catch(err => {
		process.stderr.write(`${err.message || err}\n`);
		process.exit(1);
	});
}
