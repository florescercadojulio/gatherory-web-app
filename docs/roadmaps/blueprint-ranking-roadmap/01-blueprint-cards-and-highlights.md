# 01 — Scan-first Blueprint cards

**Current direction:** title-led cards; accepted October 22, 2026.  
**Owner area:** Native Explore, category, and search cards.  
**Entry point:** Existing public catalog card and read-only Blueprint preview.

## Current behavior

People scan cards to decide which Blueprint fits their purpose. Keep each card
quiet and recognizable: show its cover or existing fallback, a prominent title
that says what experience it is for (for example, “Cottage Weekend” or
“Backyard Birthday Party”), and a small optional creator byline. Do not add
title validation or automatically rename published content; do not inflate the
card with metadata to compensate for a vague title. Do not show a category label, summary, event/idea highlights, counts, or a visible
“Preview Blueprint” call to action. The existing whole-card button opens the
read-only Blueprint preview. Implementation: native
[`BlueprintCatalogTile`](../../../../ios-apps/gatherory/Gatherory/Features/Blueprints/BlueprintDiscoveryCards.swift).

The October 22 visual follow-up removes the solid text tray. Artwork fills the
card, with title and byline directly over the progressive `glur` cover and a
smooth contrast fade. Keep the text sharp; no separate text panel or extra
metadata is needed. The layout still grows with accessibility text sizes.

The preview remains the place to inspect the complete published plan, events,
and ideas before using the existing explicit setup/install flow. Opening or
dismissing it does not create a draft, event, membership, RSVP, vote, or social
action. Single-event Blueprints remain valid. Public discovery continues to
exclude private live-event data, saved-copy edits, drafts, and unlisted-link-only
content. This presentation change does not change catalog ordering, pagination,
ad boundaries, publication contracts, or installation behavior.

At accessibility text sizes, keep the title readable and allow the card to
grow or stack. Preserve the existing cover fallback, optional-byline behavior,
button semantics, account isolation, paging, ad identity, and Reduce Motion
navigation. Category/search scope and scroll-return behavior remain unchanged.

## Next slice and non-goals

[02 — Content search and related terms](02-content-search-and-related-terms.md)
is implemented locally using public Blueprint, event and idea text while keeping
one Blueprint as each result. [03 — Actions and measurement](03-actions-and-measurement.md)
is also implemented locally, without adding card detail. A nested match explanation belongs to search results
or the preview, not the general card. Existing category IDs and curated tags
remain internal metadata and may support optional browse shortcuts; there is no
required taxonomy, topic picker, keyword form, or hashtag authoring step.

This slice does not require likes, private bookmarks, follows, standalone
event/idea posts, social counters, analytics, or a ranking change. Those need
separate product and contract decisions backed by evidence.

## Superseded highlight prototype history

An earlier local prototype displayed up to three deterministic published
event/idea highlights on the card and added a localized preview affordance. Its
projection and tests were removed when the accepted scan-first direction
changed. The prototype is historical evidence only; it is not current product
behavior or a required acceptance target.

On October 22, 2026, the historical implementation was verified with a full
native non-UI target run (**941 tests in 132 suites**) and then a focused rerun
after review (**34 tests in four suites**, including nine projection tests).
English/Spanish localization validation passed **1,639 strings** at that time.
An isolated synthetic render fixture inspected normal and large-text layouts,
light/dark appearance, Spanish copy, and missing artwork. Those checks covered
the superseded highlight prototype, not the current title-led card behavior;
they do not establish current visual acceptance, physical-device behavior, or
spoken VoiceOver quality. Earlier verification after simplification passed the
native build and 25 focused navigation/content/session tests, plus 1,638 English/
Spanish strings. Synthetic light/dark and AX3 captures of the current card were
visually inspected for wrapping and overlap. See the native [testing
verification](../../../../ios-apps/gatherory/docs/testing-verification.md#current-scan-first-blueprint-cards--october-22-2026)
for exact limits and locations. Physical-device and spoken VoiceOver acceptance
remain outstanding.

## Tray-removal verification

The follow-up full-cover text layout built and passed **27 focused tests in three
native suites**. Isolated light/dark, missing-artwork and AX3 simulator renders
were inspected for readability and wrapping. Current evidence and remaining
device acceptance are in the native [tray-removal record](../../../../ios-apps/gatherory/docs/testing-verification.md#blueprint-card-tray-removal--october-22-2026).
Content search and related terms were subsequently implemented locally; see 02
for the search behavior and verification. The subsequent actions/measurement
implementation is recorded in [03](03-actions-and-measurement.md).
