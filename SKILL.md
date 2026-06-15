---
name: help-with-project
description: "Help guide development, debugging, and feature work for the AISnaps Expo app."
argument-hint: "What do you need help with in AISnaps?"
disable-model-invocation: true
---

This skill helps turn a project request into a safe, actionable workflow for the AISnaps codebase.

When invoked, follow this process:

1. Clarify the request
   - Ask what outcome the user wants: bug fix, feature, refactor, documentation, or testing support.
   - Ask which platform matters most: native Android/iOS, web demo, or both.
   - Ask for any existing errors, logs, or user flows if the request is troubleshooting-related.

2. Identify the scope
   - Map the request to the relevant code areas: `app/`, `components/`, `hooks/`, `constants/`, or project config.
   - Preserve the existing mobile-first Expo architecture and avoid introducing native-only logic on web.
   - Prefer changes that keep web demo and native behavior separate but consistent.

3. Execute the work
   - If it is a bug or runtime issue, inspect the relevant file(s) and reproduce from the reported steps.
   - If it is a feature or UX improvement, propose a minimal implementation and confirm the expected behavior.
   - If it is a refactor, keep the scope narrow and maintain the app's current overlay, camera, and AI coaching design.
   - If it is documentation or setup support, keep the response concrete and aligned with the repository README.

4. Validate and summarize
   - Confirm the change with a short summary of what was updated.
   - Note any platform-specific limitations or follow-up tasks (e.g. real camera capture, permission handling, Expo compatibility).
   - Suggest the next step: run the app, test on the web demo, or iterate on the feature.

Decision logic
- If the issue is a crash or missing behavior, prioritize reproduction and a minimal fix.
- If the request is a new feature, propose the smallest viable improvement first.
- If the request is exploratory or ambiguous, ask a clarifying question before editing code.

Quality criteria
- Keep changes idiomatic to Expo and React Native.
- Avoid adding native camera imports or platform-specific modules into shared web code.
- Maintain the existing folder structure and keep component logic modular.
- Prefer descriptive, actionable answers over broad design-only discussion.

Example prompts
- "Fix the camera permission flow on Android and iOS."
- "Add a new overlay option for gridlines in the composition guide."
- "Help me separate web demo mode from native camera logic."
- "Update the README with instructions for running the web demo."
