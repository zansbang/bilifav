import { Button, Chip } from '@nextui-org/react'
import { ReactElement, useContext, useState, createContext } from 'react'
import router from '../../router'

const ViewContext = createContext(null)

function Test(): ReactElement | null {
  console.log('Test')
  const [p3, setP3] = useState('')

  const RenderComponent2 = (props): ReactElement => {
    console.log('Render Component2')
    console.log('Render Component2 props', props)
    const renderContext2 = useContext(ViewContext)
    console.log('Render Component2 renderContext2', renderContext2)
    return (
      <>
        <div>RenderComponent2</div>
{/*        <Button onPress={() => {
          renderContext2.setP2(new Date().toLocaleString())
        }}>更新P2状态</Button>*/}
      </>
    )
  }


  const RenderComponent = ({ children }): ReactElement => {
    console.log('Render Component')
    const [p1, setP1] = useState('')
    const [p2, setP2] = useState('')

    return (
      <>
        <Button onPress={() => {
          setP1(new Date().toLocaleString())
        }}>更新P1状态</Button>
        <div>RenderComponent</div>

          {children}


      </>
    )
  }


  return (
    <>
      <Chip color="primary">我是首页的子页面 - 测试组件重渲染</Chip>
      <Button onPress={() => {
        router.navigate('/login')
      }}>去登陆页</Button>
      <Button onPress={() => {
        setP3(new Date().toLocaleString())
      }}>更新P3状态</Button>

      <RenderComponent key={'p1'}><ViewContext.Provider value={{ p3 }}><RenderComponent2 /></ViewContext.Provider></RenderComponent>

    </>
  )
}

export default Test
