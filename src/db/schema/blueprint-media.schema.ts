import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth.schema'

export type BlueprintCoverVariant = 'thumbnail' | 'card' | 'hero'
export type BlueprintCoverVariantObject = { storageKey: string; width: number; height: number }
export type BlueprintCoverVariantKeys = Record<BlueprintCoverVariant, BlueprintCoverVariantObject>

/** User-owned immutable covers used by Blueprint drafts and publications.
 * These assets are intentionally separate from organization-scoped event media
 * until a Blueprint is installed into a recipient workspace.
 */
export const blueprintCoverAsset = pgTable(
  'blueprint_cover_asset',
  {
    id: uuid('id').primaryKey(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').default('pending').notNull(),
    processingToken: uuid('processing_token'),
    storageProvider: text('storage_provider').default('r2').notNull(),
    bucket: text('bucket').notNull(),
    originalStorageKey: text('original_storage_key').notNull(),
    uploadStorageKey: text('upload_storage_key').notNull(),
    variantStorageKeys: jsonb('variant_storage_keys').$type<BlueprintCoverVariantKeys>(),
    originalFilename: text('original_filename').notNull(),
    contentType: text('content_type').default('image/jpeg').notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    width: integer('width'),
    height: integer('height'),
    checksum: text('checksum'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('blueprint_cover_asset_original_storage_key_uidx').on(table.originalStorageKey),
    uniqueIndex('blueprint_cover_asset_upload_storage_key_uidx').on(table.uploadStorageKey),
    index('blueprint_cover_asset_owner_status_idx').on(table.ownerUserId, table.status),
    check(
      'blueprint_cover_asset_status_check',
      sql`${table.status} in ('pending','processing','ready','failed','deleted')`
    ),
    check('blueprint_cover_asset_bytes_check', sql`${table.byteSize} > 0`),
    check(
      'blueprint_cover_asset_dimensions_check',
      sql`(${table.width} is null or ${table.width} > 0) and (${table.height} is null or ${table.height} > 0)`
    ),
  ]
)
