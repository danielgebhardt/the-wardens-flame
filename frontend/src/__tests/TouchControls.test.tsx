import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firebaseWebConfig } from "../accounts/AccountsConfig";
import * as GameState from "../domain/game/GameState";
import { touchControlsEnabled } from "../settings/Platform";
import {
	renderHome,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

// The Android app's touch bar sends the keys a keyboard player would press, so these
// check that each button reaches the same game action, not new rules.
const setup = () => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		monsters: [
			{
				intent: { type: "idle" as const },
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 1, col: 5 },
				health: 9,
			},
		],
	}));
	renderHome(<Home />);
	const map = screen.getByLabelText("Dungeon map", { exact: true });
	map.focus();
	return { map };
};
const tap = (name: string) =>
	fireEvent.pointerDown(screen.getByRole("button", { name }));
const turn = () => screen.getByLabelText("Turn count");

beforeEach(() => window.history.replaceState(null, "", "/?touch"));
afterEach(() => {
	resetHomeTestState();
	window.history.replaceState(null, "", "/");
});

describe("Touch controls", () => {
	it("only appear in the Android app or with ?touch", () => {
		expect(touchControlsEnabled(false, "")).toBe(false);
		expect(touchControlsEnabled(false, "?touch")).toBe(true);
		expect(touchControlsEnabled(true, "")).toBe(true);
	});

	it("move and wait like the arrow keys and Space, keeping focus on the map", () => {
		const { map } = setup();
		tap("Move right");
		expect(turn()).toHaveTextContent("Turn 1");
		expect(screen.getByLabelText("row1col2 - player")).toBeVisible();
		tap("Wait");
		expect(turn()).toHaveTextContent("Turn 2");
		// A wall: rejected moves cost no turn, as with the keyboard.
		tap("Move up");
		expect(turn()).toHaveTextContent("Turn 2");
		expect(map).toHaveFocus();
	});

	it("aims with the pad, casts from the centre and cancels for free", () => {
		const { map } = setup();
		fireEvent.click(
			screen.getByRole("button", { name: /Magic Missile.*3 mana/ }),
		);
		expect(
			screen.getByRole("button", { name: "Target goblin at row 1, column 5" }),
		).toHaveAttribute("aria-pressed", "true");
		tap("Cancel");
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
		expect(turn()).toHaveTextContent("Turn 0");
		fireEvent.click(
			screen.getByRole("button", { name: /Magic Missile.*3 mana/ }),
		);
		tap("Cast at target");
		expect(turn()).toHaveTextContent("Turn 1");
		expect(screen.getByLabelText("Player mana")).toHaveTextContent(
			"Mana 7 / 10",
		);
		expect(map).toHaveFocus();
	});

	it("open the character sheet", () => {
		setup();
		tap("Open character");
		expect(screen.getByRole("dialog")).toBeVisible();
	});

	it("start a corridor run with Run then a direction", () => {
		setup();
		tap("Run");
		expect(screen.getByText(/Choose a direction/)).toBeInTheDocument();
		tap("Cancel");
		expect(screen.queryByText(/Choose a direction/)).not.toBeInTheDocument();
		expect(turn()).toHaveTextContent("Turn 0");
	});
});

describe("Android app build", () => {
	it("never has accounts, even when Firebase keys are configured", () => {
		const keys = {
			VITE_FIREBASE_API_KEY: "key",
			VITE_FIREBASE_AUTH_DOMAIN: "domain",
			VITE_FIREBASE_PROJECT_ID: "project",
			VITE_FIREBASE_APP_ID: "app",
		};
		expect(firebaseWebConfig({ ...keys, MODE: "production" })).toBeDefined();
		expect(firebaseWebConfig({ ...keys, MODE: "android" })).toBeUndefined();
	});
});
