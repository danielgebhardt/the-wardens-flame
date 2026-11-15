import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Sizes the map from the saved preference before the first render.
import "./settings/TileSizes";
import { touchControlsEnabled } from "./settings/Platform";

// Phone-only layout classes (`phone:`) apply under this attribute.
if (touchControlsEnabled()) document.documentElement.dataset.phone = "";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
