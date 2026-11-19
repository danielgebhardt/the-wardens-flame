# The Warden's Flame — notes for Claude

A deterministic fantasy dungeon crawler (React + TypeScript), inspired by Larn. The project rules are in `AGENTS.md`, which this file doesn't replace. `README.md` covers the game, saves, accounts and verification.

- Repo: https://github.com/danielgebhardt/the-wardens-flame
- Work branch: `claude/happy-albattani-oa4nv5` (kept equal to `main` when shipped).
- Website (Vercel, with optional accounts): the ordinary production build.
- Web app (GitHub Pages, deployed by CI from main; the recommended way onto iPhone/iPad via Add to Home Screen): https://danielgebhardt.github.io/the-wardens-flame/
- Latest APK (rebuilt by CI on every push to main): https://github.com/danielgebhardt/the-wardens-flame/releases/download/latest/wardens-flame.apk
- Latest unsigned iOS build (same release; sideloaded with a free Apple ID, see README): https://github.com/danielgebhardt/the-wardens-flame/releases/download/latest/wardens-flame.ipa

## Builds (`frontend/src/settings/Platform.ts`)
- **Production (`pnpm frontend:build`):** the Vercel website. Accounts, cloud saves, rankings and Vercel analytics. No service worker. The desktop/iPad keyboard layout.
- **Offline modes:** `vite build --mode android | ios | webapp`. `IS_OFFLINE_BUILD` turns off accounts, Firebase, online rankings and analytics. Saves stay in `localStorage`.
  - **android / ios** (`IS_NATIVE_APP`): Capacitor 8 apps with the phone layout and touch controls always on. Only Android has the back-button handler.
  - **webapp** (`IS_WEB_APP`): GitHub Pages, `base: "./"`. It's installable and works offline. The phone layout turns on for touch screens (`pointer: coarse`); desktop browsers keep the keyboard layout.
- The phone layout and touch controls (`phone:` Tailwind variant, `components/touch/`) only apply under `touchControlsEnabled()`. `?touch` forces them in any browser. Touch buttons send the keyboard's keys, so they add no rules.
- The game has no haptics, audio or Capacitor storage: nothing to fall back from in a browser.

## Files
- `frontend/scripts/webapp.ts`: Vite plugin.
  - In webapp builds it emits `manifest.webmanifest`, the icons and `sw.js`, and injects the home-screen tags and `viewport-fit=cover` into `index.html`. iOS builds only get `viewport-fit=cover`. Other builds are untouched.
  - The service worker precaches everything. Page loads are network-first (4 s timeout, then the cached index); hashed assets are cache-first; old caches are deleted on activate.
  - `src/settings/WebApp.ts` registers it only in the production webapp build, never native, and asks for persistent storage.
- `frontend/scripts/webapp-check.mjs`: Playwright check of a webapp build served under `/the-wardens-flame/`. It covers CDP installability, service-worker control after a reload, and booting and starting an adventure offline. Locally, set `CHROMIUM_PATH=/opt/pw-browsers/chromium`.
- `frontend/app-icons/` (web) and the iOS `AppIcon.appiconset` / `Splash.imageset`: committed PNGs made by `frontend/scripts/app-icons.py` (Pillow), drawn like the Android launcher icon (the 192 px ember emblem on `#140F0D`). The Android `res/` icons are separate and unchanged.
- `frontend/ios/`: Capacitor iOS project (Swift Package Manager) for sideloading only.
  - Portrait, `UIRequiresFullScreen`, light status bar, `arm64`, `ITSAppUsesNonExemptEncryption=false`.
  - Its `public/` and `capacitor.config.json` are generated and gitignored.
  - `pnpm frontend:ios` = `vite build --mode ios` + `cap sync ios`; `pnpm --filter frontend ios:open` opens Xcode.
- `frontend/android/`: Capacitor Android project. `pnpm frontend:android:apk` builds the APK, signed with the committed sideload key.

## CI (`.github/workflows/`)
- `checks.yml` (**Quality checks**; PRs, pushes to main): Biome, unit tests, typecheck, serverless smoke, build, and the Chromium e2e suite. The e2e build uses placeholder `demo-wardens-flame` Firebase settings.
- `android.yml` (**Android app**; pushes to main, manual): builds the APK, then on main moves the `latest` tag and replaces `wardens-flame.apk` on the persistent `latest` pre-release. Leave it as it is.
- `webapp-ios.yml` (**Web app and iOS**; every push, manual):
  - `build`: webapp build plus `webapp-check.mjs`; on main, uploads the Pages artifact.
  - `pages` (main only): `configure-pages` + `deploy-pages`. Pages' source must be "GitHub Actions" in the repo settings.
  - `ios` (`macos-26`, needs build): unsigned Release `xcodebuild`, zips `Payload/App.app` into `wardens-flame.ipa`, and checks with `unzip -l` that it holds `Frameworks/Capacitor.framework`, `public/index.html` and the JS bundle. It keeps the `.ipa` as an artifact, and on main runs `gh release upload latest … --clobber`.

## Workflow
- Commit work to the branch and push the branch first. For iOS changes, watch its `ios` job pass.
- Fast-forward main (`git push origin claude/happy-albattani-oa4nv5:main`) only when the tests pass. The developer has authorised pushing main this way.
- Don't open PRs unless asked.
- This container can't reach `*.github.io`, so ask the developer to check the live web app.
- Local Playwright: the project's pinned version expects a different Chromium. Launch with `executablePath: /opt/pw-browsers/chromium`.
- Maven Central rate-limits this container. For local Gradle builds, use `--max-workers=1 -Dorg.gradle.internal.repository.max.retries=8`.
