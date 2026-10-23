# Open-source reference: fresh Blueprint discovery

Reviewed October 23, 2026. These are inspected source snapshots, not claims about
every variant currently serving on an external social network. Gatherory's
implementation is independent; no upstream code or runtime package was imported.

## Twitter and X

At Twitter `the-algorithm` commit
`c54bec0d4e029fe34926ef3258a86ccacc0d0182`,
[PreviouslySeenTweetsFilter](https://github.com/twitter/the-algorithm/blob/c54bec0d4e029fe34926ef3258a86ccacc0d0182/home-mixer/server/src/main/scala/com/twitter/home_mixer/functional_component/filter/PreviouslySeenTweetsFilter.scala)
checks client-reported seen IDs, recent engagement IDs and impression Bloom
filters. Its separate
[PreviouslyServedTweetsFilter](https://github.com/twitter/the-algorithm/blob/c54bec0d4e029fe34926ef3258a86ccacc0d0182/home-mixer/server/src/main/scala/com/twitter/home_mixer/functional_component/filter/PreviouslyServedTweetsFilter.scala)
checks served IDs, conditionally for older-page requests or an all-request
configuration. This gives a useful architectural distinction: something sent
to the phone has not necessarily appeared on screen.

At xAI `x-algorithm` commit
`07d159b69109f069c85f84d39dd38e38adc040f0`, the Rust
[seen-post filter](https://github.com/xai-org/x-algorithm/blob/07d159b69109f069c85f84d39dd38e38adc040f0/home-mixer/filters/previously_seen_posts_filter.rs)
likewise checks seen IDs and impression Bloom filters. The
[served-post filter](https://github.com/xai-org/x-algorithm/blob/07d159b69109f069c85f84d39dd38e38adc040f0/home-mixer/filters/previously_served_posts_filter.rs)
handles served IDs separately, with request-context gating.

Gatherory adopts that separation, with a different inventory policy. Our history
is a bounded exact map, so it needs no probabilistic Bloom filter. Seen Blueprints
move behind unseen candidates; they remain available when inventory runs short.
Cooldowns and oldest-view-first reuse suit reusable plans better than removing
seen content indefinitely. Candidate eligibility and Not interested still run
before ranking. Search is an explicit request to find content and keeps its
existing relevance ordering.

## Bluesky

At Bluesky `feed-generator` commit
`70e172e16c659167707a7ef65eef7e37fdb606ff`, the starter
[what's-alf feed](https://github.com/bluesky-social/feed-generator/blob/70e172e16c659167707a7ef65eef7e37fdb606ff/src/algos/whats-alf.ts)
orders by index time and CID, then uses a cursor for continuation. The inspected
example is a feed-generation and paging reference; it does not supply personal
seen-history cooldown logic. Gatherory already has stronger account/filter/order
cursor binding, which this change preserves.

## Applied policy

The [implementation slice](../roadmaps/blueprint-ranking-roadmap/16-unseen-first-discovery.md)
records exact limits, evaluation and verification. A device-local account history
records only qualifying visible cards, independently of analytics. Each browse
session freezes that history and a tie-breaking seed. The server ranks unseen,
cooled seen, then recent seen candidates; typed search ignores the context.
The current stream stays stable while the catalog, eligibility and preferences
remain unchanged. A changed catalog or expired cursor triggers bounded recovery.

This does not require engagement model training, a social graph, external
recommendation infrastructure or a new native package. Human relevance review
and online usefulness measurements remain separate from a synthetic repetition
evaluation.
