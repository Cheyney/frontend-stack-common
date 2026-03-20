import { createRoute, Outlet } from '@tanstack/react-router'
import { rootRoute } from '../root'

export const itemsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'items',
  component: () => <Outlet />,
})
