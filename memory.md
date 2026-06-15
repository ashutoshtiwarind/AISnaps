# Memory / Context Tracker

This file records the current implementation status, key decisions, and pending priorities for the AISnaps project.

## Current context

- App is mobile-first with Expo and `react-native-vision-camera` for Android/iOS.
- Web support is a demo fallback with a mock camera preview.
- `app/index.tsx` remains the main screen and currently contains mixed native/web logic.
- The web build should not import native camera modules.

## Recent changes

- Updated `README.md` to reflect mobile-first focus, web demo mode, and current run instructions.
- Updated `CODE_QUALITY_CHECKLIST.md` to include explicit platform-specific guidance.
- Added web fallback context and notes for contributors.

## Pending work

- Cleanly separate web/demo mode from native camera logic.
- Refactor `app/index.tsx` into smaller components and hooks.
- Validate real camera capture and recording on Android/iOS.
- Align Expo dependency versions and confirm compatibility.
- Add runtime permission/error handling for camera and media library.

## Notes

- Use this file when updating docs or tracking implementation decisions.
- Keep platform-specific constraints visible for future contributors.
