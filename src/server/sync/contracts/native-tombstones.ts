/** Payload is ignored when applying a delete on iOS. The reason lets the server
 * distinguish a permanently removed account from an ordinary editable record.
 * No account ID or other personal data is retained in this marker.
 */
export const deletedAccountTombstone = Buffer.from(
  JSON.stringify({ reason: 'account_deleted' })
).toString('base64')
