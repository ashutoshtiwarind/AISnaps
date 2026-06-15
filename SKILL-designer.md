---
name: designer-help
description: "Support UI/UX and design direction for the AISnaps Expo app, including overlays, interactions, and onboarding flow."
argument-hint: "What design guidance do you need for AISnaps?"
disable-model-invocation: true
---

This skill is for design decisions and visual UX work in AISnaps.

When invoked:
1. Clarify the user need
   - Ask whether the request is about the camera experience, overlay guidance, onboarding, or web demo messaging.
   - Confirm what platform and user flow are most important.
2. Identify the design scope
   - Map the request to `app/index.tsx`, `components/`, or the web demo flow.
   - Focus on clarity, accessibility, and platform-specific behavior.
3. Recommend UX improvements
   - Suggest minimal, usable designs first.
   - Keep the overlay system consistent across web and native when possible.
4. Validate visually
   - Ensure the proposed UI is practical for Expo and React Native rendering.
   - Document any visuals or layout decisions in `PROJECT_TRACKING.md`.

Quality criteria
- Keep UI changes lightweight and platform-safe.
- Preserve the current information hierarchy.
- Make design suggestions easy to implement with existing components.
