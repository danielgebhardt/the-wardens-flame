import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";
import { webApp } from "./scripts/webapp";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	// The web app is served from https://<owner>.github.io/<repo>/, so its paths are relative.
	base: mode === "webapp" ? "./" : "/",
	plugins: [react(), tailwindcss(), webApp(mode)],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		exclude: [...configDefaults.exclude, "e2e/**"],
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/setupTests.ts",
		// The slowest tests take about 3.5s alone; leave room for a busy machine.
		testTimeout: 15000,
	},
}));
