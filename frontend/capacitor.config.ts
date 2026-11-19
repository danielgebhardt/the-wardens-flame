import type { CapacitorConfig } from "@capacitor/cli";

// The sideloadable Android and iOS apps: the offline `vite build --mode android|ios` bundle
// in a web view.
const config: CapacitorConfig = {
	appId: "com.wardensflame.game",
	appName: "The Warden's Flame",
	webDir: "dist",
	android: {
		allowMixedContent: false,
	},
	// The sideloadable iOS app, from the same bundle built with `--mode ios`.
	ios: {
		backgroundColor: "#140F0D",
		// The game never scrolls as a page: no rubber-band bounce under the pad.
		scrollEnabled: false,
		// The web view runs under the status bar; the game pads itself with the safe areas.
		contentInset: "never",
	},
	plugins: {
		// Keep the game clear of the status and navigation bars, with light bar icons
		// over the game's dark frame.
		SystemBars: { insetsHandling: "native", style: "DARK" },
	},
};

export default config;
