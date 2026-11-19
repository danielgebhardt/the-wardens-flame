// Three builds play offline on one device, with no accounts, cloud saves, online rankings
// or analytics: the sideloadable Android and iOS apps (`vite build --mode android|ios`,
// wrapped by Capacitor) and the installable web app on GitHub Pages
// (`vite build --mode webapp`). The website on Vercel is the ordinary production build.
const MODE: string = import.meta.env.MODE;
export const IS_ANDROID_APP = MODE === "android";
export const IS_NATIVE_APP = IS_ANDROID_APP || MODE === "ios";
export const IS_WEB_APP = MODE === "webapp";
export const IS_OFFLINE_BUILD = IS_NATIVE_APP || IS_WEB_APP;
export const OFFLINE_MODES: readonly string[] = ["android", "ios", "webapp"];

const coarsePointer = () =>
	typeof window !== "undefined" &&
	typeof window.matchMedia === "function" &&
	window.matchMedia("(pointer: coarse)").matches;

// The phone layout and touch controls: always in the native apps, in the web app on touch
// screens (iPhone, iPad, Android Chrome), and in any browser with `?touch` in the URL.
export const touchControlsEnabled = (
	native: boolean = IS_NATIVE_APP,
	search: string = typeof window === "undefined" ? "" : window.location.search,
	touchWebApp: boolean = IS_WEB_APP && coarsePointer(),
): boolean => native || touchWebApp || new URLSearchParams(search).has("touch");
