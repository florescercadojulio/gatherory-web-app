import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/.well-known/apple-app-site-association')({
  server: {
    handlers: {
      // Apple's association format must not be wrapped in a ServerResult envelope.
      GET: () =>
        Response.json(
          {
            applinks: {
              details: [
                {
                  appIDs: ['LW97NHT3JA.com.guide-systems.gatherory'],
                  components: [
                    { '/': '/join/*', comment: 'Gatherory event invitations' },
                    { '/': '/templates/shared/*', comment: 'Gatherory reusable template previews' },
                  ],
                },
              ],
            },
          },
          { headers: { 'Cache-Control': 'public, max-age=3600' } }
        ),
    },
  },
})
