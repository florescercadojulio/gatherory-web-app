import { z } from 'zod'

export const savedAccountsKey = 'gatherory:devtools:accounts:v1'

const SavedAccountSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  password: z.string(),
})

export type SavedAccount = z.infer<typeof SavedAccountSchema>

type AccountStorage = Pick<Storage, 'getItem' | 'setItem'>

export function developmentSeedAccounts(): SavedAccount[] {
  return [
    {
      id: 'gatherory-alex',
      email: 'planner@gatherory.test',
      password: 'password',
    },
    {
      id: 'gatherory-jordan',
      email: 'jordan@gatherory.test',
      password: 'password',
    },
    {
      id: 'gatherory-maya',
      email: 'coordinator@gatherory.test',
      password: 'password',
    },
    {
      id: 'gatherory-sam',
      email: 'guest@gatherory.test',
      password: 'password',
    },
  ]
}

export function newSavedAccount(): SavedAccount {
  return { id: crypto.randomUUID(), email: '', password: '' }
}

export function loadSavedAccounts(storage: Pick<AccountStorage, 'getItem'>): SavedAccount[] {
  const raw = storage.getItem(savedAccountsKey)
  if (!raw) return []

  try {
    const parsed = z
      .object({ version: z.literal(1), accounts: z.array(z.unknown()) })
      .safeParse(JSON.parse(raw))

    if (!parsed.success) return []

    const seen = new Set<string>()
    return parsed.data.accounts.flatMap((value) => {
      const account = SavedAccountSchema.safeParse(value)
      if (!account.success || seen.has(account.data.id)) return []

      seen.add(account.data.id)
      return [account.data]
    })
  } catch {
    return []
  }
}

export function saveAccounts(storage: Pick<AccountStorage, 'setItem'>, accounts: SavedAccount[]) {
  storage.setItem(savedAccountsKey, JSON.stringify({ version: 1, accounts }))
}
