import { rootRoute } from './routes/root'
import { indexRoute } from './routes/index'
import { itemsLayoutRoute } from './routes/items/layout'
import { itemsIndexRoute } from './routes/items/index'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  itemsLayoutRoute.addChildren([itemsIndexRoute]),
])
