import { Button, Chip } from '@nextui-org/react'
import { ReactElement } from 'react'
import router from '../../router'
function MyView(): ReactElement | null {
  return (
    <>
      <Chip color="primary">我是首页的子页面</Chip>
      <Button onPress={()=>{router.navigate("/login")}}>去登陆页</Button>
    </>
  )
}

export default MyView
