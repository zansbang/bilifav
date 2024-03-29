import { ReactElement, Suspense } from 'react'
import Mousetrap from 'mousetrap'
import router from './router'
import { RouterProvider } from 'react-router-dom'

function App(): ReactElement | null {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  //键盘绑定事件
  Mousetrap.bind('4', () => {
    console.log('4')
  })
  Mousetrap.bind('ctrl+k', () => {
    console.log('ctrl+k')
  })
  Mousetrap.bind(['alt+k', 'ctrl+k'], () => {
    console.log('ctrl+k or alt+k')
  })
  Mousetrap.bind('g i', () => {
    console.log('g i')
  })

  return (
    <>
      <Suspense fallback={<div>Loading</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  )
}

export default App
