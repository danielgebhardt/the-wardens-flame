import { devices, expect, test } from "@playwright/test";
import { map, turns } from "./adventure-helpers";

// The Android app's portrait phone layout and touch bar; `?touch` turns them on in a browser.
const { defaultBrowserType: _browser, ...pixel } = devices["Pixel 7"];
test.use(pixel);

const tap = (page: import("@playwright/test").Page, name: string) =>
	page.getByRole("button", { name, exact: true }).tap();

test("touch controls play from town into the dungeon on one phone screen", async ({
	page,
}) => {
	const outside: string[] = [];
	page.on("request", (request) => {
		if (new URL(request.url()).hostname !== "127.0.0.1")
			outside.push(request.url());
	});
	await page.goto("/?touch");
	await page.getByRole("button", { name: "Begin Adventure" }).click();
	const town = page.getByLabel("Town map", { exact: true });
	await expect(town).toBeVisible();

	// Two steps south reach the dungeon gate; Enter descends, as from the keyboard.
	await tap(page, "Move down");
	await tap(page, "Move down");
	await tap(page, "Descend: Enter dungeon");
	await expect(map(page)).toBeVisible();
	await expect(turns(page)).toHaveText("Turn 0");

	await tap(page, "Wait");
	await expect(turns(page)).toHaveText("Turn 1");
	await expect(map(page)).toBeFocused();

	// The whole game fits the phone: no page scrolling either way.
	const overflow = await page.locator("html").evaluate((node) => ({
		x: node.scrollWidth - node.clientWidth,
		y: node.scrollHeight - node.clientHeight,
	}));
	expect(overflow).toEqual({ x: 0, y: 0 });
	const controls = await page
		.getByRole("region", { name: "Touch controls" })
		.boundingBox();
	const viewport = page.viewportSize();
	if (!controls || !viewport) throw new Error("Expected touch controls");
	expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.height);

	await tap(page, "Open character");
	await expect(page.getByRole("dialog")).toBeVisible();
	expect(outside).toEqual([]);
});

test("the desktop layout has no touch controls", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Begin Adventure" }).click();
	await expect(page.getByLabel("Town map", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("region", { name: "Touch controls" }),
	).toHaveCount(0);
	await expect(page.locator("html[data-phone]")).toHaveCount(0);
});
