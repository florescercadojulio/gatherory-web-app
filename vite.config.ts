import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), '')
  const environment = { ...fileEnvironment, ...process.env }
  const authHost = environment.BETTER_AUTH_URL
    ? new URL(environment.BETTER_AUTH_URL).hostname
    : undefined

  return {
    server: {
      allowedHosts: authHost ? [authHost] : [],
    },
    define: {
      'import.meta.env.VITE_APPLE_AUTH_ENABLED': JSON.stringify(
        Boolean(
          environment.APPLE_CLIENT_ID &&
          environment.APPLE_TEAM_ID &&
          environment.APPLE_KEY_ID &&
          environment.APPLE_PRIVATE_KEY
        )
      ),
      'import.meta.env.VITE_GOOGLE_AUTH_ENABLED': JSON.stringify(
        Boolean(environment.GOOGLE_CLIENT_ID && environment.GOOGLE_CLIENT_SECRET)
      ),
    },
    resolve: {
      alias: { '@': resolve(process.cwd(), 'src') },
      tsconfigPaths: true,
    },
    plugins: [
      devtools(),
      nitro({
        preset: 'node-server',
        rollupConfig: { external: [/^@sentry\//] },
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
  }
})

export default config
