# AISnaps Project Tracking

This document centralizes project status, role responsibilities, decisions, and next steps for the AISnaps app.

## Overview

AISnaps is a mobile-first Expo app, repositioning to **"Your AI photographer"** — coach the user live to take a great real photo, then give a shareable photo score. Strategy detail in [STRATEGY.md](STRATEGY.md); work items in [BACKLOG.md](BACKLOG.md).

Core goals:

- **Native app:** Live pose/framing coaching → auto-capture → photo score → before/after. Validate real device camera and permission flows.
- **Web demo:** Preserve a safe demo mode with mock camera preview. Web logic stays separated from native camera logic.
- **Product focus:** Score the photo (improvable), not the face. Shareable glow-up artifact drives virality.

## Current status

- `main` is the default remote branch.
- `web-aisnaps` is the current working branch for web and project updates.
- Basic camera screen UI, web demo preview, and AI coach UI are implemented.
- Remaining work includes native capture, microphone permissions, and release polish.

## Roles and responsibilities

### SPM
- Own product priorities and release planning.
- Balance mobile-first requirements with web demo readiness.
- Keep roadmap aligned with user outcomes.

### Designer
- Own interface clarity, overlay UX, and onboarding interactions.
- Keep visual design consistent across web and native.
- Recommend small, implementable improvements.

### TL
- Own architecture and implementation strategy.
- Keep shared code modular and platform-safe.
- Validate that web and native behavior remain separated when needed.

### QA
- Own verification and bug reproduction.
- Track test results and release readiness.
- Document validation steps and blocking issues.

## Project tracking and workflow

- Use the role-specific skill files for guiding requests: `SKILL-spm.md`, `SKILL-designer.md`, `SKILL-tl.md`, `SKILL-qa.md`.
- Use `PROJECT_TRACKING.md` to capture decisions, branch context, and next steps.
- Keep `README.md` updated with current status and contributor guidance.

## Next steps

1. Cross-functional sign-off on the pivot (coaching → AI photographer + photo score) — see [BACKLOG.md](BACKLOG.md) V-3.
2. Phase 0 validation: cut glow-up loop mockups, measure hook retention before building.
3. ML: validate NIMA on selfies/portraits; confirm on-device pose loop latency.
4. TL: confirm on-device vs cloud per-frame split; `react-native-vision-camera` frame processors.
5. Designer: before/after score card (the viral artifact).
6. Document technical or design blockers in this file.
