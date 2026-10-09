# Roadmap Guide

## Purpose

Use a roadmap for meaningful product, application, or architecture work that
extends beyond one tactical change. A good roadmap helps a future developer or
AI conversation understand the current state, intended end state, implementation
order, deliberate deferrals, and how to continue safely.

Roadmaps complement, rather than replace, the implementation standards:

- [Server Architecture](./server.architecture.md)
- [Page Creation Standard](./page-creation.md)

The roadmap defines feature sequencing and product decisions. It must not
invent a different application architecture or bypass the server and page
standards.

## When to create a roadmap

Create one when work needs several coherent slices, has meaningful design or
architecture decisions, or is likely to continue across conversations. Typical
signals include:

1. a new protected application or domain module;
2. a multi-step lifecycle or state machine;
3. new event-scoped data and several UI surfaces;
4. operational behavior with permissions, recovery, or automation; or
5. a feature with safe, intentional deferrals.

Do not create a roadmap for a contained bug fix, a small visual refinement, or
a clearly bounded change that can be implemented and verified in one pass.

## Where roadmaps live

Place each roadmap in its own folder:

```text
docs/roadmaps/<feature-name>-roadmap/
```

For example:

```text
docs/roadmaps/project-request-roadmap/
```

Use lowercase kebab-case names. A roadmap folder contains a living `README.md`
and only the numbered documents that its feature actually needs.

```text
docs/roadmaps/<feature-name>-roadmap/
  README.md
  00-current-state-and-target-architecture.md
  00a-<feature>-implementation-spec.md  # optional
  01-<foundation-slice>.md
  02-<next-slice>.md
  03-<hardening-or-scale-slice>.md
```

Do not create placeholder files solely to match the template.

## What each file means

### `README.md`

The README is the roadmap’s front door and its continuity record. Update it as
work progresses. Include:

1. status and priority;
2. owner area or route namespace;
3. purpose and user outcome;
4. current position and stopping point;
5. roadmap index and implementation order;
6. immediate next slice or explicit deferrals;
7. architectural constraints; and
8. related documentation and source areas.

### `00-current-state-and-target-architecture.md`

Use `00` to frame the feature. It should distinguish what exists today from
the intended target state and explain:

1. current implementation and gaps;
2. source-of-truth data and event ownership boundaries;
3. the target behavior and system responsibilities;
4. what must not own the feature; and
5. intentional tradeoffs.

This is architectural context, not a task checklist.

### `00a-<feature>-implementation-spec.md`

Use `00a` only when the first build slice needs a concrete, feature-specific
spec beyond the general implementation guides. It should be executable by a
future session without rediscovering product decisions.

Include the use case, non-goals, event context, required data changes,
server ownership, handlers, UI surfaces, authorization, acceptance criteria,
tests, and explicit deferrals. Link to the relevant architecture documents
instead of restating their universal rules.

### Numbered slices

Each numbered file represents one coherent capability, such as lifecycle
foundation, a collection and detail experience, completion handling, or later
hardening. Do not combine unrelated work only because it belongs to the same
feature.

## Slice template

```md
# 02 - <Capability>

**Status:** Planned
**Priority:** P1
**Depends on:** 01 - <Foundation capability>

## What this is

Describe the capability in plain language.

## Why it exists

Explain the user or operational problem it solves.

## Current implementation

State what is already true. Omit this section only when no work has begun.

## Target behavior

Describe the observable result and relevant edge cases.

## Architecture boundary

Name the contract, handler, workflow, service, repository, route/component,
and infrastructure responsibilities that are relevant to this slice.

## Acceptance criteria

- concrete behavior
- cross-event isolation
- authorization
- state transitions or idempotency where applicable
- tests

## Explicit deferrals

- intentionally excluded work and why it is safe to defer
```

Not every section applies to every slice, but the document must be specific
enough for implementation to start without guesswork.

## Status and current truth

Use direct status labels:

```text
Planning
Planned
In progress
Implemented first slice
Implemented
Deferred
Superseded
```

Avoid vague labels such as “mostly done.” When a slice is partial, state exactly
what is complete and what remains.

Keep current implementation and future target behavior separate. A roadmap must
not make an optional future direction look like an existing requirement.

```text
Current implementation:
Requests are completed directly by the assignee.

Future slice:
Add completion approval only if the product adopts an approver workflow.
```

## Deferrals, tests, and completion updates

Every roadmap should state what is intentionally out of scope. Explain why the
deferral is safe and what would cause it to become necessary.

Describe tests by behavior, not by implementation detail. For example:

- a participant in one event cannot read or change another event without an
  independent participant assignment;
- an invalid status transition returns a domain conflict result;
- retrying an idempotent operation does not duplicate an outcome; and
- an archived record is excluded from default reads but can be restored.

When a slice is implemented, update the roadmap with the actual behavior,
important files or modules, validation run, and remaining deferrals. A roadmap
that remains a stale plan is not useful as a handoff.

## Collaboration and continuation

At the end of a work session, update the roadmap README’s stopping point and
the active slice. A handoff should state:

```text
Completed behavior:
Decisions made:
Files or modules changed:
Validation run:
Remaining work:
Open questions or risks:
```

The next AI conversation should read the roadmap README, active slice, relevant
architecture documents, and current diff before continuing. It should preserve
implemented decisions unless the user asks to revisit them or code evidence
shows they are unsound.

## Roadmap readiness checklist

Before treating a roadmap as ready:

1. The README identifies the current stopping point and immediate next slice.
2. `00` separates current truth from target architecture.
3. `00a` exists only when a concrete feature spec is needed.
4. Each numbered file covers one coherent capability.
5. Event scope, authorization, and state behavior are covered where
   relevant.
6. Deferrals and their rationale are explicit.
7. Acceptance criteria and tests describe observable behavior.
8. Implemented slices record the real outcome rather than leaving planning text
   behind.
