import { Popover } from "@base-ui/react/popover";
import { LibraryBig, Menu, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { HEADER_BUTTON_SECONDARY } from "../../HeaderButtonStyles";

type Props = {
	onNewAdventure: () => void;
	onSettings: () => void;
	// Only when the Bestiary is offered.
	onBestiary?: () => void;
};

// The phone header's overflow menu: the header actions that don't fit beside Save and Help.
const PhoneMenu = ({ onNewAdventure, onSettings, onBestiary }: Props) => {
	const [open, setOpen] = useState(false);
	const item =
		"flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring";
	const choose = (action: () => void) => () => {
		setOpen(false);
		action();
	};
	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger
				aria-label="Menu"
				title="Menu"
				className={`${HEADER_BUTTON_SECONDARY} inline-flex items-center justify-center`}
			>
				<Menu aria-hidden="true" className="size-4" />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner
					side="bottom"
					align="end"
					sideOffset={6}
					className="z-50"
				>
					<Popover.Popup className="w-56 rounded-lg border border-amber-700/50 bg-popover p-1 text-popover-foreground shadow-lg">
						<Popover.Title className="sr-only">Menu</Popover.Title>
						<button
							type="button"
							className={item}
							onClick={choose(onNewAdventure)}
						>
							<RefreshCw aria-hidden="true" className="size-4" />
							New adventure
						</button>
						<button type="button" className={item} onClick={choose(onSettings)}>
							<Settings aria-hidden="true" className="size-4" />
							Settings
						</button>
						{onBestiary && (
							<button
								type="button"
								className={item}
								onClick={choose(onBestiary)}
							>
								<LibraryBig aria-hidden="true" className="size-4" />
								Bestiary
							</button>
						)}
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
};
export default PhoneMenu;
