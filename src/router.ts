import { createRouter } from '@tanstack/react-router'
import { routeTree } from './route-tree'
import { queryClient } from './query-client'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
