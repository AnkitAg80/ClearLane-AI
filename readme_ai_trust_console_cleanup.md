# AI Trust Console Cleanup

## What Changed

The `Advanced model diagnostics (Engineering)` section was removed from the AI Trust Console.

This also removes the raw metric cards for top-25 recall, NDCG@25, ranker status, total feature count, and the raw artifact registry from that screen.

## Where It Changed

The UI change was made in `frontend/src/components/EvidenceView.jsx`.

This note lives in `readme_ai_trust_console_cleanup.md` at the project root.

## Why It Helps

The AI Trust Console now stays focused on judge/user-friendly explanations: how recommendations are generated, what evidence categories the system uses, what signals matter most, the core AI architecture, and trust guidance.

The removed block was engineering-facing and added visual noise that was not needed for the product demo.

## What Should Happen Next

If raw diagnostics are needed later, expose them behind a separate developer/debug page instead of showing them inside the main AI Trust Console.
