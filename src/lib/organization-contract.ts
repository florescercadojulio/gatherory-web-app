export const organizationTypes = ["event", "business"] as const;

export type OrganizationType = (typeof organizationTypes)[number];

export const defaultOrganizationType: OrganizationType = "event";

type OrganizationCreationInput = {
  slug?: string | null;
  workspaceType?: string;
  [key: string]: unknown;
};

/**
 * Enforces the database organization contract at the last server-side boundary
 * before Better Auth persists a new organization.
 */
export function prepareOrganizationForCreation<
  Input extends OrganizationCreationInput,
>(workspace: Input) {
  return {
    ...workspace,
    slug: workspace.slug?.trim().toLowerCase(),
    workspaceType: defaultOrganizationType,
  };
}
