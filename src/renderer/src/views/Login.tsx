import { Button, Chip } from '@nextui-org/react'
import { ReactElement } from 'react'
import router from '../router'

function Login(): ReactElement | null {
  return (
    <>
      <Chip color="primary">我是登录页</Chip>
      <Button onPress={()=>{router.navigate("/")}}>去首页</Button>
    </>
  )
}

export default Login
