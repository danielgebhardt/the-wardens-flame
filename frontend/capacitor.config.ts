import type { CapacitorConfig } from "@capacitor/cli";

// The sideloadable Android app: the offline `vite build --mode android` bundle in a WebView.
const config: CapacitorConfig = {
	appId: "com.wardensflame.game",
	appName: "The Warden's Flame",
	webDir: "dist",
	android: {
		allowMixedContent: false,
	},
	plugins: {
		// Keep the game clear of the status and navigation bars, with light bar icons
		// over the game's dark frame.
		SystemBars: { insetsHandling: "native", style: "DARK" },
	},
};

export default config;
