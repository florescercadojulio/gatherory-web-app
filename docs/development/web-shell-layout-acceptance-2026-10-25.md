# Web shell layout acceptance — October 25, 2026

This record tracks the desktop and responsive shell correction for the protected
workspace routes. The sidebar and content inset share the provider's flex row:
the sidebar gap reserves the selected sidebar width, and the content inset must
be allowed to shrink below the intrinsic width of wide route content. The inset
is the shell's single main landmark; route content belongs inside it.

## Findings and correction

The first shell-level `min-w-0` constraint did not resolve the real overview
overflow. Browser measurements showed the overview card's implicit grid column
grew to about 732 px while only 604 px was available; the long upcoming-event
titles contributed to the min-content width. The workspace insight card now
starts with a single grid column, and its article, header, content, and page
shell can shrink. The two-column hero split starts at `lg` so it waits for the
usable width available beside the expanded sidebar.

The route inspection also found nested `<main>` landmarks: the shell inset
already provides the main landmark while route content in the overview,
account, MCP, and three legacy Blueprint routes added another. Those page-level
elements are now ordinary content containers, leaving one main landmark per
shell.

## Automated regression coverage

`tests/unit/web-shell-layout.test.ts` server-renders the real sidebar provider,
sidebar, inset, and workspace overview route. A TechXchange conference fixture
with a long upcoming-event title checks that the title, schedule, and read-only
instruction remain in the rendered output, the overview card uses a shrinkable
single-column base grid, and the page has one main landmark. A primitive-level
case checks that the sidebar gap precedes the flex inset and that the inset has
`min-w-0`. These SSR checks cover rendered content and structure; they do not
emulate browser CSS layout or responsive breakpoints.

`tests/unit/use-mobile.test.ts` calls the hook with mocked React effect/state
hooks and a mocked `matchMedia`. It verifies the `(width < 48rem)` query,
initializes from `MediaQueryList.matches` even when `innerWidth` is 768 px,
tracks a subsequent change event, and removes the listener on cleanup. This
keeps the hook boundary aligned with the CSS mobile breakpoint without a DOM
test dependency.

Command run:

```sh
pnpm vitest run tests/unit/web-shell-layout.test.ts
pnpm vitest run tests/unit/use-mobile.test.ts
pnpm typecheck
```

Results: both focused test files passed (3 tests total), and `pnpm typecheck`
passed. The full repository suite passed **932 tests**, with 66 skipped, across
146 passing files and 45 skipped files. Contract freshness, the final typecheck,
and the local production build passed. Building did not publish anything.
Browser acceptance remains separate because the Vitest suite uses the Node
environment and does not calculate layout.

Final logs: `/tmp/gatherory-web-shell-full.log`,
`/tmp/gatherory-web-shell-types-final.log`, and
`/tmp/gatherory-web-shell-build.log`.

## Browser acceptance matrix

Browser inspection confirms that the overview has no horizontal overflow or
sidebar overlap at 1440 px, 1024 px, and 769 px in both themes with the sidebar
expanded and collapsed; inspected routes have one main landmark. At 390 px in
both themes, the overview has no horizontal overflow. The mobile drawer was
opened in dark mode: it fits within the viewport (about 292.5 px at 390 px),
and profile-to-Account navigation closes it. It also opens at 767.777 px after
client hydration. The mobile hook now uses `(width < 48rem)` and the media
query's `matches` value; rounding `innerWidth` to 768 previously disagreed with
CSS at that fractional width. Account passed at 390 px in dark mode and at
1440 px expanded in both themes. MCP passed at 390 px in both themes and at
1440 px expanded and collapsed in both themes.

| Viewport | Page and sidebar state | Theme | Result and evidence |
| --- | --- | --- | --- |
| 1440, 1024, 769 px | Overview, expanded and collapsed | Light and dark | Passed; no overflow or overlap; one main landmark |
| 390 px | Overview, mobile | Light and dark | Passed; no overflow; drawer interaction and profile-account navigation separately checked in dark mode |
| 767.777 px | Account, mobile drawer after hydration | Dark | Passed; drawer operates below the CSS breakpoint boundary |
| 1440 px | Account, expanded | Light and dark | Passed; no horizontal overflow; collapse additionally checked in dark mode |
| 390 px | Account, mobile | Dark | Passed; no horizontal overflow |
| 1440 px | MCP, expanded and collapsed | Light and dark | Passed; no horizontal overflow |
| 390 px | MCP, mobile | Light and dark | Passed; no horizontal overflow |

The long-running development server initially retained a stale generated
stylesheet after class changes. Refreshing the stylesheet and reloading
confirmed the intended `lg` two-column hero. A final post-build check also
passed at 1440 px. The default browser viewport (about 924 px), original System
theme preference, and `/workspaces` page were restored; the default view has no
horizontal overflow or overlap.

Browser measurements and the pre-fix overflow dimensions are recorded in
`/tmp/gatherory-web-shell-browser-evaluation.json`. Screenshots include
`/tmp/gatherory-web-shell-fixed.png`,
`/tmp/gatherory-web-shell-desktop-dark.png`, and
`/tmp/gatherory-web-shell-mobile-light.png`. These are development checks with
the App Review account. No production push, deployment, database reset, or
permission changes were performed. The hidden Blueprint routes received only
the content-wrapper landmark correction; their full editor flows were not
exercised in this task.
