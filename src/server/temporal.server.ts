import '@tanstack/react-start/server-only'

// Use one explicit implementation on every server runtime. Do not patch globals
// or pull calendar arithmetic into browser-safe contracts.
export { Temporal } from '@js-temporal/polyfill'
