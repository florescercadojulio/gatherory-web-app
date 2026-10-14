import { Fragment, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { authClient } from '@/lib/auth-client'

import {
  developmentSeedAccounts,
  loadSavedAccounts,
  newSavedAccount,
  saveAccounts,
  type SavedAccount,
} from './saved-accounts'
import { switchDevelopmentAccount } from './switch-account'

export function AccountSwitcher({ theme }: { theme: 'light' | 'dark' }) {
  const { data: session } = authClient.useSession()
  const { data: activeWorkspace } = authClient.useActiveOrganization()
  const { data: activeMembership } = authClient.useActiveMember()
  const [initial] = useState(() => {
    const seedAccounts = developmentSeedAccounts()
    try {
      const savedAccounts = loadSavedAccounts(window.localStorage)
      const seedIds = new Set(seedAccounts.map((account) => account.id))
      const accounts = [
        ...seedAccounts,
        ...savedAccounts.filter((account) => !seedIds.has(account.id)),
      ]
      return {
        accounts,
        error: '',
      }
    } catch {
      return {
        accounts: seedAccounts,
        error: 'Browser storage is unavailable. Account changes cannot be remembered.',
      }
    }
  })
  const [storageError, setStorageError] = useState(initial.error)
  const [busyId, setBusyId] = useState<string | null>(null)
  const switching = useRef(false)
  const [error, setError] = useState<{ id: string; message: string } | null>(null)
  const form = useForm({
    formId: 'devtools-saved-accounts',
    defaultValues: { accounts: initial.accounts },
    listeners: {
      onChange: ({ formApi }) => persist(formApi.state.values.accounts),
    },
  })

  function persist(accounts: SavedAccount[]) {
    try {
      saveAccounts(window.localStorage, accounts)
      setStorageError('')
    } catch {
      setStorageError('Browser storage is unavailable. Account changes cannot be remembered.')
    }
  }

  async function switchAccount(account: SavedAccount) {
    if (switching.current) return

    if (!account.email.trim() || !account.password) {
      setError({ id: account.id, message: 'Enter an email and password.' })
      return
    }

    switching.current = true
    setBusyId(account.id)
    setError(null)
    persist(form.state.values.accounts)
    let navigating = false

    try {
      const result = await switchDevelopmentAccount({
        email: account.email,
        password: account.password,
        href: window.location.pathname + window.location.search + window.location.hash,
      })

      if (!result.ok) {
        setError({ id: account.id, message: result.message })
        return
      }

      window.location.replace(result.destination)
      navigating = true
    } finally {
      if (!navigating) {
        switching.current = false
        setBusyId(null)
      }
    }
  }

  return (
    <TooltipProvider>
      <section
        aria-label="Development account switcher"
        className="h-full overflow-auto p-3 text-sm"
        style={{
          colorScheme: theme,
          backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
          color: theme === 'dark' ? '#fafafa' : '#171717',
        }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-medium">{session?.user.email ?? 'Not signed in'}</span>
          {activeWorkspace ? (
            <span className="opacity-70">
              {activeWorkspace.name} · {activeMembership?.role ?? 'member'}
            </span>
          ) : null}
          <span className="opacity-60">Development only</span>
        </div>

        {storageError ? (
          <p role="alert" className="mb-2 text-xs">
            {storageError}
          </p>
        ) : null}

        <form.Field name="accounts" mode="array">
          {(field) => (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-130 max-w-4xl text-left">
                  <caption className="sr-only">Saved development accounts</caption>
                  <thead className="text-xs opacity-70">
                    <tr className="border-b border-current/15">
                      <th scope="col" className="px-1 py-2 font-medium">
                        Email
                      </th>
                      <th scope="col" className="px-1 py-2 font-medium">
                        Password
                      </th>
                      <th scope="col" className="w-36 px-1 py-2 font-medium">
                        <span className="sr-only">Controls</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {field.state.value.map((account, index) => {
                      const current =
                        account.email.trim().toLowerCase() === session?.user.email.toLowerCase()
                      const update = (
                        change: Partial<Pick<SavedAccount, 'email' | 'password'>>
                      ) => {
                        field.handleChange(
                          field.state.value.map((row) =>
                            row.id === account.id ? { ...row, ...change } : row
                          )
                        )
                        if (error?.id === account.id) setError(null)
                      }

                      return (
                        <Fragment key={account.id}>
                          <tr
                            className="border-b border-current/10"
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Enter' &&
                                event.target instanceof HTMLInputElement
                              ) {
                                event.preventDefault()
                                void switchAccount(account)
                              }
                            }}
                          >
                            <td className="px-1 py-1.5">
                              <div className="flex items-center gap-2">
                                <Input
                                  aria-label={`Account ${index + 1} email`}
                                  type="email"
                                  autoComplete="off"
                                  value={account.email}
                                  disabled={busyId !== null}
                                  onChange={(event) => update({ email: event.target.value })}
                                  placeholder="Email"
                                  className="h-8 bg-transparent text-inherit ring-1 ring-current/25"
                                />
                                {current ? (
                                  <span className="text-xs opacity-70">Current</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-1 py-1.5">
                              <Input
                                aria-label={`Account ${index + 1} password`}
                                type="password"
                                autoComplete="off"
                                value={account.password}
                                disabled={busyId !== null}
                                onChange={(event) => update({ password: event.target.value })}
                                placeholder="Password"
                                className="h-8 bg-transparent text-inherit ring-1 ring-current/25"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  disabled={
                                    busyId !== null || !account.email.trim() || !account.password
                                  }
                                  onClick={() => void switchAccount(account)}
                                  aria-label={`Switch to ${account.email || `account ${index + 1}`}`}
                                >
                                  {busyId === account.id ? 'Switching…' : 'Switch'}
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        disabled={busyId !== null}
                                        aria-label={`Remove account ${index + 1}`}
                                        onClick={() => {
                                          field.handleChange(
                                            field.state.value.filter((row) => row.id !== account.id)
                                          )
                                          if (error?.id === account.id) {
                                            setError(null)
                                          }
                                        }}
                                      />
                                    }
                                  >
                                    <Trash2Icon />
                                  </TooltipTrigger>
                                  <TooltipContent>Remove account</TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                          {error?.id === account.id ? (
                            <tr>
                              <td colSpan={3} className="px-1 py-2">
                                <p
                                  role="alert"
                                  className={theme === 'dark' ? 'text-red-300' : 'text-red-700'}
                                >
                                  {error.message}
                                </p>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                disabled={busyId !== null}
                onClick={() => field.handleChange([...field.state.value, newSavedAccount()])}
              >
                <PlusIcon />
                Add account
              </Button>
            </>
          )}
        </form.Field>
      </section>
    </TooltipProvider>
  )
}
