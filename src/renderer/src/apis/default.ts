import req from '../utils/req'

const apis = {
  /**
   * 检查是否需要刷新Cookie
   * @return CheckRefreshResult
   */
  checkRefresh: <T>(): Promise<T> => req.get('https://passport.bilibili.com/x/passport-login/web/cookie/info'),
  /**
   * 获取refresh_csrf
   * @path correspondPath
   */
  getRefreshCSRF: <T>(path: string): Promise<T> => req.get('https://www.bilibili.com/correspond/1/',{},{},path),
  /**
   * 获取新的cookie
   * @param params 请求参数 {@link RefreshCookieParams}
   * @return RefreshCookieResult
   */
  refreshCookie: <T, R>(params: R): Promise<T> => req.post('https://passport.bilibili.com/x/passport-login/web/cookie/refresh',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 确认刷新,让旧的cookie失效
   * @param params 请求参数 {@link ConfirmRefreshParams}
   */
  confirmRefresh: <T, R>(params: R): Promise<T> => req.post('https://passport.bilibili.com/x/passport-login/web/confirm/refresh',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 生成登录二维码
   */
  qrGenerate: <T>(): Promise<T> => req.get('https://passport.bilibili.com/x/passport-login/web/qrcode/generate'),
  /**
   * 扫码登陆
   * @param params 请求参数 {@link QrPollParams}
   */
  qrPoll: <T, R>(params: R): Promise<T> => req.get('https://passport.bilibili.com/x/passport-login/web/qrcode/poll', params),
  /**
   * 注销登录
   * @param params 请求参数 {@link LogoutParams}
   */
  logout: <T, R>(params: R): Promise<T> => req.post('https://passport.bilibili.com/login/exit/v2', params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 用户信息,仅可Cookie（SESSDATA）
   */
  userInfo: <T>(): Promise<T> => req.get('https://api.bilibili.com/x/web-interface/nav'),
  /**
   * 根据用户ID获取所有收藏夹
   * @param params 请求参数 {@link FavInfoListParams}
   */
  getFavAllByMid: <T, R>(params: R): Promise<T> => req.get('https://api.bilibili.com/x/v3/fav/folder/created/list-all', params),
  /**
   * 根据收藏夹ID获取收藏的视频
   */
  getFavByFid: <T, R>(params: R): Promise<T> => req.get('https://api.bilibili.com/x/v3/fav/resource/list',params),
  /**
   * 新建收藏夹
   */
  addFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/folder/add',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 编辑收藏夹
   */
  editFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/folder/edit',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 删除收藏夹
   */
  delFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/folder/del',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 批量复制收藏夹里的内容
   */
  copyFromFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/resource/copy',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 批量移动收藏夹里的内容
   */
  moveFromFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/resource/move',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 批量删除收藏夹里的内容
   */
  batchDelFromFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/resource/batch-del',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}}),
  /**
   * 清理失效视频
   * @param params 请求参数 {@link CleanFromFavParams}
   */
  cleanFromFav: <T, R>(params: R): Promise<T> => req.post('https://api.bilibili.com/x/v3/fav/resource/clean',params,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}})
}
export default apis
