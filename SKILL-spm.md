---
name: spm-help
description: "Support product and project planning for the AISnaps app, including roadmap, priorities, and stakeholder alignment."
argument-hint: "What product or planning guidance do you need for AISnaps?"
disable-model-invocation: true
---

This skill is for product/project management work in AISnaps.

When invoked:
1. Clarify the goal
   - Ask whether the request is a roadmap update, priority decision, release plan, or stakeholder communication.
   - Confirm the target outcome: web demo readiness, native camera support, AI guidance improvements, or release validation.
2. Review the current status
   - Use the README and `PROJECT_TRACKING.md` to align with existing roadmap items.
   - Keep the project mobile-first while staging web demo and native behavior separately.
3. Propose a plan
   - Recommend the next most valuable work item and any dependency order.
   - Call out risks, platform gaps, and any unresolved technical blockers.
4. Document decisions
   - Update `PROJECT_TRACKING.md` with actionable next steps and owner expectations.
   - Record any branch or release naming guidance.

Quality criteria
- Keep proposals concrete and incremental.
- Preserve the current Expo architecture.
- Prefer fixes that can be validated quickly on the web demo or device.
