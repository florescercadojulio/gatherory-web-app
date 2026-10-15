import '@tanstack/react-start/server-only'
import { createHash, randomBytes } from 'node:crypto'

export const newBlueprintShareToken = () => randomBytes(32).toString('hex')
export const hashBlueprintShareToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')
