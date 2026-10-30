import type { RouteObject } from 'react-router'

// Paths are relative to /tracks/maintenance-tickets.
export const routes: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({ Component: (await import('./screens/HomeScreen')).HomeScreen }),
  },
]
