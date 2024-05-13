/**
 * 扫码登陆返回状态码
 * @member SUCCESS 扫码登录成功
 * @member EXPIRES 二维码已过期
 * @member UNSCAN 未扫码
 * @member UNCONFIRM 已扫码,等待确认
 */
export enum QrPollCodeEnum {
  /** 扫码登录成功 */
  SUCCESS = 0,
  /** 二维码已过期 */
  EXPIRES = 86038,
  /** 未扫码 */
  UNSCAN = 86101,
  /** 已扫码,等待确认 */
  UNCONFIRM = 86090
}

/**
 * 请求返回状态码
 * @member SUCCESS 请求成功
 * @member UNLOGIN 未登录
 * @member BAN 账号被封禁
 * @member CSRF csrf鉴权失败
 */
export enum BiliCodeStatus {
  SUCCESS = 0,
  UNLOGIN = -101,
  BAN = -102,
  CSRF = -111
}
