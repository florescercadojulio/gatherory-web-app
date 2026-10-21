# Development wedding seed photo sources

Checked October 21, 2026. The App Review and local-development wedding fixture
uses a small, checked-in set of JPEGs so the seed does not depend on sibling
repositories or live image CDNs. Each catalog entry points to a local file in
`scripts/seed/assets/` and records its Unsplash source page, photographer, photo
ID, and alt text. The photos are sample fixture artwork; the people shown are
not Gatherory users or endorsements.

All source pages below identified the image as free to use under the
[Unsplash License](https://unsplash.com/license) when checked. The new images
were downloaded directly from Unsplash's image CDN as JPEGs and resized so no
dimension exceeds 1024 pixels. The seven birthday-photo JPEGs were copied from
the iOS marketing fixture, which had already verified their source pages and
credits in the landing repository's
[image variety source notes](../../../gatherory-landing/docs/marketing-assets/image-variety-sources.md).

| Catalog key                     | Checked-in file            | Use                                | Photographer               | Source                                                                                                                                      |
| ------------------------------- | -------------------------- | ---------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-wedding-workspace`      | `main-ceremony.jpg`        | Wedding workspace cover            | Jonathan Borba             | [Outdoor wedding ceremony setup](https://unsplash.com/photos/outdoor-wedding-ceremony-setup-with-chairs-and-floral-decorations-EQcRRfDLIts) |
| `review-venue-tour-event`       | `venue-estate.jpg`         | Final venue walkthrough            | Zoshua Colah               | [Estate and gardens](https://unsplash.com/photos/a-large-building-with-a-bunch-of-plants-in-front-of-it-vjR9LUbOwrU)                        |
| `review-tasting-event`          | `dinner-tasting.jpg`       | Menu tasting                       | Tommaso Ubezio             | [Dinner served with wine](https://unsplash.com/photos/dinner-is-served-with-white-wine-and-food-Hl4eg9Up4s0)                                |
| `review-rehearsal-dinner-event` | `reception-decor.jpg`      | Rehearsal dinner                   | Joshua Manjgo              | [Wedding table with flowers and candles](https://unsplash.com/photos/a-table-is-set-with-flowers-and-candles-5RfyQ9urdx0)                   |
| `review-ceremony-event`         | `ceremony-couple.jpg`      | Ceremony                           | Alexander Mass             | [Couple at an outdoor ceremony](https://unsplash.com/photos/a-bride-and-groom-stand-at-an-outdoor-wedding-ceremony-5ICctTdtgjI)             |
| `review-reception-event`        | `reception-tables.jpg`     | Dinner and reception               | Ben Atkins                 | [Wedding reception table](https://unsplash.com/photos/a-beautifully-set-table-for-a-wedding-reception-zjJiX9txwRU)                          |
| `review-after-party-event`      | `afterparty-drinks.jpg`    | After-party                        | Diana Díaz                 | [Cocktails and catchups](https://unsplash.com/photos/friends-enjoying-cocktails-and-snacks-at-a-table-hJqfore3SH4)                          |
| `review-venue-idea`             | `venue-garden.jpg`         | Estate venue idea                  | Brittney Weng              | [Wedding garden](https://unsplash.com/photos/a-garden-filled-with-lots-of-white-flowers-96IKWQOvmVk)                                        |
| `review-music-idea`             | `music-playlist.jpg`       | First dance playlist idea          | Vincent Chan               | [Vinyl record](https://unsplash.com/photos/vinyl-record-on-turntable--ja1xVOENMo)                                                           |
| `review-attire-idea`            | `attire-garden.jpg`        | Garden formal attire idea          | Denisa-Elena Ficau         | [Bride walking into a garden](https://unsplash.com/photos/bride-in-a-flowing-gown-walks-through-doorway-to-garden-NOknLmkVDaA)              |
| `review-registry-idea`          | `honeymoon-amalfi.jpg`     | Weekend getaway fund idea          | Alexander Voronov          | [Amalfi Coast village](https://unsplash.com/photos/a-small-village-on-a-cliff-overlooking-the-ocean-jnwHRs7eVtw)                            |
| `review-weekend-guide-idea`     | `garden-ceremony.jpg`      | Wedding weekend guide              | Joeyy Lee                  | [Wedding dress in a garden](https://unsplash.com/photos/a-woman-in-a-wedding-dress-standing-in-a-garden-MJKzzcEkXLY)                        |
| `review-welcome-drinks-idea`    | `welcome-drinks.jpg`       | Welcome drinks                     | Luwadlin Bosman            | [Champagne at a wedding](https://unsplash.com/photos/a-glass-of-wine-sitting-on-top-of-a-table-Pe2y3pk2lbQ)                                 |
| `review-flowers-idea`           | `flowers.jpg`              | Garden rose arrangements           | Harshit Maurya             | [Colorful flower bouquet](https://unsplash.com/photos/a-close-up-of-a-colorful-bouquet-of-various-flowers-NTkFwBWZ7nE)                      |
| `review-food-idea`              | `food.jpg`                 | Family-style dinner                | Ruby Huang                 | [Pasta dishes and drinks](https://unsplash.com/photos/two-pasta-dishes-and-drinks-on-a-table-89PS_ZfaxHs)                                   |
| `review-photography-idea`       | `photography.jpg`          | Golden-hour portraits              | Vitaly Gariev              | [Friends taking a selfie](https://unsplash.com/photos/a-diverse-group-of-friends-taking-a-selfie-together-PpQyCTcADtw)                      |
| `review-decor-idea`             | `decor.jpg`                | Candlelit reception tables         | Andrii Solok               | [Friends around a candlelit dinner table](https://unsplash.com/photos/friends-gathered-around-a-table-with-food-and-candles-YfidYnwtXok)    |
| `review-invitations-idea`       | `invitations.jpg`          | Watercolor invitations             | Micah & Sammie Chaffin     | [Wedding invitations with greenery](https://unsplash.com/photos/wedding-invitations-and-stationery-displayed-with-greenery-5ZribvTyQVQ)     |
| `review-honeymoon-idea`         | `registry-travel.jpg`      | Amalfi coast escape                | Christopher Pap de Pestény | [Positano balcony view](https://unsplash.com/photos/a-woman-standing-on-a-balcony-looking-at-the-ocean-3dIF0zSQoeI)                         |
| `review-late-night-coffee-idea` | `coffee-bar.jpg`           | Late-night coffee bar              | Ryan Spaulding             | [Espresso machine](https://unsplash.com/photos/a-espresso-machine-making-a-cup-of-coffee-3b1mi9obsgA)                                       |
| `review-registry-item`          | `registry-item-travel.jpg` | Weekend getaway fund registry item | Rafael Peier               | [Positano on the Amalfi Coast](https://unsplash.com/photos/amalfi-coast-town-with-white-buildings-clinging-to-a-mountainside-b0kgh7xb8QA)   |

The seven copied files are the existing `MarketingBirthdayServed`,
`MarketingBirthdayDrinks`, `MarketingBirthdayPlaylist`, `MarketingBirthdayFlowers`,
`MarketingBirthdayPasta`, `MarketingBirthdayPhoto`, and `MarketingBirthdayTable`
assets. Their source photographers and full CDN records are also listed in the
source notes above.
