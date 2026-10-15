import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BlueprintCapture } from '@/components/blueprints/blueprint-capture'
import { UUIDSchema } from '@/contracts/content-primitives'
import {
  getBlueprintDraft,
  getBlueprintAuthoringContext,
} from '@/server/blueprints/handlers/blueprint-authoring.functions'
import { listBlueprintCaptureEvents } from '@/server/blueprints/handlers/blueprint-capture.functions'

const searchSchema = z.object({
  eventId: UUIDSchema.optional(),
  templateId: UUIDSchema.optional(),
})

export const Route = createFileRoute('/_protected/blueprints/capture/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ templateId: search.templateId }),
  loader: async ({ deps }) => {
    const [context, events, draft] = await Promise.all([
      getBlueprintAuthoringContext(),
      listBlueprintCaptureEvents(),
      deps.templateId ? getBlueprintDraft({ data: { id: deps.templateId } }) : null,
    ])
    return { context, events, draft }
  },
  component: BlueprintCapturePage,
})

function BlueprintCapturePage() {
  const { eventId, templateId } = Route.useSearch()
  const { context, events, draft } = Route.useLoaderData()
  const { authoringUser } = Route.useRouteContext()

  return (
    <BlueprintCapture
      authoringUser={authoringUser}
      context={context}
      events={events}
      draft={draft}
      initialEventId={eventId}
      templateId={templateId}
    />
  )
}
