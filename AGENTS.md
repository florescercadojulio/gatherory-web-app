<!-- intent-skills:start -->

## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `pnpm intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

Use the `intent` package script above instead of `pnpm exec intent` or
`npm exec --no -- intent`: `@tanstack/devtools-event-client` also exports an
`intent` binary. The script explicitly invokes the installed `@tanstack/intent`
CLI so dependency bin-link ordering cannot select the incompatible launcher.

## Gatherory project context

Read `docs/development/ai-onboarding.md` when starting a fresh context. It maps
the web/server, iOS, and landing repositories and records shared product
decisions. Check current code and Git state before relying on dated status notes.

## Feature regression coverage

Add or update focused regression tests alongside feature and behavior changes.
Cover user-visible outcomes and affected permission, state and recovery
boundaries. Use native UI tests for gestures or navigation that unit tests
cannot prove. Run relevant checks and document actual results and remaining
acceptance limits.
