# AISnaps

**Your AI photographer.** AISnaps coaches you live to take a great *real* photo of yourself — directing pose, angle, and framing in the moment — then gives you a shareable photo score with a before/after glow-up. Built mobile-first on Expo for Android and iOS.

Not AI-generated photos. Real ones, coached live. See [STRATEGY.md](STRATEGY.md) for positioning and [BACKLOG.md](BACKLOG.md) for planned work.

A web demo mode runs with a mock camera preview so the concept can be demonstrated without native hardware. Web logic stays strictly separate from native camera logic.

## Current status

- **Repositioning:** Pivoting from generic photography coaching to "AI photographer + photo score" (see [STRATEGY.md](STRATEGY.md)).
- **Spikes code-ready:** SP-1 (frame-processor latency), SP-2 (score credibility), SP-3 (narration cost) are scaffolded in [spikes/](spikes/); execution with real devices / data / keys is pending. See [BACKLOG.md](BACKLOG.md).
- **Mobile focus:** Built for Android/iOS with Expo and `react-native-vision-camera` (config plugin added; frame processors enabled).
- **Web demo:** Browser version runs as a functional demo with mock camera preview and UI controls.
- **Main screen:** `app/index.tsx` contains the core experience — overlays, AI coaching, capture, and gallery.

## Priority roadmap

Tracked in phases — full detail in [BACKLOG.md](BACKLOG.md).

1. **Phase 0 — Validate:** prove the glow-up loop as shareable content before building.
2. **Phase 1 — Core loop:** live pose/framing direction → auto-capture → photo score → before/after card.
3. **Phase 2 — Shareable artifact:** branded score card + TikTok/IG export.
4. **Phase 3 — Retention:** streaks, "beat your best score," angle library.
5. **Phase 4 — Monetize:** Superwall paywall.
6. **Platform:** keep web demo separated from native, align Expo deps, permission + error handling.

## Run locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Run the web demo:

```bash
npm run web
```

Then open `http://localhost:8081` in Chrome.

## What works today

- Main camera screen UI and layout
- Composition overlay rendering
- AI coach interface and mode toggle
- Web demo mode with mock camera preview
- Basic gallery modal and thumbnail support

## What is still pending

- Real camera capture on Android/iOS
- Video recording flow on device
- Microphone permission handling
- Web gallery mock data and interactions
- Expo dependency updates
- Clear web messaging for unsupported camera features

## Project structure

- `app/` — main app screen and logic
- `components/` — reusable UI components
- `constants/` — shared config values
- `hooks/` — custom hooks and feature logic
- `assets/` — static media
- `package.json` — dependencies and scripts

## Notes for contributors

- Keep web and native logic separated.
- Avoid loading native camera modules on web.
- Maintain overlay rendering as platform-agnostic.
- Track current implementation context in `PROJECT_TRACKING.md`.
- Update this README when the workflow changes.
- Use role-specific skill files as guidance:
  - `SKILL-spm.md` for product and roadmap planning.
  - `SKILL-designer.md` for UI/UX and design decisions.
  - `SKILL-tl.md` for technical leadership and implementation strategy.
  - `SKILL-qa.md` for quality assurance and validation.

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
