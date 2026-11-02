import { z } from 'zod'

export const McpConnectionPostInputSchema = z
  .object({
    clientId: z.string().min(1).max(2_048),
    scopes: z.array(z.string().min(1).max(120)).max(20),
  })
  .strip()

export type McpConnectionPostInput = z.infer<typeof McpConnectionPostInputSchema>

export type McpConnection = {
  id: string
  clientId: string
  scopes: string[]
  updatedAt: string
  name: string | null
  icon: string | null
}

export type McpConnectionReduction =
  | { kind: 'missing' }
  | { kind: 'expansion' }
  | { kind: 'unchanged'; id: string; scopes: string[] }
  | { kind: 'updated'; id: string; scopes: string[]; updatedAt: Date }
