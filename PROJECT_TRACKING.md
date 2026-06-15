# AISnaps Project Tracking

This document centralizes project status, role responsibilities, decisions, and next steps for the AISnaps app.

## Overview

AISnaps is a mobile-first Expo app with a web demo mode. The key goals are:
- Validate native camera capture and recording on device.
- Keep the web demo separate from native camera logic.
- Improve AI coaching, onboarding, and gallery UX.

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

1. Review native camera capture and permission flow.
2. Improve web demo messaging and mock interactions.
3. Add gallery mock data for web and native preview.
4. Document any technical or design blockers in this file.
