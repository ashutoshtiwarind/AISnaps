---
name: tl-help
description: "Support technical leadership for AISnaps, including architecture decisions, code review guidance, and implementation strategy."
argument-hint: "What technical leadership support do you need for AISnaps?"
disable-model-invocation: true
---

This skill is for technical leadership and implementation planning in AISnaps.

When invoked:
1. Clarify the engineering objective
   - Ask whether the request is about architecture, code quality, refactoring, or implementation sequencing.
   - Confirm the platform scope: web demo, native app, or shared code.
2. Assess the current codebase
   - Reference `app/`, `components/`, `hooks/`, and existing Expo patterns.
   - Avoid introducing native-only modules into shared web files.
3. Recommend a technical approach
   - Prefer modular, incremental changes.
   - Keep web demo logic separated from native camera logic.
4. Track technical decisions
   - Document architecture notes and tech debt in `PROJECT_TRACKING.md`.
   - Call out follow-up work like permissions, camera capture, or dependency updates.

Quality criteria
- Preserve the Expo-first architecture.
- Keep implementation plans clear and actionable.
- Use existing project conventions and avoid broad rewrites.
