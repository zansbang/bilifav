import { ReactElement, useState } from 'react'

function Versions(props:any): ReactElement | null {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className="versions">
      <li>{props.info}</li>
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
