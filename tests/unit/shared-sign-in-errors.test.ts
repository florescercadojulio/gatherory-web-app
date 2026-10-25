import { expect, test, vi } from 'vitest'
import { submitAuthForm } from '@/components/auth/auth-form'

test('shared sign-in submit exposes a rejected server action through the form server error state', async () => {
  const formState = {
    isValid: true,
    errorMap: { onServer: undefined as unknown },
  }
  const form = {
    state: formState,
    handleSubmit: vi.fn(async () => {
      throw new Error('Invalid email or password')
    }),
    setErrorMap: vi.fn((errorMap: { onServer?: { fields?: object; form?: unknown } }) => {
      const serverError = errorMap.onServer
      formState.errorMap.onServer =
        serverError && ('form' in serverError || Object.keys(serverError.fields ?? {}).length > 0)
          ? serverError
          : undefined
    }),
  }

  await expect(submitAuthForm(form as never, 'Sign-in failed')).resolves.toBe(false)
  expect(form.handleSubmit).toHaveBeenCalledOnce()
  expect(formState.errorMap.onServer).toMatchObject({
    fields: {},
    form: { message: 'Invalid email or password' },
  })
})
