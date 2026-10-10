# Page Creation Standard

This document defines the default UX and implementation conventions for pages
under `src/routes/`. A page should be chosen by the job it performs, not forced
into a generic dashboard or card layout.

## Route ownership and layout

The authenticated Gatherory product owns one protected route namespace. Its
shell owns product navigation, event-context switching, and the route header.
Child routes own their page content.

```text
src/routes/
  _protected/
    route.tsx                 # server-backed session guard, Outlet
    index.tsx                 # authenticated home
    events/
      index.tsx               # collection page
      new/index.tsx           # creation flow
      $eventId/
        route.tsx             # optional shared detail layout
        index.tsx             # event detail
```

Use folder-owned routes consistently. A resource segment owns either an
`index.tsx` page or a `route.tsx` layout with an `Outlet`; do not introduce flat
siblings such as `events.tsx`, `$eventId.tsx`, or `login.tsx`. The generated
`__root.tsx` convention is the required TanStack root exception. API splats use
the same rule, for example `api/auth/$/route.ts`.

Use `createFileRoute` with the path generated from the folder location. Do not
hand-edit `src/routeTree.gen.ts`; run `npm run generate-routes` after adding,
renaming, or moving route files, then run a type-check. Do not build unless requested.

Return `withBreadcrumb(label, description?)` from `beforeLoad` on pages that
should appear in `RouteHeader`. The optional description displays a question-mark
button beside the label, with a shadcn tooltip on hover, focus, or click:

```ts
beforeLoad: () =>
  withBreadcrumb(
    "Training library",
    "Approved training and helpful reference documents.",
  );
```

When breadcrumbs already name a collection, omit a duplicate title/description
above its table. A child label without a description clears inherited help.
The protected parent uses `ensureSession` in `beforeLoad`, so signed-out users
are redirected before protected content renders on either the server or client.
This route guard protects navigation, not data: every server function must still
apply its own session and event authorization middleware.

## Choose the page pattern

### Collection page

Use [`EntityTablePage`](../src/components/entity-table-page.tsx) for major
sections that browse tabular entities. It already owns server-function reads,
search, pagination, loading, retry, and empty states.

Provide a typed server function using the standard page shape:

```ts
type PageInput = { limit: number; offset: number; query: string };
type Page<T> = { data: T[]; hasNextPage: boolean };
```

Keep columns focused on scanable information. A row click should navigate to a
detail route when one exists. Controls embedded in a row must be deliberate,
safe, and high-frequency; interactive elements must not trigger row navigation.

Use `resourceControls` for a collection-level action such as **New event**.
It belongs beside filtering/search controls and should wrap cleanly on smaller
screens.

### Detail page

Use a directly addressable route such as `/app/events/$eventId` for the
complete entity view and its normal editing experience. Detail routes are the
right place for context, history, attachments, and edits that are too rich for
a table row.

Give each page one primary purpose. Keep a reader focused on its content and
primary task; move secondary management controls into a shadcn sheet or menu.
For event and idea detail pages, keep the primary object prominent and place
secondary management controls in a sheet or restrained action area.

### Creation page

Creation is a separate use case, not a blank detail page. Give it a direct
route such as `/app/events/new`, an explicit **Cancel** path, and a
single submit action that creates the entity once the user confirms. Do not
autosave a partially created entity unless drafts are an explicit product
feature with a defined lifecycle.

### Composer page

When the primary task is writing—such as a request, note, or document—make the
page feel like a document editor:

- Let the title and editor canvas dominate the hierarchy.
- Keep status, priority, department, and assignment as compact metadata.
- Put submit/cancel in a restrained page action bar.
- Do not surround the editor with nested cards, labels, or decorative panels.
- Preserve accessible labels with `sr-only` when a visible label would make the
  writing surface feel like a form.

Use this pattern for long-form notes or invitation copy only when writing is the
primary job of the screen.

## Data access

Pages and components call typed TanStack Start server functions. They do not
import workflows, repositories, Drizzle, or external providers.

`EntityTablePage` and `EntityPicker` fetch their own paginated data through the
server function passed to them. Do not add a duplicate route loader merely to
preload the same table or picker data. Use a route loader when the route itself
needs data before it can render or when the data is shared by several page
sections.

Handle the shared server result explicitly:

```ts
const result = await serverFn({ data });

if (!result.ok) {
  // Show result.error.userMessage and, where helpful, its errorId.
  return;
}

// Use result.data.
```

## Forms and mutations

All new forms use TanStack Form. It owns field values, submission state,
validation timing, and reset behavior; do not reimplement form state with a
collection of unrelated `useState` calls.

Choose persistence behavior by use case:

- **Create flows:** validate and submit explicitly. A failed submission keeps
  entered values and displays an actionable error.
- **Existing-entity edits:** autosave is appropriate only when the product has
  clear field-level status, debouncing, confirmation, failure recovery, and
  rollback behavior.
- **Destructive or consequential changes:** require an explicit action and any
  appropriate confirmation.

Use the Zod input contract again immediately before a mutation if the page has
derived values, such as rich-editor content. Show safe handler errors near the
relevant action and include the trace ID as a support reference when useful.

## Selecting related entities

Use [`EntityPicker`](../src/components/entity-picker.tsx) for searchable,
paginated related records such as participants, collaborators, events, or ideas.
Supply an
authorized page server function, a selected display row, and the form field's
ID value.

The picker has two distinct pieces of state:

1. the selected row, used only for its display label; and
2. the form field ID, sent to the server on submit.

The server remains authoritative. The creation or update workflow must scope
the record to an event the signed-in person can access. Child events keep their
own participant assignments even when creation initially copies them from the
main event.

## Rich text with BlockNote

Use BlockNote's shadcn adapter for a rich document editor:

```ts
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
```

BlockNote is browser-only in a TanStack Start route. Mount the editor inside
`ClientOnly` so server rendering returns a stable fallback. Keep the editor's
visual canvas unboxed unless a real document boundary is needed; size and theme
the `.bn-editor` element itself, not only BlockNote's outer container.

Configure `uploadFile` only when the application has a real storage flow.
Leaving it undefined deliberately disables file uploads. Image blocks may still
reference externally hosted URLs when that is an accepted product constraint.

Rich editor documents can be deeply typed. Keep ordinary form fields in
TanStack Form, then derive the serialized document and searchable text from the
editor at submission time. Validate the resulting payload with the server input
contract before calling the mutation.

## Visual and accessibility standards

Do not use cards as the default page or form layout. Use a card only when it
communicates a meaningful boundary, not as a substitute for hierarchy.

Prefer the project tokens and shadcn primitives for buttons, inputs, selects,
field semantics, separators, and feedback. Avoid raw controls when an owned UI
primitive exists. Maintain visible focus states, keyboard operation, responsive
wrapping, and screen-reader labels for every interactive control.

Design empty, loading, submitting, and error states as part of the page. For a
browser-only editor, the server fallback must communicate that the composer is
loading without creating a layout jump after hydration.

## Page completion checklist

1. Choose the appropriate collection, detail, creation, or composer pattern.
2. Place the file under the correct protected application route namespace.
3. Add breadcrumb metadata and update shell navigation when the page is a
   destination.
4. Reuse `EntityTablePage` and `EntityPicker` where they fit.
5. Use TanStack Form for mutations and typed server functions for data access.
6. Keep creation explicit; add autosave only when the existing-entity behavior
   is fully designed.
7. Treat editor widgets as client-only and configure uploads deliberately.
8. Regenerate the route tree and type-check. Run a build only when requested;
   inspect the page in a browser when an authenticated local session is
   available and visual verification is part of the task.
