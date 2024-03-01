import { Button, Chip } from '@nextui-org/react'
import { ReactElement, Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import router from '../router'
function Index(): ReactElement | null {
  useEffect(()=>{
    console.log('useEffect')
    router.navigate("/myview")
  })

  return (
    <>
      <Chip color="primary">我是首页</Chip>
      <Button onPress={()=>{router.navigate("/login")}}>去登陆页</Button>
      <Suspense fallback={<div>Loading2</div>}>
        <Outlet />
      </Suspense>
    </>
  )
}

export default Index
