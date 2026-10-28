# MCP conference plan import evaluation

This fixture evaluates whether an MCP client can turn a supplied conference
plan into a Gatherory event using `create_event`, scheduled child events, notes,
and tasks. It is test data only. The source is the pasted plan supplied for the
evaluation; catalog times, rooms, descriptions, and URLs are preserved as
provided and have not been independently checked against the live catalog.

## Fixture expectations

[`mcp-techxchange-plan.ts`](../../tests/fixtures/mcp-techxchange-plan.ts)
contains the full source text, an event spanning October 26–29, 2026 in
`America/New_York`, its 17 timed recommended sessions, five catalog alternatives
and the optional Wednesday evening networking event as ideas, planning notes,
and four root follow-up tasks plus one session preparation task. The optional Monday block party remains annotated
optional. The alternatives are ideas and are not created as scheduled children,
including the conflicts explicitly called out in the source. The full source is
archived in note sized excerpts, alongside topic notes for goals, questions,
preparation, follow-up, and provenance. No session registration or account
favorite is part of the fixture.

The fixture does not assert a particular Humphrey system model or backup
architecture. The supplied plan identifies those details as unknown. It avoids
assigning named coworkers or contacts. The proposed one-page recommendation due
date is November 2, 2026 (two business days after Thursday, October 29); the
pilot and timed restore exercise target November 28 (30 days after return).
These are proposed dates, not existing commitments.

## Database integration acceptance

The opt-in database integration test should run only against a disposable
loopback database. It imports the fixture through the shared registered MCP
tool dispatcher, then verifies persisted database state and MCP read-back:

- one main event and exactly 17 linked scheduled children, each with canonical
  instants, `America/New_York`, source URL, source attribution, and room;
- every child belongs to that root; no orphan, duplicate, or alternative child;
- the original plan’s complete word sequence is recoverable from notes, together with goals,
  questions, and provenance;
- a session child can own its own note and task;
- all five catalog alternatives and the optional Wednesday networking item
  remain unscheduled ideas;
- all five tasks are persisted with their source-grounded due dates and no
  invented assignee;
- the selected itinerary has no time overlaps; the optional block party is
  still marked optional;
- replaying identical idempotency keys completes a partially imported plan
  without duplicates, and access from an unrelated account cannot read the
  imported content;
- invalid note and due-date inputs are rejected, after which valid requests
  using those keys succeed.

No production database, user account, or catalog registration is used. Set the
integration opt-in flag only with the test server and database configured as
isolated loopback resources, following the MCP local verification instructions
in [`mcp.md`](mcp.md).

## Evaluation result — October 25, 2026

The opt-in database integration passed against the disposable loopback database
using the registered transport-neutral MCP tool dispatcher:

```sh
python3 /tmp/gatherory-mcp2-run.py env \
  MCP_CONFERENCE_EXPORT_PATH=/tmp/mcp-conference-native-payloads.json \
  pnpm exec vitest run tests/integration/mcp-conference.database.test.ts
```

The integration created one synthetic root, 17 linked child events, six
unscheduled ideas, 30 notes, and five tasks (four root follow-ups and one session
preparation task). One note and one task belong to a child session. It proved
New York time-zone read-back, preserved child source URLs and rooms,
optional-item labeling, non-overlap, outsider read denial, root idempotency,
duplicate-safe retries after eight sessions had already committed, and recovery
after invalid note/task inputs. Source words were preserved while note chunk
boundaries normalize whitespace; this is not a byte-for-byte text archive.
The full verbatim source remains in the TypeScript fixture.

The test exported native payloads to
`/tmp/mcp-conference-native-payloads.json`; its checked-in synthetic copy is
[`McpConferencePayloads.json`](../../../ios-apps/gatherory/GatheroryTests/McpConferencePayloads.json).
The native
[`McpPlanningPayloadTests.swift`](../../../ios-apps/gatherory/GatheroryTests/McpPlanningPayloadTests.swift)
suite passed **4/4 tests** on the iOS simulator using the actual
`WorkspaceArchiveCodec`, `TimelineItem`, `EventNote`, and `EventTodo` models.
It decoded the complete exported fixture, checked all 17 parent relationships,
30 notes, five task payloads, and local conference dates. Result bundle:
`/tmp/gatherory-mcp2-native-final.xcresult`.

The combined MCP regression run passed **66/66 tests in 17 files**, including
isolated database and HTTP/OAuth integration. The final focused HTTP test also
passed all 17 tool bindings, with actual create/list/update calls for children,
notes, and tasks. Typecheck passed. The complete repository suite passed 906
tests and skipped 65, with one existing Android auth handler architecture
failure unrelated to this extension. See [the MCP guide](mcp.md) for final build,
contract validation, and rollout status.

This establishes server persistence, read-back, retry handling, transport
composition, and compatibility with native decoding. It does not establish
on-device rendering/synchronization or a third-party client's autonomous plan
interpretation. The fixture models the intended interpretation of the supplied
plan; no live model evaluation was performed. Catalog details remain as supplied
and unverified. Test accounts and event data are disposable; no user event was
created in production.

The later [real-client development evaluation](mcp-dev-rollout.md) uses the
actual supplied document through Codex and verifies simulator receipt. Its
16 scheduled sessions and seven ideas retain both optional outings as ideas;
this synthetic fixture schedules the optional Monday block party and therefore
has 17 scheduled sessions and six ideas. These are separate evaluations, not
duplicate imports or contradictory final counts.
