import { Coins, Droplets, Heart } from "lucide-react";
import type { ActiveAffliction } from "../../domain/game/AfflictionDefinitions";
import { maximumMana } from "../../domain/game/Mana";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import {
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";
import type { TimedEffect } from "../../domain/game/TimedEffects";
import type { Equipment } from "../../domain/items/Equipment";
import { isLowHealth } from "../game/HealthDisplay";

type Props = {
	player: PlayerStats;
	mana: number;
	gold: number;
	progression: Progression;
	equipment: Equipment;
	effects: readonly TimedEffect[];
	afflictions: readonly ActiveAffliction[];
	onOpen: () => void;
};

const percent = (value: number, maximum: number) =>
	maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0;

const Bar = ({ value, className }: { value: number; className: string }) => (
	<span
		aria-hidden="true"
		className="block h-1.5 overflow-hidden rounded-full bg-muted"
	>
		<span
			className={`block h-full rounded-full ${className}`}
			style={{ width: `${value}%` }}
		/>
	</span>
);

// The phone layout's one-row status: health, mana, gold and level with thin bars, about a
// quarter of the full panel's height. Tapping it opens Character.
const PhoneStatusStrip = ({
	player,
	mana,
	gold,
	progression,
	equipment,
	effects,
	afflictions,
	onOpen,
}: Props) => {
	const maxMana = maximumMana(progression, equipment, effects, afflictions);
	const { level, earned, needed } = progressionProgress(progression);
	const xp = level === MAX_PLAYER_LEVEL ? 100 : percent(earned, needed);
	const low = isLowHealth(player);
	return (
		<section aria-label="Player status" className="shrink-0">
			<button
				type="button"
				onClick={onOpen}
				aria-label="Character status"
				className="grid h-11 w-full grid-cols-4 items-center gap-2.5 rounded-md border-b border-border/70 bg-muted/20 px-2.5 text-left tabular-nums"
			>
				<span className="grid gap-1">
					<output
						aria-label="Player health"
						className={`flex items-center gap-1 text-xs font-semibold ${low ? "text-destructive" : ""}`}
					>
						<Heart
							aria-hidden="true"
							className="size-3 shrink-0 fill-current text-rose-600 dark:text-rose-400"
						/>
						<span className="sr-only">Health </span>
						{player.health}/{player.maxHealth}
					</output>
					<Bar
						value={percent(player.health, player.maxHealth)}
						className={low ? "bg-rose-500" : "bg-emerald-500"}
					/>
				</span>
				<span className="grid gap-1">
					<output
						aria-label="Player mana"
						className="flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300"
					>
						<Droplets aria-hidden="true" className="size-3 shrink-0" />
						<span className="sr-only">Mana </span>
						{mana} / {maxMana}
					</output>
					<Bar value={percent(mana, maxMana)} className="bg-violet-500" />
				</span>
				<output
					aria-label="Player gold"
					className="flex items-center gap-1 text-[13px] font-semibold text-amber-700 dark:text-amber-300"
				>
					<Coins aria-hidden="true" className="size-3.5 shrink-0" />
					<span className="sr-only">Gold </span>
					{gold}
				</output>
				<span className="grid gap-1">
					<output aria-label="Player level" className="text-xs font-semibold">
						<span aria-hidden="true">Lv </span>
						<span className="sr-only">Level </span>
						{level}
						<span className="font-normal text-muted-foreground">
							{" "}
							· {Math.floor(xp)}%
						</span>
					</output>
					<Bar value={xp} className="bg-amber-500" />
				</span>
			</button>
		</section>
	);
};
export default PhoneStatusStrip;
