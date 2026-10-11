import { eq } from "drizzle-orm"

import { db } from "@/db"
import { organization } from "@/db/schema/auth.schema"
import { auth } from "@/lib/auth"
import { defaultOrganizationType } from "@/lib/organization-contract"

type CreateEventWorkspaceInput = {
  name: string
  slug: string
  headers?: Headers
  userId?: string
}

/**
 * Creates a product workspace through Better Auth and normalizes the one
 * legacy organization value that older Better Auth clients can materialize.
 * Keep all organization creation paths behind this boundary.
 */
export async function createEventWorkspace(input: CreateEventWorkspaceInput) {
  const workspace = await auth.api.createOrganization({
    ...(input.headers ? { headers: input.headers } : {}),
    body: {
      name: input.name,
      slug: input.slug,
      ...(input.userId ? { userId: input.userId } : {}),
    },
  })

  if (workspace.workspaceType !== defaultOrganizationType) {
    await db
      .update(organization)
      .set({ workspaceType: defaultOrganizationType })
      .where(eq(organization.id, workspace.id))

    return {
      ...workspace,
      workspaceType: defaultOrganizationType,
    }
  }

  return workspace
}
