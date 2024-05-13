import icon from './icon.module.scss'
import { FC } from 'react'
import classNames from 'classnames'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'

export type ThemeProps =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'light'
  | 'dark'

export interface IconProps extends FontAwesomeIconProps {
  /** 指定的图标 */
  icon: IconProp
  /** 图标的颜色主题 */
  theme?: ThemeProps
}

/**
 * 提供了常用的图标集合, 基于 [react-fontawesome](https://github.com/FortAwesome/react-fontawesome)
 *
 * 支持 react-fontawesome 所有属性，可在 [这里](https://github.com/FortAwesome/react-fontawesome#basic) 查询
 *
 * 支持 font-awesome 所有免费的 solid 图标, 可在 [这里](https://fontawesome.com/icons?d=gallery&s=solid&m=free) 查询
 *
 * ### 引入方式
 * ~~~js
 * import { Icon } from '@zhongyangxun/knight'
 * ~~~
 */
export const Icon: FC<IconProps> = (props) => {
  // icon-primary
  const { className, theme, ...restProps } = props

  const classes = classNames(className, {
    [`icon-${theme}`]: theme
  })
  console.log('props',props)
  console.log('className',className)
  console.log('classNams',classes)
  return <FontAwesomeIcon className={icon[classes]} {...restProps} />
}

Icon.defaultProps = {
  theme: 'primary'
}

export default Icon
