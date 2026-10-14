# English string inventory for i18n

This is the first pass at grouping user-facing English strings in the signed-in Gatherory web app. It is a source and ownership map, not a translation file or an exhaustive line-by-line export. The public marketing site has a separate inventory at `../gatherory-landing/docs/i18n-string-inventory.md` because its editorial and legal content has different needs.

## String categories

| Category | What belongs here | Main source areas | Notes for i18n |
| --- | --- | --- | --- |
| Authentication and account access | Sign in/up, email/password, OTP, magic links, verification, password reset, reauthentication, provider actions, and auth status/result messages | `src/components/auth/**`, `src/routes/auth/**`, `src/lib/auth/**` | Many auth views already read strings from Better Auth UI's `localization` object. Preserve that seam and include plugin-specific localization (theme, billing, magic link, last-login). Provider/library-generated messages may need separate configuration. |
| App shell and navigation | Sidebar labels, account menu, workspace switcher, breadcrumbs, user menu, theme controls, and page-level navigation | `src/components/account-sidebar.tsx`, `src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/nav-user.tsx`, `src/components/workspace-switcher.tsx` | Keep route IDs, path segments, permission keys, and icon names out of translation resources. Translate accessible labels as well as visible labels. |
| Workspace and event overview | Overview headings, metric labels and descriptions, status badges, event summaries, empty states, dates, spending summaries, and companion-page copy | `src/routes/_protected/workspaces/index.tsx`, `src/routes/_protected/workspaces/$workspaceSlug/index.tsx` | Counts, currencies, dates, and user content are values, not fixed English phrases. Use locale formatting and plural-aware messages. The companion page currently frames the web app as an iPhone companion; treat that copy as product content. |
| Event, schedule, and people concepts | Built-in event roles, event-purpose labels, planning/guest sections, timeline and activity labels, participant descriptions, and default workspace labels | Workspace routes, `src/server/workspaces/**`, `src/server/events/**`, `src/lib/organization-contract.ts`, `src/lib/guest-invitation-content.ts` | Distinguish fixed product vocabulary from data entered by a host. Built-in defaults such as the “Planning” workspace can be localized at creation time; existing user-created names must remain as entered. |
| Invitations and guest experience | Invitation preview, host-provided event details, access/role explanation, invalid/expired states, RSVP choices, accept/continue actions, and success/error toasts | `src/routes/join/$token.tsx`, `src/routes/api/invitations/**`, `src/server/events/invitation-*.ts`, `src/server/events/repos/guest-invitation.repo.ts` | Invitation titles, descriptions, locations, and dates can be host-authored. Translate the surrounding interface while preserving those values. Consider locale in invitation link behavior and date formatting. |
| Account and privacy-sensitive actions | Profile and account settings, appearance, billing, account deletion, confirmation warnings, destructive-action labels and feedback | `src/routes/_protected/account/index.tsx`, `src/components/auth/billing/**`, `src/components/auth/theme/**` | Treat security and billing language as high-impact copy. The account-delete confirmation token `DELETE` is currently a literal English input requirement; decide how that token behaves per locale before translating the prompt. |
| Shared controls and generic UI | Search, clear/refresh, pickers, table loading/empty states, pagination, selected-item labels, dialogs, toast close controls, and generic loading labels | `src/components/entity-picker.tsx`, `src/components/multi-entity-picker.tsx`, `src/components/entity-table-page.tsx`, `src/components/page-skeleton.tsx`, `src/components/not-found-page.tsx`, `src/components/route-feedback.tsx`, `src/components/ui/**` | Shared components can multiply untranslated strings across every feature. Include visually hidden text, `aria-label`, `title`, and library defaults; do not assume the app's own component wrappers cover dependency-provided strings. |
| Validation, system feedback, and server errors | Field validation, request failures, access/permission errors, unavailable resources, conflicts, retry guidance, and operation success/failure toasts | `src/server/effect.ts`, `src/server/result.ts`, `src/server/**`, route loaders/actions, `src/lib/toast-server-error.ts`, `src/components/route-feedback.tsx` | The server currently returns English `userMessage` text. Stable error codes/categories are better localization keys than translating arbitrary server prose; keep diagnostic messages and error IDs non-user-facing. Validation schemas may also carry English messages. |
| Transactional email | Subjects, preview text, headings, body, CTA labels, expiry/security notices, and plain-text alternatives for verification, reset, OTP, and magic-link mail | `src/server/email/auth-email.tsx`, `src/emails/**`, `src/emails/_components/**` | Keep HTML and plain-text versions in sync. Locale must be known at the time mail is sent; names, email addresses, codes, URLs, and expiry durations are interpolated values. |
| Metadata and document language | App title, page titles/descriptions, `lang`, and future share/notification metadata | `src/routes/__root.tsx`, route `head` definitions | The root document currently sets `lang="en"`. Titles and descriptions should follow the active locale; machine values such as charset, viewport, route IDs, and schema/property names are not translation copy. |
| Runtime-formatted values | Date/time, currency, counts, relative time, duration, and human-readable quantities | Workspace routes and components; invitation preview; auth cooldowns | Replace fixed `en-US` formatting and browser-default formatting with the active locale. Avoid concatenating numbers and English nouns; use ICU/message-format plural rules. Store currency, time zone, and date as data and format at the display boundary. |

## Data that should stay in its original language

The app displays content supplied by its users. Event/workspace names, idea titles and notes, descriptions, locations, participant names, invitation copy, and uploaded media captions should not be silently translated as part of UI localization. Product-defined labels and default names can be localized; user edits remain unchanged unless a separate, explicit content-translation feature is introduced.

Other non-copy values include route paths, query parameter names, database/API field names, enum values, permission keys, error codes, IDs, provider names, email addresses, URLs, CSS classes, and structured-data keys. Some brand names (Gatherory, Apple, Google) remain names in translated text; their surrounding labels can be translated.

## Current implementation signals

- `src/i18n/locales/en.ts` is the namespaced English interface catalog. Application error copy also has matching English and Spanish catalogs in `en.server-errors.ts` and `es.server-errors.ts`; the remaining interface still falls back to English.
- The app provider exposes i18next to the UI. Better Auth theme, magic-link, and email-code plugin copy is mapped from the English catalog; Better Auth's core auth views still use its own `locale`/`localization` structure.
- The workspace overview, event workspace, account/delete flow, invitation flow, auth story, app navigation, route feedback, and common accessible UI labels now read from the catalog.
- Workspace/invitation date display follows the active i18next language and event/activity counts use plural-aware keys. The workspace overview uses locale-aware currency formatting with USD because the current insight model does not provide a currency field.
- Backend tagged errors identify safe copy with `userMessageKey`. `src/server/effect-utils.ts` translates it using request language (English fallback) and returns `userMessage`, `messageKey`, optional safe interpolation values, and `errorId`. Its isolated i18next instance never mutates the browser language or a shared request locale. Debug messages, original causes, and raw validation issues remain in developer logs. React error boundaries and Sonner continue to handle frontend errors normally.
- Email content remains authored in React email components and plain text in the sending service; it is not yet extracted into a locale-aware resource.
- Legal content and public marketing/SEO copy remain in the separate landing project and are not part of this app catalog.

## Initial catalog namespaces

`common`, `navigation`, `switcher`, `overview`, `event`, `roles`, `account`, `authStory`, `authPlugin`, `authForm`, `invitation`, `notFound`, `errors`, `feedback`, `picker`, `userMenu`, `appearance`, and `ui` separate reusable controls from feature-specific copy. Keep this distinction as further strings are extracted; avoid moving user-entered event/workspace content into the catalog.

English and Spanish application-error copy and Better Auth error translations are supported. The remaining interface, email, and legal inventory should be completed before advertising a fully translated Spanish experience.

## Suggested extraction domains

For later implementation, keep at least these domains separate:

1. `app` — shell, common controls, workspaces, events, people, invitations, settings, validation, and errors.
2. `auth` — Better Auth UI and plugin localization, including auth result and verification flows.
3. `email` — transactional message subjects and bodies, with paired HTML/plain-text content.
4. `public-site` — landing copy, SEO articles, metadata, and legal documents; see the companion inventory.

Before shipping a second locale, decide how locale is selected and persisted, whether URLs are locale-prefixed, what happens when a translated resource is missing, how server errors get localized on the client, and whether email language follows the account preference or the triggering request. Keep legal translations separately reviewed for each target jurisdiction.
