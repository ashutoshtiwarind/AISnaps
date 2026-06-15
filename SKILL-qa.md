---
name: qa-help
description: "Support quality assurance for AISnaps, including test validation, bug reproduction, and release readiness checks."
argument-hint: "What QA support do you need for AISnaps?"
disable-model-invocation: true
---

This skill is for quality assurance and validation work in AISnaps.

When invoked:
1. Clarify the verification need
   - Ask whether the request requires bug reproduction, regression testing, or release validation.
   - Confirm the target platform and user flow.
2. Inspect the relevant behavior
   - Review the code areas involved and identify likely failure points.
   - Confirm whether the web demo or native device should be used for validation.
3. Create a validation checklist
   - Define clear expected results and any test steps.
   - Include both UI behavior and functional outcomes.
4. Record QA status
   - Log reproduction notes and test results in `PROJECT_TRACKING.md`.
   - Note any blocking issues or follow-up fixes required.

Quality criteria
- Keep bug reports precise and reproducible.
- Use concrete validation steps.
- Track open issues and test coverage consistently.
