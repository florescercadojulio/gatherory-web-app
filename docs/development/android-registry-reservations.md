# Android registry reservations (local implementation)

The Android parity work adds account and device-guest reservation APIs. The migration and routes are local source changes. No production migration, deployment, provider setting or cloud resource was changed.

`GET /api/events/{eventId}/registry` and its `/api/guest/events/{eventId}/registry` equivalent return only an exact participant's visible shared registry. The response includes item metadata, total committed quantity, available quantity and the viewer's own reservation quantity. It does not expose another actor's identity. Account requests use the authenticated session; device guests use the established guest credential headers and cannot use a claimed profile.

POST accepts `{requestId,itemId,quantity}` to set the viewer's absolute quantity. DELETE accepts `{requestId,itemId}` to cancel. A durable per-principal request receipt binds the UUID to its body hash. Reuse with different input conflicts; replay returns current state and cannot undo a newer choice. Item and lifecycle locks serialize final-unit capacity checks. Unknown quantities and closed or unshared events are not reservable.

Guest claim merges active account/guest quantities under sorted item locks, preserving the aggregate. A capacity conflict rolls back the claim. Account and device-guest departure cancel only that event's commitments; other actors and events remain unchanged.

Validation in the integrated local checkout: TypeScript type checking, four serialized handler contract tests, and the focused disposable PostgreSQL reservation regression passed. The database regression covers retry/reused-key/stale replay, concurrent final-unit requests, exact event and organization access, hidden private registry, claim collision rollback and successful claim, claimed-guest denial, closed events, aggregate privacy and departure isolation. Database tests require their explicit opt-in and a loopback disposable database. Android UI and real local-backend runs are reported in the Android repository's verification notes.

The schema change is generated under `drizzle/20261025003143_lucky_robbie_robertson/`. It preserves existing account commitment rows while adding guest principals and idempotency receipts. Existing Android Apple sign-in and invitation-date source changes were preserved during integration.
