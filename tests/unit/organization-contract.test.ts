import assert from "node:assert/strict";
import { test } from "vitest";

import { organizationType } from "@/db/schema/auth.schema";
import {
  defaultOrganizationType,
  organizationTypes,
  prepareOrganizationForCreation,
} from "@/lib/organization-contract";

test("the Better Auth default is accepted by the PostgreSQL enum", () => {
  assert.equal(defaultOrganizationType, "event");
  assert.deepEqual(organizationType.enumValues, organizationTypes);
  assert.ok(organizationType.enumValues.includes(defaultOrganizationType));
  assert.ok(organizationType.enumValues.includes("personal"));
});

test("organization creation replaces a legacy personal type", () => {
  const organization = prepareOrganizationForCreation({
    id: "organization-id",
    name: "Julio Flores's Workspace",
    slug: "  Personal-ABC123  ",
    workspaceType: "personal",
  });

  assert.equal(organization.workspaceType, "event");
  assert.equal(organization.slug, "personal-abc123");
  assert.equal(organization.id, "organization-id");
  assert.equal(organization.name, "Julio Flores's Workspace");
});
