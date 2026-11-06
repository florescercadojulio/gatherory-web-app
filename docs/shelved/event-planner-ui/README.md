# Shelved event planner routes

These `.tsx.txt` files preserve the prior signed-in planner page and legacy
workspace page while the browser app returns to an overview-only planning
scope. They are source archives, not active routes; `/events/:eventId` and
`/workspaces/:workspaceSlug` redirect to `/workspaces`.

Accountless and signed-in invited guests can still open `/invited/events/:id`
to view the invited event and manage their own RSVP. The server workflows and
native/MCP planning APIs remain available and unchanged.

To restore planner pages, move the relevant source back into the route tree,
rebuild the route tree, and update route-policy tests. Recheck the current
authorization contracts before re-enabling any UI actions; the archived page
source is not an authorization specification.
