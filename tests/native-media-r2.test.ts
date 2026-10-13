import assert from "node:assert/strict"
import { test } from "node:test"
import { eq, inArray } from "drizzle-orm"

/** Explicit opt-in: local API/database and only the existing private DEV
 * bucket. All fixture rows and the exact temporary objects are cleaned up. */
test("native image bytes, metadata, finalize, download, and retry round-trip through dev R2", {
  skip: process.env.RUN_R2_MEDIA_TESTS !== "1", timeout: 60_000,
}, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname))
  assert.equal(process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME, "gatherory-private-dev", "Never run this test on production storage")
  const base = process.env.INVITATION_TEST_BASE_URL ?? "http://127.0.0.1:3003"
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  const { db, pool } = await import("../src/db")
  const { user, session, organization, event, eventParticipant, workspacePerson, mediaAsset } = await import("../src/db/schema")
  const { inspectMediaObject, deleteMediaObject } = await import("../src/server/media/connectors/media-storage.con")
  const suffix = crypto.randomUUID()
  const owner = `media-r2-owner-${suffix}`
  const stranger = `media-r2-stranger-${suffix}`
  const org = `media-r2-org-${suffix}`
  const scopeId = crypto.randomUUID()
  const tokens = [crypto.randomUUID(), crypto.randomUUID()]
  const objects = new Map<string, { bucket: string; key: string }>()
  // A tiny PNG, not a user's image. No photo processing or external fixtures.
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6dEAAAAAASUVORK5CYII=", "base64")
  async function api(path: string, body: unknown, actor = 0) {
    const response = await fetch(`${base}/api/media/native/${path}`, {
      method: "POST", headers: { Authorization: `Bearer ${tokens[actor]}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return { status: response.status, json: await response.json() }
  }
  async function prepare(id: string, actor = 0) {
    return api("prepare", { scopeId: scopeId.toUpperCase(), mediaAssetId: id.toUpperCase(),
      originalFilename: "r2-verification.png", contentType: "image/png", byteSize: bytes.length }, actor)
  }
  async function uploadAndVerify(id: string) {
    const prepared = await prepare(id)
    assert.equal(prepared.status, 200, "Authenticated prepare must succeed")
    assert.equal(prepared.json.ok, true)
    assert.equal(prepared.json.data.requiredHeaders["x-amz-meta-mediaassetid"], id)
    assert.equal(prepared.json.data.requiredHeaders["Content-Type"], "image/png")
    assert.equal(prepared.json.data.requiredHeaders["Cache-Control"], "private, no-store")
    const signed = new URL(prepared.json.data.uploadUrl)
    const signedHeaders = signed.searchParams.get("X-Amz-SignedHeaders")!.split(";")
    for (const header of ["x-amz-meta-mediaassetid", "content-type", "cache-control"]) {
      assert.ok(signedHeaders.includes(header), `${header} must be signed`)
    }
    assert.equal(signed.searchParams.has("x-amz-meta-mediaassetid"), false, "Metadata must be sent as a header")
    const [asset] = await db.select().from(mediaAsset).where(eq(mediaAsset.id, id))
    assert.equal(asset.organizationId, org)
    assert.equal(asset.bucket, "gatherory-private-dev")
    assert.equal(asset.storageKey, `workspaces/${org}/media/${id}/original.png`)
    const target = { bucket: asset.bucket, key: asset.storageKey }
    objects.set(id, target)
    const rejected = await fetch(prepared.json.data.uploadUrl, {
      method: "PUT", headers: { ...prepared.json.data.requiredHeaders, "x-amz-meta-mediaassetid": crypto.randomUUID() }, body: bytes,
    })
    assert.equal(rejected.status, 403, "The signed asset-ID header cannot be substituted")
    const upload = await fetch(prepared.json.data.uploadUrl, {
      method: prepared.json.data.method, headers: prepared.json.data.requiredHeaders, body: bytes,
    })
    assert.equal(upload.status, 200, "The signed PUT must accept the exact returned headers")
    const stored = await inspectMediaObject(target)
    assert.equal(stored.byteSize, bytes.length)
    assert.equal(stored.contentType, "image/png")
    assert.equal(stored.mediaAssetId, id, "R2 must persist the signed asset-ID metadata")
    const finalized = await api("finalize", { mediaAssetId: id.toUpperCase() })
    assert.equal(finalized.status, 200, "Finalize must validate the stored metadata")
    assert.equal(finalized.json.ok, true)
    assert.equal(finalized.json.data.mediaAssetId, id)
    const download = await fetch(finalized.json.data.url)
    assert.equal(download.status, 200)
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes)
    const [ready] = await db.select().from(mediaAsset).where(eq(mediaAsset.id, id))
    assert.equal(ready.status, "ready")
    assert.equal((await api("finalize", { mediaAssetId: id })).status, 200, "Finalization retries are idempotent")
    assert.equal((await api("finalize", { mediaAssetId: id }, 1)).json.ok, false, "Another account cannot finalize this asset")
    assert.equal((await prepare(id)).json.ok, false, "A ready asset cannot be overwritten through preparation")
  }
  try {
    await db.insert(user).values([owner, stranger].map((id) => ({ id, name: "R2 verification", email: `${id}@example.com`, emailVerified: true })))
    await db.insert(session).values([owner, stranger].map((userId, index) => ({ id: crypto.randomUUID(), token: tokens[index], userId,
      expiresAt: new Date(Date.now() + 3600_000), updatedAt: new Date() })))
    await db.insert(organization).values({ id: org, name: "R2 verification", slug: org, workspaceType: "event", createdAt: new Date() })
    await db.insert(event).values({ id: scopeId, organizationId: org, title: "R2 verification", status: "draft", startsAt: new Date(), timeZone: "America/Detroit" })
    const people = await db.insert(workspacePerson).values([owner, stranger].map((userId) => ({ organizationId: org, userId, displayName: "R2 verification" }))).returning()
    await db.insert(eventParticipant).values(people.map((person) => ({ eventId: scopeId, personId: person.id,
      role: person.userId === owner ? "host" as const : "guest" as const,
      planningPermission: person.userId === owner ? "manage" as const : "view_only" as const })))
    await uploadAndVerify(crypto.randomUUID())

    const retryId = crypto.randomUUID()
    assert.equal((await prepare(retryId)).status, 200)
    await db.update(mediaAsset).set({ status: "failed" }).where(eq(mediaAsset.id, retryId))
    assert.equal((await prepare(retryId, 1)).json.ok, false, "A guest cannot reopen a failed upload")
    await uploadAndVerify(retryId)

    // Signed headers do not replace finalization's exact byte-size validation.
    const mismatchId = crypto.randomUUID()
    const mismatch = await prepare(mismatchId)
    assert.equal(mismatch.json.ok, true)
    const [pending] = await db.select().from(mediaAsset).where(eq(mediaAsset.id, mismatchId))
    const target = { bucket: pending.bucket, key: pending.storageKey }
    objects.set(mismatchId, target)
    const badUpload = await fetch(mismatch.json.data.uploadUrl, {
      method: "PUT", headers: mismatch.json.data.requiredHeaders, body: bytes.subarray(0, -1),
    })
    assert.equal(badUpload.status, 200)
    assert.equal((await api("finalize", { mediaAssetId: mismatchId })).json.ok, false)
    assert.equal((await db.select().from(mediaAsset).where(eq(mediaAsset.id, mismatchId)))[0].status, "failed")
    await assert.rejects(() => inspectMediaObject(target), (error: unknown) =>
      typeof error === "object" && error !== null && "$metadata" in error &&
      (error.$metadata as { httpStatusCode?: number })?.httpStatusCode === 404)
    await uploadAndVerify(mismatchId)
  } finally {
    // No recursive/list deletion: only keys created and checked by this test.
    try {
      for (const object of objects.values()) {
        await deleteMediaObject(object)
        await assert.rejects(() => inspectMediaObject(object), (error: unknown) =>
          typeof error === "object" && error !== null && "$metadata" in error &&
          (error.$metadata as { httpStatusCode?: number })?.httpStatusCode === 404)
      }
    } finally {
      await db.delete(organization).where(eq(organization.id, org))
      await db.delete(user).where(inArray(user.id, [owner, stranger]))
      await pool.end()
    }
  }
})
