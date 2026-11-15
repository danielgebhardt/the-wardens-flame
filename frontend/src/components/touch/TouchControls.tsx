import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	ChevronsRight,
	DoorOpen,
	Hand,
	Hourglass,
	PackageOpen,
	Sparkles,
	UserRound,
	X,
} from "lucide-react";
import {
	type ComponentType,
	type PointerEvent,
	type ReactNode,
	type RefObject,
	useEffect,
	useRef,
} from "react";
import { IS_ANDROID_APP } from "../../settings/Platform";

// Touch buttons are a keyboard for the map. Each press sends the key a keyboard player would
// press to the focused map surface, so movement, aiming, corridor runs and town travel keep
// one set of rules, and touch play can't diverge from keyboard play.
export const dispatchGameKey = (
	target: HTMLElement | null | undefined,
	key: string,
	repeat = false,
): void => {
	if (!target) return;
	target.dispatchEvent(
		new KeyboardEvent("keydown", {
			key,
			code: key === " " ? "Space" : key,
			repeat,
			bubbles: true,
			cancelable: true,
		}),
	);
};

// Held direction buttons repeat like a held key.
const REPEAT_DELAY_MS = 350;
const REPEAT_INTERVAL_MS = 150;

const stopRepeating = (timer: RefObject<number | undefined>) => {
	window.clearTimeout(timer.current);
	window.clearInterval(timer.current);
	timer.current = undefined;
};

type TouchButtonProps = {
	label: string;
	icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	gameKey: string;
	mapRef: RefObject<HTMLElement | null>;
	repeats?: boolean;
	text?: string;
	badge?: boolean;
	className?: string;
};

const TouchButton = ({
	label,
	icon: Icon,
	gameKey,
	mapRef,
	repeats = false,
	text,
	badge = false,
	className = "",
}: TouchButtonProps) => {
	const timer = useRef<number | undefined>(undefined);
	const stop = () => stopRepeating(timer);
	// A button that unmounts mid-hold (a dialog opening) must not keep sending keys.
	useEffect(() => () => stopRepeating(timer), []);
	const start = (event: PointerEvent<HTMLButtonElement>) => {
		// Keep focus on the map: a focused button would own the keys it sends.
		event.preventDefault();
		if (event.button !== 0) return;
		stop();
		dispatchGameKey(mapRef.current, gameKey);
		if (!repeats) return;
		timer.current = window.setTimeout(() => {
			timer.current = window.setInterval(
				() => dispatchGameKey(mapRef.current, gameKey, true),
				REPEAT_INTERVAL_MS,
			);
		}, REPEAT_DELAY_MS);
	};
	return (
		<button
			type="button"
			tabIndex={-1}
			aria-label={label}
			onPointerDown={start}
			onPointerUp={stop}
			onPointerCancel={stop}
			onPointerLeave={stop}
			onContextMenu={(event) => event.preventDefault()}
			className={`relative flex touch-none select-none flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-muted/60 text-foreground shadow-sm active:brightness-125 ${className}`}
		>
			<Icon aria-hidden className="size-5" />
			{text ? (
				<span className="max-w-full truncate px-0.5 text-[10px] leading-none font-medium">
					{text}
				</span>
			) : null}
			{badge ? (
				<span
					aria-hidden="true"
					className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"
				/>
			) : null}
		</button>
	);
};

// The pad's centre does what G, E or Enter would on this tile, named for it.
export type TouchContextAction = Readonly<{
	label: string;
	// Read to screen readers: what the action applies to, such as an item or a door.
	detail?: string;
	key: "g" | "e" | "Enter";
	available: boolean;
}>;

const CONTEXT_ICONS = { g: PackageOpen, e: Hand, Enter: DoorOpen } as const;

type TouchControlsProps = {
	mapRef: RefObject<HTMLElement | null>;
	// While a spell is aimed the pad picks targets and the centre casts instead of waiting.
	aiming?: boolean;
	context: TouchContextAction;
	perkWaiting?: boolean;
	// The quick slots, laid out beside the pad.
	hotbar: ReactNode;
};

// The phone layout's bottom: a movement pad with the tile's action in the centre and Run,
// Wait, Cancel and Character in its corners, beside the quick slots.
export const TouchControls = ({
	mapRef,
	aiming = false,
	context,
	perkWaiting = false,
	hotbar,
}: TouchControlsProps) => {
	useAndroidBackButton(mapRef, aiming);
	const arrow = "h-[50px] border-amber-700/50 dark:border-amber-500/40";
	const corner = "h-[50px] bg-card text-muted-foreground";
	const amber =
		"h-[50px] border-amber-600/70 bg-gradient-to-b from-amber-200 to-amber-400 text-amber-950 dark:border-amber-500/70 dark:from-[#6b3d12] dark:to-[#3d2410] dark:text-amber-100";
	return (
		<section
			aria-label="Touch controls"
			className="flex shrink-0 items-center gap-3 px-1 pt-1 pb-1.5"
		>
			<div className="grid w-[11.5rem] shrink-0 grid-cols-3 gap-1.5">
				<TouchButton
					label="Run"
					icon={ChevronsRight}
					text="Run"
					gameKey="r"
					mapRef={mapRef}
					className={`${corner} rounded-tl-[1.375rem]`}
				/>
				<TouchButton
					label="Move up"
					icon={ArrowUp}
					gameKey="ArrowUp"
					mapRef={mapRef}
					repeats
					className={arrow}
				/>
				<TouchButton
					label="Wait"
					icon={Hourglass}
					text="Wait"
					gameKey=" "
					mapRef={mapRef}
					className={`${corner} rounded-tr-[1.375rem]`}
				/>
				<TouchButton
					label="Move left"
					icon={ArrowLeft}
					gameKey="ArrowLeft"
					mapRef={mapRef}
					repeats
					className={arrow}
				/>
				{aiming ? (
					<TouchButton
						label="Cast at target"
						icon={Sparkles}
						text="Cast"
						gameKey="Enter"
						mapRef={mapRef}
						className="h-[50px] rounded-full border-violet-500/70 text-violet-700 dark:text-violet-300"
					/>
				) : (
					<TouchButton
						label={
							context.detail
								? `${context.label}: ${context.detail}`
								: context.label
						}
						icon={CONTEXT_ICONS[context.key]}
						text={context.label}
						gameKey={context.key}
						mapRef={mapRef}
						className={`${amber} rounded-full ${context.available ? "" : "opacity-60"}`}
					/>
				)}
				<TouchButton
					label="Move right"
					icon={ArrowRight}
					gameKey="ArrowRight"
					mapRef={mapRef}
					repeats
					className={arrow}
				/>
				<TouchButton
					label="Cancel"
					icon={X}
					text="Cancel"
					gameKey="Escape"
					mapRef={mapRef}
					className={`${corner} rounded-bl-[1.375rem]`}
				/>
				<TouchButton
					label="Move down"
					icon={ArrowDown}
					gameKey="ArrowDown"
					mapRef={mapRef}
					repeats
					className={arrow}
				/>
				<TouchButton
					label={
						perkWaiting ? "Open character, perk waiting" : "Open character"
					}
					icon={UserRound}
					gameKey="c"
					mapRef={mapRef}
					badge={perkWaiting}
					className={`${amber} rounded-br-[1.375rem]`}
				/>
			</div>
			<div className="min-w-0 flex-1">{hotbar}</div>
		</section>
	);
};

const OPEN_DIALOG = '[role="dialog"], [role="alertdialog"]';

// Android's back gesture closes the top dialog or stops aiming, as Escape does; with nothing
// to close it sends the app to the background, keeping the adventure where it was.
const useAndroidBackButton = (
	mapRef: RefObject<HTMLElement | null>,
	aiming: boolean,
) => {
	const state = useRef({ aiming });
	state.current.aiming = aiming;
	useEffect(() => {
		if (!IS_ANDROID_APP) return;
		let removed = false;
		let remove: (() => void) | undefined;
		void import("@capacitor/app").then(({ App }) =>
			App.addListener("backButton", () => {
				if (document.querySelector(OPEN_DIALOG)) {
					const focused =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: document.body;
					dispatchGameKey(focused, "Escape");
				} else if (state.current.aiming) {
					dispatchGameKey(mapRef.current, "Escape");
				} else {
					void App.minimizeApp();
				}
			}).then((handle) => {
				if (removed) void handle.remove();
				else remove = () => void handle.remove();
			}),
		);
		return () => {
			removed = true;
			remove?.();
		};
	}, [mapRef]);
};
