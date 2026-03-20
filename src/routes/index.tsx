import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './root'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        This is the frontend-stack-common template. Navigate to Items to see the CRUD example.
      </p>
    </div>
  ),
})
