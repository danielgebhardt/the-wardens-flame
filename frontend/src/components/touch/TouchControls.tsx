import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	DoorOpen,
	Footprints,
	Hand,
	Hourglass,
	PackageOpen,
	UserRound,
	X,
} from "lucide-react";
import {
	type ComponentType,
	type PointerEvent,
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
	className?: string;
};

const TouchButton = ({
	label,
	icon: Icon,
	gameKey,
	mapRef,
	repeats = false,
	text,
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
			className={`flex touch-none select-none flex-col items-center justify-center gap-0.5 rounded-md border border-amber-800/40 bg-muted/60 text-foreground shadow-sm active:bg-amber-500/30 dark:border-amber-500/30 ${className}`}
		>
			<Icon aria-hidden className="size-5" />
			{text ? (
				<span className="text-[10px] leading-none font-medium">{text}</span>
			) : null}
		</button>
	);
};

type TouchControlsProps = {
	mapRef: RefObject<HTMLElement | null>;
	// While a spell is aimed the pad picks targets and the centre casts instead of waiting.
	aiming?: boolean;
};

export const TouchControls = ({
	mapRef,
	aiming = false,
}: TouchControlsProps) => {
	useAndroidBackButton(mapRef, aiming);
	const pad = "size-12";
	return (
		<section
			aria-label="Touch controls"
			className="flex shrink-0 items-center justify-between gap-2 px-1"
		>
			<div className="grid grid-cols-3 grid-rows-3 gap-1">
				<span />
				<TouchButton
					label="Move up"
					icon={ArrowUp}
					gameKey="ArrowUp"
					mapRef={mapRef}
					repeats
					className={pad}
				/>
				<span />
				<TouchButton
					label="Move left"
					icon={ArrowLeft}
					gameKey="ArrowLeft"
					mapRef={mapRef}
					repeats
					className={pad}
				/>
				<TouchButton
					label={aiming ? "Cast at target" : "Wait"}
					icon={aiming ? Hand : Hourglass}
					text={aiming ? "Cast" : "Wait"}
					gameKey={aiming ? "Enter" : " "}
					mapRef={mapRef}
					className={pad}
				/>
				<TouchButton
					label="Move right"
					icon={ArrowRight}
					gameKey="ArrowRight"
					mapRef={mapRef}
					repeats
					className={pad}
				/>
				<span />
				<TouchButton
					label="Move down"
					icon={ArrowDown}
					gameKey="ArrowDown"
					mapRef={mapRef}
					repeats
					className={pad}
				/>
				<span />
			</div>
			<div className="grid grid-cols-3 gap-1.5">
				<TouchButton
					label="Pick up"
					icon={PackageOpen}
					text="Pick up"
					gameKey="g"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
				<TouchButton
					label="Interact"
					icon={Hand}
					text="Interact"
					gameKey="e"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
				<TouchButton
					label="Enter or leave"
					icon={DoorOpen}
					text="Enter"
					gameKey="Enter"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
				<TouchButton
					label="Run"
					icon={Footprints}
					text="Run"
					gameKey="r"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
				<TouchButton
					label="Open character"
					icon={UserRound}
					text="Character"
					gameKey="c"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
				<TouchButton
					label="Cancel"
					icon={X}
					text="Cancel"
					gameKey="Escape"
					mapRef={mapRef}
					className="h-14 w-16"
				/>
			</div>
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
