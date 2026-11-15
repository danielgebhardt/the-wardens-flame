// The sideloadable Android app is the same web build made with `vite build --mode android`
// and wrapped by Capacitor. It plays offline on one device: no accounts, cloud saves,
// online rankings or analytics. Phone-sized layout and touch controls apply only here.
export const IS_ANDROID_APP = import.meta.env.MODE === "android";

// Browser checks of the touch controls without building the app: add `?touch` to the URL.
export const touchControlsEnabled = (
	android: boolean = IS_ANDROID_APP,
	search: string = typeof window === "undefined" ? "" : window.location.search,
): boolean => android || new URLSearchParams(search).has("touch");
