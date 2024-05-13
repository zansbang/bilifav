import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'

const modules = import.meta.glob('../views/**/*.tsx') as any


const router = createBrowserRouter([
  {
    path: '/',
    Component: lazy(modules['../views/Index.tsx']),
    children: [
      {
        path: 'myview',
        Component: lazy(modules['../views/pages/MyView.tsx'])
      }
    ]
  },
  {
    path: '/login',
    Component: lazy(modules['../views/Login.tsx'])
  },
  {
    path: '/test',
    Component: lazy(modules['../views/pages/Test.tsx'])
  }
])

export default router
