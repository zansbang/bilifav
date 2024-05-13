import { FC, ReactElement } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import Icon from '../Icon/icon'
import message from './message.module.css'

export type MessageType = 'info' | 'success' | 'danger' | 'warning'

export interface MessageProps {
  text: string
  type: MessageType
}

const Message: FC<MessageProps> = (props: MessageProps) => {
  const { text, type } = props

  const renderIcon = (messageType: MessageType): ReactElement => {
    let messageIcon: IconProp

    switch (messageType) {
      case 'success':
        messageIcon = 'check-circle'
        break
      case 'danger':
        messageIcon = 'times-circle'
        break
      case 'warning':
        messageIcon = 'exclamation-circle'
        break
      case 'info':
      default:
        messageIcon = 'info-circle'
        break
    }

    return <Icon icon={messageIcon} theme={messageType} />
  }

  return (
    <div className={message.message} data-testid="reqWorker-message">
      <div className={message['message-content']}>
        <div className={message.icon}>{renderIcon(type)}</div>
        <div className="text">{text}</div>
      </div>
    </div>
  )
}

export default Message
