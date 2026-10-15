import * as Sentry from '@sentry/tanstackstart-react'

// Keep instrumentation self-contained: it runs before the compiled server.
const redactTemplateLinkCredentials = (payload) =>
  payload == null
    ? payload
    : JSON.parse(JSON.stringify(payload).replace(/[0-9a-f]{64}/gi, '[redacted]'))

const sentryDsn = import.meta.env?.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
    tracesSampleRate: 0.1,
    beforeSend: redactTemplateLinkCredentials,
    beforeSendTransaction: redactTemplateLinkCredentials,
    beforeBreadcrumb: redactTemplateLinkCredentials,
  })
}
