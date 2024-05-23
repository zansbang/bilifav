import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import { lazy } from 'react'

const modules = import.meta.glob('../views/**/*.tsx') as never

//Electron 下不能使用 createBrowserRouter
const global: Global = await window.api.getGlobal()
const routerConfig = [
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
  }
]
const router = global.isPackaged
  ? createHashRouter(routerConfig)
  : createBrowserRouter(routerConfig)

export default router
