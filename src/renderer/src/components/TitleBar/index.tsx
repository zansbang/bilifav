import { ReactElement, useState } from 'react'
import titleBarStyles from './titlebar.module.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function TitleBar(): ReactElement | null {
  const [isMaximized, setIsMaximized] = useState(false)
  // const startMove = useRef(false)
  // const winXY = useRef({ x: 0, y: 0 })

  function ctrlWindow(type: string): void {
    switch (type) {
      case 'min':
        window.api.minWindow()
        break
      case 'max':
        setIsMaximized(true)
        window.api.maxWindow()
        break
      case 'close':
        window.api.closeWindow()
        break
      case 'restore':
        setIsMaximized(false)
        window.api.restoreWindow()
        break
      default:
    }
  }

/*
  async function handleMouseDown(e: any): void {
    startMove.current = true
    console.log('window.api.getWindowXY()',await window.api.getWindowXY())
    winXY.current = await window.api.getWindowXY()
  }
  function handleMouseMove(e: any): void {
    if(startMove.current){
      window.api.moveWindow(e.screenX - winXY.current.x, e.screenY - winXY.current.y)
    }
  }
  function handleMouseUp(e: any): void {
    startMove.current = false
  }
  function handleDblClick(e: any): void {}
*/


  return (
    <div
      className={`${titleBarStyles['titleBar']} flex justify-between items-center pl-5 pr-5 h-[40px]`}
      // onMouseDown={(e) => handleMouseDown(e)}
      // onMouseMove={(e) => handleMouseMove(e)}
      // onMouseUp={(e) => handleMouseUp(e)}
      // onDoubleClick={(e) => handleDblClick(e)}
    >
      <div className=""></div>
      <div className="space-x-4">
        <FontAwesomeIcon icon="minus" className="hover:text-emerald-600" onClick={()=> ctrlWindow('min')} />
        {isMaximized ? (
          <FontAwesomeIcon
            icon="window-restore"
            className="hover:text-emerald-600"
            onClick={() => ctrlWindow('restore')}
          />
        ) : (
          <FontAwesomeIcon icon={['far','square']} className="hover:text-emerald-600" onClick={()=> ctrlWindow('max')} />
        )}
        <FontAwesomeIcon icon="xmark" className="hover:text-emerald-600" onClick={()=> ctrlWindow('close')} />
      </div>
    </div>
  )
}

export default TitleBar
