/**
 * B站Cookie
 * @member bili_jct csrf_token
 */
interface BiliCookie {
  DedeUserID: number | string
  DedeUserID__ckMd5: string
  SESSDATA: string
  bili_jct: string
  sid: string
}

/**
 * 检查是否需要刷新Cookie返回结果
 * @member refresh 是否应该刷新 Cookie, true:需要, false:不需要
 * @member timestamp 当前毫秒时间戳, 用于获取 refresh_csrf
 */
interface CheckRefreshResult {
  refresh: boolean
  timestamp: number
}

/**
 * 获取新cookie请求参数
 * @member csrf 位于 Cookie 中的bili_jct字段
 * @member refresh_csrf 实时刷新口令,通过 getRefreshCSRF 获得
 * @member source 访问来源,一般为main_web
 * @member refresh_token 持久化刷新口令,localStorage 中的ac_time_value字段，在登录成功后返回并保存
 */
interface RefreshCookieParams {
  csrf: string
  refresh_csrf: string
  source: string | 'main_web'
  refresh_token: string
}

/**
 * 获取新cookie返回结果
 * @member status 0
 * @member message 空
 * @member refresh_token 新的持久化刷新口令,将存储于 localStorage 中的ac_time_value字段，以便下次使用
 */
interface RefreshCookieResult {
  status: number
  message: string
  refresh_token: string
}

/**
 * 确认刷新cookie请求参数
 * @member csrf 从新的 cookie 中获取，位于 Cookie 中的bili_jct字段
 * @member refresh_token 在刷新前 localStorage 中的ac_time_value获取，并非刷新后返回的值
 */
interface ConfirmRefreshParams {
  csrf: string
  refresh_token: string
}

/**
 * 二维码生成返回结果
 * @member url 二维码内容 (登录页面 url)
 * @member qrcode_key 扫码登录秘钥 (恒为32字符)
 */
interface QrGenerateResult {
  url: string
  qrcode_key: string
}

/**
 * 扫码登陆返回结果
 * @member url 游戏分站跨域登录 url,未登录为空
 * @member refresh_token 未登录为空
 * @member timestamp 登录时间, 未登录为0 时间戳 单位为毫秒
 * @member code 扫码登陆返回状态码 {@link QrPollCodeEnum}
 * @member message 扫码状态信息
 */
interface QrPollResult {
  url?: string
  refresh_token: string
  timestamp: number
  code: number
  message: string
}

/**
 * 扫码登陆请求参数
 * @member qrcode_key 二维码生成里的key
 */
interface QrPollParams {
  qrcode_key: string
}

/**
 * 退出登录请求参数
 * @member biliCSRF CSRF Token (位于 cookie 中的 bili_jct)
 * @member gourl 成功后跳转到的页面
 */
interface LogoutParams {
  biliCSRF: string
  gourl?: string
}

/**
 * @description 用户信息返回结果
 */
interface UserInfoResult {
  isLogin: string
  email_verified: number
  face: string
  level_info: string
  mid: number
  mobile_verified: number
  moral: number
  pendant: UserInfoPendant
  uname: string
  vipStatus: number
  vipType: number
  vip_pay_type: number
  vip_label: UserInfoVipLabel
  vip_nickname_color: string
  wbi_img: UserInfoWBIIMG //Wbi 签名实时口令,该字段即使用户未登录也存在
}

interface UserInfoPendant {
  pid: number
  name: string
  image: string
  expire: number
}

interface UserInfoVipLabel {
  path: string
  text: string
  label_theme: string
}

interface UserInfoWBIIMG {
  img_url: string
  sub_url: string
}

/**
 * 获取指定用户创建的所有收藏夹信息
 */
interface FavInfoList {
  /** 创建的收藏夹总数 */
  count: number
  /** 创建的收藏夹列表 */
  list: Array<FavInfo>
  season: NonNullable<unknown>
}

interface FavInfo {
  /** 收藏夹mlid（完整id）,收藏夹原始id+创建者mid尾号2位 */
  id: number
  /** 收藏夹原始id */
  fid: number
  /** 创建者mid */
  mid: number
  attr: number
  /** 收藏夹标题 */
  title: string
  /** 目标id是否存在于该收藏夹 */
  fav_state: number
  /** 收藏夹内容数量 */
  media_count: number
  /** 分页总数 */
  pageCount: number
  /** 收藏视频列表 */
  media_list: Array<FavVideoInfo>
}

type FavVideosListCache = Map<number | string, FavInfo>
type FavVideoInfoCacheObject = {
  [key: string]: FavInfo
}

type FavVideoInfoListObject = {
  [key: string]: FavVideoInfo[]
}

type FavVideosInfoListCache =
  | FavVideosListCache
  | FavVideoInfoListObject
  | { id: string; allVideos: FavVideoInfo[] }

interface FavInfoListParams {
  /** 目标用户mid */
  up_mid: number
  /** 目标内容属性 0(默认):全部 2:视频稿件*/
  type?: 0 | 2
  /** 目标内容id 视频稿件：视频稿件avid */
  rid?: number
}

/**
 * 根据收藏夹ID获取收藏夹信息
 */
interface FavInfoMore {
  /** 收藏夹元数据 */
  info: FavInfoMeta
  /** 收藏夹内容 */
  medias: Array<FavVideoInfo>
  /** 收藏夹是否有下一页 */
  has_more: boolean
  /** 接口返回时间 */
  ttl: number
}

/**
 * 收藏夹元数据
 */
interface FavInfoMeta {
  /** 收藏夹mlid（完整id）	收藏夹原始id+创建者mid尾号2位 */
  id: number
  /** 收藏夹原始id */
  fid: number
  /** 创建者mid */
  mid: number
  /** 属性 0：正常,1：失效*/
  attr: number
  /** 收藏夹标题 */
  title: string
  /** 收藏夹封面图片url */
  cover: string
  /** 创建者信息 */
  upper: FavInfoMetaUpper
  /** 封面图类别 */
  cover_type: number
  /** 收藏夹状态数 */
  cnt_info: FavInfoMetaCntInfo
  /** 类型 */
  type: number
  /** 备注 */
  intro: string
  /** 创建时间 */
  ctime: number
  /** 收藏时间 */
  mtime: number
  /** 状态 */
  state: number
  /** 收藏夹收藏状态 */
  fav_state: number
  /** 点赞状态 */
  like_state: number
  /** 收藏夹内容数量 */
  media_count: number
}

/** 收藏的视频信息 */
interface FavVideoInfo {
  id: number
  /** 内容类型 */
  type: number
  /** 标题 */
  title: string
  /** 封面url */
  cover: string
  /** 简介 */
  intro: string
  /** 视频分P数 */
  page: number
  /** 音频/视频时长 */
  duration: number
  /** 创建者信息 */
  upper: FavInfoMetaUpper
  attr: number
  cnt_info: object
  /** 跳转uri */
  link: string
  /** 投稿时间 */
  ctime: number
  /** 发布时间 */
  pubtime: number
  /** 收藏时间 */
  fav_time: number
  /** 视频稿件bvid */
  bv_id: string
  /** 视频稿件bvid */
  bvid: string
  /** 是否已经失效 */
  baned: boolean
  /** base64 图片 */
  coverStr: string
}

/** 创建者信息 */
interface FavInfoMetaUpper {
  /** 创建者mid */
  mid: number
  /** 创建者昵称 */
  name: string
  /** 创建者头像url */
  face: string
  /** 是否已关注创建者 */
  followed: boolean
  /** 会员类别 */
  vip_type: number
  /** 会员开通状态 */
  vip_statue: number
}

/** 收藏夹状态数 */
interface FavInfoMetaCntInfo {
  /** 收藏数 */
  collect: number
  /** 播放数 */
  play: boolean
  /** 点赞数 */
  thumb_up: number
  /** 分享数 */
  share: number
  /** 弹幕数 */
  danmaku: number
}

interface FavVideoInfoParams {
  /** 目标收藏夹mlid（完整id） */
  media_id: React.Key
  /** 分区tid 默认为全部分区(0)*/
  tid?: number
  /** 搜索关键字 */
  keyword?: string
  /** 排序方式 按收藏时间:mtime,按播放量: view,按投稿时间：pubtime*/
  order?: 'mtime' | 'view' | 'pubtime'
  /** 查询范围 ,0：当前收藏夹（对应media_id）,1：全部收藏夹 */
  type?: 0 | 1
  /** 每页数量 最大20*/
  ps: number
  /** 页码,默认1 */
  pn?: number
  /** 可为web（影响内容列表类型 */
  platform?: string
}

/**
 * 清空失效视频请求参数
 * @member media_id 目标收藏夹id
 * @member csrf CSRF Token（位于cookie）,bili_jct 就是csrftoken
 */
interface CleanFromFavParams {
  media_id: number
  csrf: string
}

/**
 * 移动/复制收藏夹视频请求参数
 * @member src_media_id 源收藏夹id
 * @member tar_media_id 目标收藏夹id
 * @member mid 用户mid
 * @member resource 视频id:类型id,视频id:类型id
 * @member platform 可选参数,移动/复制的平台 web/app/h5/android/ios/pc/tv,默认web
 * @member csrf CSRF Token（位于cookie）,bili_jct 就是csrftoken
 */
interface MoveCopyFromFavParams {
  src_media_id: number
  tar_media_id: number
  mid: number
  resources: string
  platform?: string
  csrf: string
}

/**
 * 删除收藏视频请求参数
 * @member media_id 目标收藏夹id
 * @member resources 视频id:类型id,视频id:类型id
 * @member platform 可选参数,移动/复制的平台 web/app/h5/android/ios/pc/tv,默认web
 * @member csrf CSRF Token（位于cookie）,bili_jct 就是csrftoken
 */
interface DelFromFavParams {
  media_id: number
  resources: string
  platform?: string
  csrf: string
}
