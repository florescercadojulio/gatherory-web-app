# Mobile collaboration notifications

Requested October 20, 2026. This proof of concept adds FCM as a transport for
shared planning updates. It does not add personal reminders, browser push,
marketing messages, Firebase Authentication, or analytics.

The next implemented local slice is [explicit event announcements](02-event-announcements.md):
one iPhone Updates composer targets All, Planning or Guests. Existing planning
notes remain private history in that same UI. Exact-event permissions constrain
readers, senders and push recipients; the same transactional service handles
delivery. Consumer-facing workspace
wording now says event; internal ownership and sync names remain stable.

See [the FCM proof of concept](01-fcm-proof-of-concept.md) for configuration,
test evidence, and the remaining device/deployment checks. Nothing in this slice
is deployed. Real delivery requires an explicitly configured Firebase project
and Apple push credentials; the default mobile build keeps this feature off.
