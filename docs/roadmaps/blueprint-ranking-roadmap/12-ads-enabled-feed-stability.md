# Ads-enabled Explore stability

**Status:** Implemented locally; simulator SDK and card stability checks passed, October 23, 2026. Production advertising remains disabled.

## Problem and behavior

The card-only stability checks deliberately disabled advertising. With ads
active, a native ad was inserted after its asynchronous load completed and
removed when inventory reset. Its height varies with the creative, column width
and text size. The masonry's 360-point placement estimate did not reserve actual
rendered space, so insertion/removal could move the cards beneath it. Opening a
Blueprint preview also cleared the session, and returning from Browse could
incorrectly activate Search because Browse and Search share a result-source ID.

Explore now prefetches up to three upcoming scheduled slots. The initial ad is
admitted only while its insertion point is below the viewport. A first response
that arrives after that point has crossed the viewport is skipped for that feed
rather than inserted into visible or already-passed content. A never-filled slot
does not render a placeholder. Organic order and the existing 6/18/30 insertion
schedule remain unchanged; the policy does not change server ranking or search.

Sizing uses the same native renderer that presents the ad, with the actual
column width and Dynamic Type category. Full text and registered native assets
retain natural sizing. No fixed-height clipping, truncation, click overlay,
manual SDK impression, or fabricated ad object is introduced. Measurements are
invalidated with feed/session identity, full inventory reset, width, text size
and locale changes.

An admitted slot retains its measured geometry through lazy remounts. Expired
or evicted creatives are removed immediately; only an already-admitted slot
retains an empty reservation while replacement inventory is unavailable. A
replacement that fits may fill that reservation without shrinking it. A taller
replacement waits until the insertion point is below the viewport before
increasing the height. Refreshing the feed clears these reservations. Static
masonry estimates keep column assignment stable, but no-fill/late-skipped slots
can still leave uneven column tails; this does not promise equal-height columns.

## Covered previews and privacy boundaries

A covered Blueprint preview pauses new ad work, invalidates in-flight callbacks,
and retains unexpired same-account inventory. It resumes only after the cover
has actually dismissed. Browse returns to Browse; Search and Recents restore
search focus according to their retained screen mode.

Backgrounding, leaving Explore, account changes and privacy-choice changes
still clear the inventory. The cache remains bounded to three ads; original
55-minute expiry deadlines are preserved across preview pauses. This does not
add new ad targeting, release enablement or measurement collection.

## Verification setup

The DEBUG-only `-BlueprintAdsScrollVerification` launch flag enables Google's
real test SDK inventory against the existing local public catalog fixture.
The fixture has 40 entries, varied category ratios/title lengths/bylines, and
20-item cursor pages. Explore account actions and recommendation measurement
remain disabled. Ordinary `-BlueprintSearchVisualFixture` keeps ads disabled.
Neither flag can enable a Release fixture.

For this SDK verification build only, override `ADMOB_APP_ID` with Google's
sample app ID `ca-app-pub-3940256099942544~1458002511`. Debug already uses the
sample native unit `ca-app-pub-3940256099942544/3986624511`. The exact sample-pair
consent exception remains DEBUG-only; no checked-in configuration or production
consent gate is changed. SDK validation diagnostics may be dismissed by the UI
test; advertiser links and ad calls to action are never tapped.

Three smaller Luna agents handled lifecycle, sizing and the scroll harness;
parent integration added the final geometry guards and ran the native checks.

The broad pass completed **38 tests with zero failures or skips** on the iPhone
18 Pro simulator, iOS 27.0, using Xcode 27.1. It covers real SDK samples in Light
and Dark, paging from 20 to 40 organic entries, preview dismissal returning to
Browse without activating Search, card geometry after offscreen remounts, the
ads-disabled card regression, and a Dark accessibility XXXL text-size sample.
Both inspected Light/Dark SDK captures show **No implementation issues found**
in Google's native validator. The accessibility-size ad uses a single column,
wraps naturally, stays within the scroll width, and retains its height through
scrolling. Long content can extend beyond the viewport and remains scrollable.

After the last guard rejected stale geometry callbacks, a focused follow-up
passed **9 tests with zero failures or skips**: a new Light/Dark arrival test
checks the visible cards' x/y/width/height within one point before scrolling
when the sample ad is ready, plus the same eight placement-policy tests already
included in the broad run. These counts overlap; they are not 47 unique tests.
Pure tests cover late first admission, invalid geometry, creative loss, fitting
and oversized replacements, width invalidation and reset. Lifecycle/navigation
tests cover suspension and Browse focus restoration. Original expiry deadlines
were reviewed in code; the simulator was not left running for 55 minutes.

Evidence:

- Broad run: `/tmp/gatherory-ad-scroll-final.xcresult`; 22 screenshots in
  `/tmp/gatherory-ad-scroll-final-shots`.
- Final arrival/policy follow-up: `/tmp/gatherory-ad-arrival-final.xcresult`;
  two screenshots in `/tmp/gatherory-ad-arrival-final-shots`.
- English/Spanish localization coverage: 1,671 strings passed.
- The final Release simulator build passed with advertising flags still NO/NO.
  Source/whitespace checks and native accessibility/layout review passed;
  the web-specific audit tool and native lint configuration are unavailable.
  Details are recorded in the
  [native verification log](../../../../ios-apps/gatherory/docs/testing-verification.md#ads-enabled-explore-stability--october-23-2026).

These checks establish the selected fixture's geometry and navigation behavior;
they do not measure frame-rate performance or equal-height column tails. The
SDK remains responsible for native ad impressions and interactions. Tests only
dismiss its validation popup; they do not tap an advertiser action.

The catalog is a local fixture, not the deployed authenticated catalog. This
pass does not validate Gatherory's production UMP messages, physical-device
behavior, ad click/conversion reporting, copy/install attribution or scroll
frame rates. Production advertising remains disabled and the existing
[native release gates](../../../../ios-apps/gatherory/docs/explore-advertising.md)
still apply.
