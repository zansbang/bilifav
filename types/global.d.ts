interface Window {
  /** 进程通信自定义接口 */
  api: {
    /** 设置全局参数 */
    setGlobal: (...args: never) => void
    /** 获取全局参数 */
    getGlobal: () => Promise<void>
    /** 获取cookie */
    getCookie: () => Promise<BiliCookie>
    /** 清除全部cookie */
    cleanCookie: () => void
    /** 设置数据到本地数据库 */
    setData: (data: DbReq) => void
    /** 从本地数据库获取数据 */
    getData: (data: DbReq) => Promise<DbReq>
    showData: () => void
    /** 获取本地保存的封面图片 */
    getLocalCover: (fileName: string) => Promise<string>
    /** 保存封面图片到本地 */
    setLocalCover: (fileName: string, base64Data: string) => void
    /** 在worker线程中执行图片请求及保存操作 */
    saveAllCovers: (data: DbReq) => void
    /** 最大化窗口 */
    maxWindow: () => void
    /** 最小化窗口 */
    minWindow: () => void
    /** 关闭窗口 */
    closeWindow: () => void
    /** 恢复窗口 */
    restoreWindow: () => void
    /** 获取鼠标位置 */
    getWindowXY: () => Promise<{ x: number; y: number }>
    /** 移动窗口 */
    moveWindow: (x, y) => void
    /** 播放bv */
    playBV: (bvId: string) => void
  }
}
