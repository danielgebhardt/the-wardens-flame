// Checks the GitHub Pages web app (`pnpm webapp:build` first). It serves dist/ under
// /the-wardens-flame/, as Pages does, and checks with Chromium that:
// - the page is installable (CDP Page.getInstallabilityErrors returns nothing);
// - after a reload the service worker controls the page;
// - offline, a reload still boots the game and an adventure can start.
// Run: node scripts/webapp-check.mjs  (CHROMIUM_PATH picks a preinstalled browser).
import {
	createReadStream,
	existsSync,
	mkdtempSync,
	rmSync,
	statSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const BASE = "/the-wardens-flame/";
const TYPES = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".json": "application/json",
	".webmanifest": "application/manifest+json",
	".png": "image/png",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
};

if (!existsSync(join(DIST, "sw.js")))
	throw new Error("dist/ is not a web app build: run pnpm webapp:build first.");

const server = createServer((request, response) => {
	const path = decodeURIComponent((request.url ?? "/").split("?")[0]);
	if (!path.startsWith(BASE)) {
		response.writeHead(404).end();
		return;
	}
	let file = normalize(join(DIST, path.slice(BASE.length)));
	if (!file.startsWith(DIST)) {
		response.writeHead(403).end();
		return;
	}
	if (existsSync(file) && statSync(file).isDirectory())
		file = join(file, "index.html");
	if (!existsSync(file)) {
		response.writeHead(404).end();
		return;
	}
	response.writeHead(200, {
		"Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
	});
	createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}${BASE}`;

// A persistent profile: Chromium never offers to install from an incognito context.
const profile = mkdtempSync(join(tmpdir(), "webapp-check-"));
const context = await chromium.launchPersistentContext(profile, {
	viewport: { width: 412, height: 868 },
	args: ["--disable-background-networking"],
	...(process.env.CHROMIUM_PATH
		? { executablePath: process.env.CHROMIUM_PATH }
		: {}),
});
const failures = [];
const check = (ok, message) => {
	console.log(`${ok ? "ok  " : "FAIL"} ${message}`);
	if (!ok) failures.push(message);
};
try {
	const page = context.pages()[0] ?? (await context.newPage());
	await page.goto(url);
	await page.getByRole("button", { name: "Begin Adventure" }).waitFor();
	await page.evaluate(() => navigator.serviceWorker.ready);

	const cdp = await context.newCDPSession(page);
	const { installabilityErrors } = await cdp.send(
		"Page.getInstallabilityErrors",
	);
	check(
		installabilityErrors.length === 0,
		`installable (errors: ${JSON.stringify(installabilityErrors)})`,
	);
	const manifest = await (
		await page.request.get(`${url}manifest.webmanifest`)
	).json();
	check(
		manifest.display === "standalone" && manifest.icons.length >= 3,
		"manifest is standalone with icons",
	);

	await page.reload();
	const controlled = await page.evaluate(() =>
		Boolean(navigator.serviceWorker.controller),
	);
	check(controlled, "service worker controls the page after a reload");

	await context.setOffline(true);
	await page.reload();
	await page
		.getByRole("button", { name: "Begin Adventure" })
		.waitFor({ timeout: 10000 });
	check(true, "offline reload boots the game");
	await page.getByRole("button", { name: "Begin Adventure" }).click();
	const town = await page
		.getByLabel("Town map", { exact: true })
		.waitFor({ timeout: 10000 })
		.then(() => true)
		.catch(() => false);
	check(town, "offline, an adventure starts in town");
} finally {
	await context.close();
	server.close();
	rmSync(profile, { recursive: true, force: true });
}
if (failures.length) {
	console.error(`${failures.length} web app check(s) failed.`);
	process.exit(1);
}
console.log("The web app is installable and works offline.");
