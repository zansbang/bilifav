import { ReactElement, Suspense } from 'react'
import router from './router'
import { RouterProvider } from 'react-router-dom'
import TitleBar from './components/TitleBar'

function App(): ReactElement | null {
  return (
    <>
      <TitleBar />
      <Suspense fallback={<div>Loading</div>}>
        <RouterProvider router={router} />
      </Suspense>
      {/*<SwitchTransition mode={'out-in'}>
        <CSSTransition timeout={500}>

        </CSSTransition>
      </SwitchTransition>*/}
    </>
  )
}

export default App
