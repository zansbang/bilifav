import {
  Avatar,
  Button,
  Card,
  CardFooter,
  Checkbox,
  CheckboxGroup,
  Chip,
  CircularProgress,
  Divider,
  Image,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollShadow,
  Select, Selection,
  SelectItem,
  Tooltip
} from '@nextui-org/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MutableRefObject, ReactElement, useEffect, useRef, useState } from 'react'
import getCorrespondPath from '../utils/crypto'
import apis from '../apis/default'
import router from '../router'
import { BiliCodeStatus } from '../utils/constans'
import message from '../components/Message'

function Index(): ReactElement | null {
  console.log('Index')
  /** 用户头像 */
  const [face, setFace] = useState('')
  /** 收藏分类列表 */
  const [favList, setFavList] = useState<FavInfo[]>([])
  /** 选中的收藏分类ids */
  const [selectedKeys, setSelectedKeys] = useState<Set<number>|Set<string>|Selection>(new Set([]))
  /** 当前选中的单个收藏分类id */
  const curFavId = useRef<number>()
  const [curFavTitle, setCurFavTitle] = useState<string>('')
  const curFavTitleBak = useRef<string>()
  /** 复制/移动的目标收藏分类ids */
  const [selectedFavKeys, setSelectedFavKeys] = useState<Selection>(new Set([]))
  /** 收藏视频列表 */
  const [favVideoList, setFavVideoList] = useState<FavVideoInfo[]>([])
  /** 收藏视频列表加载状态 */
  const [favVideoListLoaded, setFavVideoListLoaded] = useState(false)
  /** 弹窗是否打开 */
  const [isOpen, setIsOpen] = useState<boolean>(false)
  /** 操作类型 'move' | 'copy' | 'add' | 'edit' */
  const [ctrlState, setCtrlState] = useState<string>('')
  /** 用户信息 */
  const useInfo = useRef<UserInfoResult>()
  /** 所有收藏分类及视频信息缓存 */
  const fav_videos_list_cache = useRef<FavVideosListCache>(new Map())
  /** 选中的视频id */
  const [checked, setChecked] = useState<string[]>([])
  /** cookie信息 */
  const cookies = useRef<BiliCookie>()
  /** 选中的目标收藏夹 */
  const favListSelected = useRef<number>()
  /** 收藏视频操作按钮是否禁用 */
  const [btnDisabled, setBtnDisabled] = useState<boolean>(true)
  /** 收藏分类操作按钮是否禁用 */
  const [favBtnDisabled, setFavBtnDisabled] = useState<boolean>(true)
  /** 弹窗标题 */
  const [modalTitle, setModalTitle] = useState<string>('')
  /** 收藏夹是否公开 */
  const [privacy, setPrivacy] = useState<Selection>(new Set(['0']))

  //获取用户信息
  async function getUserInfo(): Promise<void> {
    console.log('UserInfo - setface')
    const res = await apis.userInfo<UserInfoResult>()
    setFace(res.face)
    useInfo.current = res
    await getFavInfoList(res.mid)
  }

  //获取收藏分类列表
  async function getFavInfoList(mid: number): Promise<void> {
    const res = await apis.getFavAllByMid<FavInfoList, FavInfoListParams>({ up_mid: mid })
    const reList = res.list.map((item) => {
      item.pageCount = Math.floor(item.media_count / 20) + (item.media_count % 20 != 0 ? 1 : 0)
      fav_videos_list_cache.current.set(item.id, item)
      return item
    })
    console.log('getFavInfo reList', reList)
    console.log('fav_videos_list_cache', fav_videos_list_cache.current)

    //存入本地数据库
    window.api.setData({ type: 'setFavVideosListData', data: fav_videos_list_cache.current })

    setFavList(res.list)
  }

  const [favConfirmPop, setFavConfirmPop] = useState<boolean>(false)

  function favConfirm(): void {
    setFavConfirmPop(!favConfirmPop)
  }

  //删除收藏夹
  async function favDel(): Promise<void> {
    const params: DelFavParams = {
      media_ids: curFavId.current!,
      csrf: cookies.current!.bili_jct
    }
    // console.log('params',params)
    await apis.delFav<NonNullable<unknown>, DelFavParams>(params)
    await getFavInfoList(useInfo.current!.mid)
    curFavId.current = undefined
    setCurFavTitle('')
    setFavBtnDisabled(true)
    favConfirm()
    message.success('执行成功')
  }

  //新建/编辑收藏夹确认操作
  async function favCtrlConfirm(): Promise<void> {
    if (curFavTitle === '') {
      message.error('收藏夹分类名称不能为空')
      return
    }
    if (favList.some((item) => item.title === curFavTitle)) {
      message.error('已存在相同的收藏夹分类名称')
      return
    }
    const params: AddEditFavParams = {
      title: curFavTitle,
      privacy: (privacy as Set<number>).values().next().value,
      csrf: cookies.current!.bili_jct
    }
    if (ctrlState === 'add') {
      await apis.addFav<NonNullable<unknown>, AddEditFavParams>(params)
    } else if (ctrlState === 'edit') {
      params.media_id = curFavId.current!
      await apis.editFav<NonNullable<unknown>, AddEditFavParams>(params)
    }
    await getFavInfoList(useInfo.current!.mid)
    onClose()
    message.success('执行成功')
  }

  function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

  //批量获取收藏分类下的视频
  async function queueGetFavInfo(item: FavInfo): Promise<FavVideoInfo[]> {
    let allVideos: FavVideoInfo[] = []
    let queueLimit = 3
    let queueCount = Math.ceil(item.pageCount / queueLimit)
    queueCount = queueCount == 0 ? 1 : queueCount
    queueLimit = queueCount == 1 ? item.pageCount : queueLimit
    for (let idx = 0; idx < queueCount; idx++) {
      if (item.id !== curFavId.current) {
        throw new Error('中断上次未完成的函数')
      }
      const queue: Promise<FavInfoMore>[] = []
      const queueStartIdx = idx * queueLimit
      const queueEndIdx =
        idx == queueCount - 1 && item.pageCount % queueLimit != 0
          ? (item.pageCount % queueLimit) + queueStartIdx
          : queueStartIdx + queueLimit
      for (let i = queueStartIdx + 1; i <= queueEndIdx; i++) {
        if (item.id !== curFavId.current) {
          throw new Error('中断上次未完成的函数')
        }
        queue.push(
          apis.getFavByFid<FavInfoMore, FavVideoInfoParams>({
            media_id: item.id,
            ps: 20,
            pn: i
          })
        )
      }
      const res = await Promise.all(queue)
      res.forEach((rItem) => {
        allVideos = allVideos.concat(rItem.medias)
      })
      if (queueCount > 1) {
        await sleep(1000)
      }
    }
    return allVideos
  }

  //获取收藏分类下的视频
  async function getFavVideoInfo(item: FavInfo): Promise<MutableRefObject<FavVideosListCache>> {
    console.log('getFavVideoInfo')
    console.log('selectedFavKeys',selectedFavKeys)
    setFavVideoListLoaded(false)
    setChecked([])
    curFavId.current = item.id
    curFavTitleBak.current = ''
    setCurFavTitle(item.title)
    setFavBtnDisabled(false)
    if (
      fav_videos_list_cache.current.get(item.id)!.media_list == undefined ||
      fav_videos_list_cache.current.get(item.id)!.media_list.length == 0
    ) {
      let allVideos: FavVideoInfo[] = []
      if (item.pageCount == 1) {
        const res = await apis.getFavByFid<FavInfoMore, FavVideoInfoParams>({
          media_id: item.id,
          ps: 20
        })
        allVideos = res.medias
        if (curFavId.current !== item.id) {
          throw new Error('中断上次未完成的函数')
        }
      } else {
        allVideos = await queueGetFavInfo(item)
        if (curFavId.current !== item.id) {
          throw new Error('中断上次未完成的函数')
        }
        setFavVideoListLoaded(true)
      }

      //本地数据和最新数据比较,提取失效数据并给标记,最新数据存储图片为base64
      const db_fav_videos_info_list = await window.api.getData({
        type: 'getFavVideosInfoListDataByFavId',
        params: String(item.id)
      })
      if (db_fav_videos_info_list != undefined && db_fav_videos_info_list.length > 0) {
        //分离正常数据和失效数据
        const localData: FavVideoInfo[] = db_fav_videos_info_list
        let baseData: FavVideoInfo[] = []
        let expireData: FavVideoInfo[] = []
        allVideos.forEach((item) => {
          if (item.title.includes('失效视频')) {
            item.baned = true
            expireData = expireData.concat(item)
          } else {
            baseData = baseData.concat(item)
          }
        })
        const expireDataIds: number[] = expireData.map((item) => item.id)
        console.log('baseData', baseData)
        console.log('localData', localData)
        //本地数据标记失效
        localData.forEach((item) => {
          if (expireDataIds.includes(item.id)) {
            item.baned = true
          }
        })

        baseData.forEach((item) => {
          const curLocalItem = localData.find((localItem) => localItem.id == item.id)
          if (curLocalItem !== undefined) {
            Object.assign(curLocalItem, item)
          } else {
            localData.unshift(item)
          }
        })

        allVideos = localData
      } else {
        allVideos.forEach((item) => {
          if (item.title.includes('失效视频')) {
            item.baned = true
          }
        })
      }

      window.api.saveAllCovers({
        type: 'saveAllCovers',
        params: String(item.id),
        data: allVideos
      })

      fav_videos_list_cache.current.get(item.id)!.media_list = allVideos
      fav_videos_list_cache.current.get(item.id)!.media_count = allVideos.length
      setFavVideoListLoaded(true)
      setFavVideoList(allVideos)
      //更新本地数据
      console.log('set low db data')
      console.log('getFavVideoInfo', allVideos)
    } else {
      setFavVideoListLoaded(true)
      setFavVideoList(fav_videos_list_cache.current.get(item.id)!.media_list)
    }
    return fav_videos_list_cache
  }

  //视频关键字过滤
  function onKeywordChange(value): void {
    const filterList = fav_videos_list_cache.current
      .get(curFavId.current!)!
      .media_list.filter((item: FavVideoInfo) => {
        return item.title.toLocaleLowerCase().includes(value.toLocaleLowerCase())
      })
    setFavVideoList(filterList)
    console.log('onKeyword', value)
  }

  function onCurFavTitleChange(value): void {
    setCurFavTitle(value)
    console.log('onCurFavTitleChange', value)
  }

  function onOpen(_ctrlState: string): void {
    switch (_ctrlState) {
      case 'add':
        curFavTitleBak.current = curFavTitle == '' || curFavTitle == undefined ? '' : curFavTitle
        setCurFavTitle('')
        setModalTitle('添加收藏分类')
        break
      case 'edit':
        curFavTitleBak.current =
          curFavTitleBak.current == '' || curFavTitleBak.current == undefined
            ? curFavTitle
            : curFavTitleBak.current
        setCurFavTitle(curFavTitleBak.current)
        setModalTitle('编辑收藏分类')
        break
      case 'copy':
        setModalTitle('复制')
        break
      case 'move':
        setModalTitle('移动')
        break
      default:
        break
    }
    setIsOpen(!isOpen)
    setCtrlState(_ctrlState)
  }

  function onClose(): void {
    console.log('onClose')
    setSelectedFavKeys(new Set([]))
    setIsOpen(!isOpen)
  }

  //复制/移动视频确认操作
  async function favVideoCtrlConfirm(): Promise<void> {
    console.log('ctrlState', ctrlState)
    let resources: string = ''
    checked.forEach((item) => {
      resources += `${item},`
    })
    const params: MoveCopyFromFavParams = {
      src_media_id: curFavId.current!,
      tar_media_id: parseInt((selectedFavKeys as Set<number>).values().next().value),
      mid: useInfo.current!.mid,
      csrf: cookies.current!.bili_jct,
      resources: resources.slice(0, -1)
    }
    let res
    if (ctrlState === 'move') {
      res = await apis.moveFromFav<number, MoveCopyFromFavParams>(params)
    } else {
      res = await apis.copyFromFav<number, MoveCopyFromFavParams>(params)
    }

    if (res === BiliCodeStatus.SUCCESS) {
      message.success('操作成功')
      //本地处理显示数据, 收藏视频数据,移动/复制后的显示列表
      const resourcesArr = params.resources.split(',').map((item) => parseInt(item.split(':')[0]))
      const resourcesArrLen = resourcesArr.length
      const srcFavVideoList = fav_videos_list_cache.current.get(params.src_media_id)!.media_list
      const tarFavVideoList = fav_videos_list_cache.current.get(params.tar_media_id)!.media_list
      const moveCopyDataList = srcFavVideoList
        .map((item, index) => {
          return new Map().set(index, item)
        })
        .filter((item) => resourcesArr.includes(item.values().next().value.id))

      if (tarFavVideoList != undefined) {
        moveCopyDataList.forEach((item) => {
          tarFavVideoList.unshift(item.values().next().value)
        })
        window.api.setData({
          type: 'updateFavVideosInfoListDataByFavId',
          params: String(params.tar_media_id),
          data: tarFavVideoList
        })
      }
      fav_videos_list_cache.current.get(params.tar_media_id)!.media_count += resourcesArrLen

      if (ctrlState === 'move') {
        fav_videos_list_cache.current.get(params.src_media_id)!.media_count -= resourcesArrLen
        moveCopyDataList.forEach((item) => {
          srcFavVideoList.splice(item.keys().next().value, 1)
        })
      }

      //更新本地数据库
      window.api.setData({
        type: 'updateFavVideosInfoListDataByFavId',
        params: String(params.src_media_id),
        data: srcFavVideoList
      })

      const favList = Array.from(fav_videos_list_cache.current!.values()).map((item) => {
        return { ...item }
      })
      setFavList(favList)
      // setFavList([...favList])
      setFavVideoList(srcFavVideoList)
    }
    setSelectedFavKeys(new Set([]))
    onClose()
  }

  //删除选中视频
  async function favVideoDel(): Promise<void> {
    if (checked.length == 0) {
      message.warning('请先选择视频')
      return
    }
    let resources: string = ''
    checked.forEach((item) => {
      resources += `${item},`
    })
    const params: DelFromFavParams = {
      media_id: curFavId.current!,
      resources: resources.slice(0, -1),
      csrf: cookies.current!.bili_jct
    }
    // console.log('params',params)
    const res = await apis.batchDelFromFav<number, DelFromFavParams>(params)
    if (res === BiliCodeStatus.SUCCESS) {
      message.success('操作成功')

      //从本地数据库删除数据
      const db_fav_videos_info_list = await window.api.getData({
        type: 'getFavVideosInfoListDataByFavId',
        params: String(curFavId.current)
      })
      const delIdArr: number[] = params.resources.split(',').map((item) => Number(item.split(':')[0]))
      const unDelData: FavVideoInfo[] = db_fav_videos_info_list.filter((item) => {
        return !delIdArr.includes(item.id)
      })
      window.api.setData({
        type: 'updateFavVideosInfoListDataByFavId',
        params: String(curFavId.current),
        data: unDelData
      })
      fav_videos_list_cache.current.get(params.media_id)!.media_list = unDelData
      favVideoConfirm()
      console.log('unDelData',unDelData)
      setFavVideoList(unDelData)
    }
  }

  const [favVideoConfirmPop, setFavVideoConfirmPop] = useState<boolean>(false)

  function favVideoConfirm(): void {
    setChecked([])
    setFavVideoConfirmPop(!favVideoConfirmPop)
  }

  //清空失效视频
  async function favVideoClear(): Promise<void> {
    setFavVideoListLoaded(false)
    const res = await apis.cleanFromFav<number, CleanFromFavParams>({
      media_id: curFavId.current!,
      csrf: cookies.current!.bili_jct
    })
    if (res === BiliCodeStatus.SUCCESS) {
      message.success('清理成功')
      //重新获取数据
      setTimeout(async () => {
        fav_videos_list_cache.current.get(curFavId.current!)!.media_list = []
        setFavVideoList([])
        const res = await getFavVideoInfo(fav_videos_list_cache.current.get(curFavId.current!)!)

        //将本地数据库里失效的视频清理掉
        const db_fav_videos_info_list = await window.api.getData({
          type: 'getFavVideosInfoListDataByFavId',
          params: String(curFavId.current)
        })
        const cleanExpireData: FavVideoInfo[] = db_fav_videos_info_list.filter(
          (item) => !item.baned
        )
        window.api.setData({
          type: 'updateFavVideosInfoListDataByFavId',
          params: String(curFavId.current),
          data: cleanExpireData
        })

        const favList = Array.from(res.current!.values()).map((item) => {
          return { ...item }
        })
        setFavVideoListLoaded(true)
        setFavList(favList)
      }, 1000)
    } else {
      setFavVideoListLoaded(true)
    }
  }

  //退出登录
  async function logout(): Promise<void> {
    await apis.logout<NonNullable<unknown>, LogoutParams>({
      biliCSRF: cookies.current!.bili_jct
    })
    window.electron.ipcRenderer.send('cleanCookie')
    router.navigate('/login')
  }

  //是否需要刷新登录状态
  async function checkRefresh(): Promise<void> {
    const res = await apis.checkRefresh<CheckRefreshResult>()
    if (res.refresh) {
      const cPath = await getCorrespondPath(res.timestamp)
      const refreshCSRFHtml = await apis.getRefreshCSRF<string>(cPath)
      const refreshCSRFArr = refreshCSRFHtml.match(/\w{32}</g)
      console.log('refreshCSRFHtml', refreshCSRFHtml)
      console.log('refreshCSRFArr', refreshCSRFArr)
      if (refreshCSRFArr != null && refreshCSRFArr.length > 0) {
        const refreshCSRF = refreshCSRFArr[0].replace('<', '')
        const params: RefreshCookieParams = {
          csrf: cookies.current!.bili_jct,
          refresh_csrf: refreshCSRF,
          source: 'main_web',
          refresh_token: localStorage.getItem('ac_time_value') || ''
        }
        const refreshCookieResult = await apis.refreshCookie<
          RefreshCookieResult,
          RefreshCookieParams
        >(params)
        if (refreshCookieResult.status === 0) {
          localStorage.setItem('ac_time_value', refreshCookieResult.refresh_token)
          await syncCookie()
          await apis.confirmRefresh<NonNullable<unknown>, ConfirmRefreshParams>({
            csrf: cookies.current!.bili_jct,
            refresh_token: params.refresh_token
          })
          getUserInfo()
        }
      }
    } else {
      syncCookie()
      getUserInfo()
    }
  }

  //同步Cookie
  async function syncCookie(): Promise<void> {
    cookies.current = await window.api.getCookie()
    console.log('renderer-getCookie', cookies)
  }

  //播放视频
  function playBV(bvid: string): void {
    window.api.playBV(bvid)
  }

  //useEffect 钩子里的方法只有在挂载和更新的时候才会执行,如果依赖项设置为空数组则只在挂载的时候执行
  useEffect(() => {
    console.log('Index useEffect')
    syncCookie()
    checkRefresh()
    //router.navigate('/myview')
  }, [])

  useEffect(() => {
    if (checked.length > 0) {
      setBtnDisabled(false)
    } else {
      setBtnDisabled(true)
    }
  }, [checked])

  return (
    <div className="mx-auto flex flex-flow h-[100vh] ">
      <div className="flex-none w-[300px] px-5 pb-5 pt-0">
        <div className={'flex justify-between'}>
          <div>
            <Tooltip content="点击退出登录" placement="right" className="text-zinc-900 text-tiny">
              <Avatar
                className="relative -top-1 cursor-pointer"
                size="lg"
                src={face}
                onClick={logout}
              />
            </Tooltip>
          </div>
          <div className="flex flex-row items-end gap-1 relative -top-1">
            <Tooltip content={'新增收藏夹'} className={'text-tiny text-zinc-900'}>
              <Button
                variant={'light'}
                className="text-white h-[30px] text-tiny rounded-[10px]"
                isIconOnly={true}
                onPress={() => onOpen('add')}
              >
                <FontAwesomeIcon icon="plus" />
              </Button>
            </Tooltip>
            <Popover
              placement="bottom"
              isOpen={favConfirmPop}
              onOpenChange={(open) => {
                setFavConfirmPop(open)
              }}
              showArrow
              offset={10}
            >
              <PopoverTrigger>
                <Button
                  isDisabled={favBtnDisabled}
                  variant={'light'}
                  className="text-white h-[30px] text-tiny rounded-[10px]"
                  isIconOnly={true}
                >
                  <Tooltip content={'删除收藏夹'} className={'text-tiny text-zinc-900'} offset={15}>
                    <FontAwesomeIcon icon="trash" />
                  </Tooltip>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px]">
                <div className=" text-zinc-900 p-3">
                  <FontAwesomeIcon icon="circle-exclamation" className="text-zinc-700 mr-2" />
                  确认删除?
                </div>
                <div>
                  <Button
                    className="h-[30px] text-tiny rounded-[10px]"
                    color="danger"
                    variant="light"
                    onPress={favDel}
                  >
                    确定
                  </Button>
                  <Button
                    variant="light"
                    className="h-[30px] text-tiny rounded-[10px]"
                    onClick={favConfirm}
                  >
                    取消
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip content={'修改收藏夹'} className={'text-tiny text-zinc-900'}>
              <Button
                isDisabled={favBtnDisabled}
                variant={'light'}
                className="text-white h-[30px] text-tiny rounded-[10px]"
                isIconOnly={true}
                onPress={() => onOpen('edit')}
              >
                <FontAwesomeIcon icon="pen-to-square" />
              </Button>
            </Tooltip>
          </div>
        </div>

        <ScrollShadow className="h-[calc(100vh-120px)] mt-1">
          <Listbox
            aria-label="Area Label"
            items={favList}
            variant="flat"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={selectedKeys}
            emptyContent={<CircularProgress color="danger" aria-label="Loading..." />}
            onSelectionChange={(keys) => {
              setSelectedKeys(keys)
            }}
          >
            {(item) => (
              <ListboxItem
                key={item.id}
                onPress={() => {
                  getFavVideoInfo(item)
                }}
                endContent={
                  <div className="flex items-center gap-1 text-default-400">
                    <span className="text-small">{item.media_count}</span>
                    <svg
                      aria-hidden="true"
                      fill="none"
                      focusable="false"
                      height="1em"
                      role="presentation"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      width="1em"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                }
                // color={favList.key === "delete" ? "danger" : "default"}
                // className={favList.key === "delete" ? "text-danger" : ""}
              >
                {item.title}
              </ListboxItem>
            )}
          </Listbox>
        </ScrollShadow>
      </div>
      <div className="flex-1 mr-5 p-5 rounded-3xl shadow-2xl bg-slate-50 h-[calc(100vh-55px)]">
        <div className="flex gap-2">
          <div className="">
            <Input
              classNames={{
                label: 'text-black/50 dark:text-white/90',
                input: [
                  'bg-transparent',
                  'text-black/90 dark:text-white/90',
                  'placeholder:text-default-700/50 dark:placeholder:text-white/60'
                ],
                innerWrapper: 'bg-transparent',
                inputWrapper: [
                  'h-[38px]',
                  'bg-default-200/50',
                  'dark:bg-default/60',
                  'backdrop-blur-xl',
                  'backdrop-saturate-200',
                  'hover:bg-default-200/70',
                  'dark:hover:bg-default/70',
                  'group-data-[focused=true]:bg-default-200/50',
                  'dark:group-data-[focused=true]:bg-default/60',
                  '!cursor-text'
                ]
              }}
              aria-label="Area Label"
              size="sm"
              type="text"
              placeholder="关键字"
              onValueChange={onKeywordChange}
            />
          </div>
          <div className="flex flex-row gap-2 items-center">
            <Button
              isDisabled={btnDisabled}
              className="bg-pink-500 text-white h-[30px] text-tiny rounded-[10px]"
              onPress={() => onOpen('move')}
            >
              移动
            </Button>
            <Button
              isDisabled={btnDisabled}
              className="bg-pink-500 text-white h-[30px] text-tiny rounded-[10px]"
              onPress={() => onOpen('copy')}
            >
              复制
            </Button>

            <Popover
              placement="bottom"
              isOpen={favVideoConfirmPop}
              onOpenChange={(open) => setFavVideoConfirmPop(open)}
              showArrow
              offset={10}
            >
              <PopoverTrigger>
                <Button
                  isDisabled={btnDisabled}
                  className="bg-pink-500 text-white h-[30px] text-tiny rounded-[10px]"
                >
                  删除
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px]">
                <div className=" text-zinc-900 p-3">
                  <FontAwesomeIcon
                    icon="circle-exclamation"
                    className="text-zinc-700 mr-2"
                  />
                  确认删除?
                </div>
                <div>
                  <Button
                    className="h-[30px] text-tiny rounded-[10px]"
                    color="danger"
                    variant="light"
                    onPress={favVideoDel}
                  >
                    确定
                  </Button>
                  <Button
                    variant="light"
                    className="h-[30px] text-tiny rounded-[10px]"
                    onClick={favVideoConfirm}
                  >
                    取消
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              className="bg-pink-500 text-white h-[30px] text-tiny rounded-[10px]"
              onPress={favVideoClear}
            >
              清空失效视频
            </Button>
            <Chip className="text-tiny bg-pink-100 text-black">已选择{checked.length}项</Chip>
          </div>
        </div>
        <Divider className="my-4" />
        <ScrollShadow className="h-[calc(100vh-170px)]" isEnabled={false}>
          <div>
            <CheckboxGroup
              classNames={{
                base: ['w-full'],
                wrapper: 'gap-4'
              }}
              orientation="horizontal"
              value={checked}
              onValueChange={(value) => {
                setChecked(value)
              }}
            >
              {favVideoListLoaded ? (
                favVideoList.map((favVideo): ReactElement => {
                  return (
                    <Card
                      shadow="none"
                      isFooterBlurred
                      className="w-[200px] h-[125px]"
                      key={favVideo.id}
                    >
                      <Image
                        isZoomed
                        alt="点击播放"
                        className="z-0 object-cover w-[200px] h-[125px]"
                        src={favVideo.cover}
                        onClick={() => {
                          playBV(favVideo.bvid)
                        }}
                      />
                      {favVideo.baned ? (
                        <Chip className="absolute top-0 right-0 rounded-none rounded-bl-2xl text-tiny bg-red-300">
                          已失效
                        </Chip>
                      ) : null}

                      <CardFooter className="absolute bg-black/40 bottom-0 border-t-1 border-default-600 dark:border-default-100 z-10 justify-between">
                        <Tooltip content={favVideo.title} className="text-tiny text-black">
                          <div className="w-full">
                            <Checkbox
                              classNames={{
                                base: 'w-full',
                                wrapper: 'hover:bg-black',
                                label: 'text-tiny text-slate-50 truncate ... '
                              }}
                              value={`${favVideo.id}:${favVideo.type}`}
                            >
                              {favVideo.title}
                            </Checkbox>
                          </div>
                        </Tooltip>
                        {/*<Button className="text-tiny" color="primary" radius="full" size="sm">
          Notify Me
        </Button>*/}
                      </CardFooter>
                    </Card>
                  )
                })
              ) : (
                <CircularProgress color="danger" aria-label="Loading..." />
              )}
            </CheckboxGroup>
          </div>
        </ScrollShadow>
      </div>

      <Modal backdrop={'blur'} isOpen={isOpen} className="text-zinc-900" hideCloseButton={true}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">{modalTitle}</ModalHeader>
              <ModalBody>
                {ctrlState === 'move' || ctrlState === 'copy' ? (
                  <ScrollShadow className=" h-[400px]">
                    <Listbox
                      items={favList}
                      variant="flat"
                      disallowEmptySelection
                      selectionMode="single"
                      selectedKeys={selectedFavKeys}
                      emptyContent={<CircularProgress color="danger" aria-label="Loading..." />}
                      onSelectionChange={(keys) => {setSelectedFavKeys(keys)}}
                    >
                      {(item) => (
                        <ListboxItem
                          key={item.id}
                          onPress={() => {
                            favListSelected.current = item.id
                          }}
                          endContent={
                            <div className="flex items-center gap-1 text-default-400">
                              <span className="text-small">{item.media_count}</span>
                              <svg
                                aria-hidden="true"
                                fill="none"
                                focusable="false"
                                height="1em"
                                role="presentation"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                                width="1em"
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </div>
                          }
                          // color={favList.key === "delete" ? "danger" : "default"}
                          // className={favList.key === "delete" ? "text-danger" : ""}
                        >
                          {item.title}
                        </ListboxItem>
                      )}
                    </Listbox>
                  </ScrollShadow>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Input
                      classNames={{
                        label: 'text-black/50 dark:text-white/90',
                        input: [
                          'bg-transparent',
                          'text-black/90 dark:text-white/90',
                          'placeholder:text-default-700/50 dark:placeholder:text-white/60'
                        ],
                        innerWrapper: 'bg-transparent',
                        inputWrapper: [
                          'h-[38px]',
                          'bg-default-200/50',
                          'dark:bg-default/60',
                          'backdrop-blur-xl',
                          'backdrop-saturate-200',
                          'hover:bg-default-200/70',
                          'dark:hover:bg-default/70',
                          'group-data-[focused=true]:bg-default-200/50',
                          'dark:group-data-[focused=true]:bg-default/60',
                          '!cursor-text'
                        ]
                      }}
                      size="sm"
                      value={curFavTitle}
                      type="text"
                      placeholder="关键字"
                      onValueChange={onCurFavTitleChange}
                    />
                    <Select
                      placeholder={'是否公开'}
                      labelPlacement="outside"
                      classNames={{
                        label: 'group-data-[filled=true]:-translate-y-5',
                        trigger: 'h-8',
                        mainWrapper: 'h-8',
                        innerWrapper: 'h-8',
                        base: 'h-8',
                        listboxWrapper: 'max-h-[400px] text-tiny text-black/50'
                      }}
                      defaultSelectedKeys={['0']}
                      selectedKeys={privacy}
                      onSelectionChange={(keys) => {setPrivacy(keys)}}
                    >
                      <SelectItem key={'0'} value={0}>
                        公开
                      </SelectItem>
                      <SelectItem key={'1'} value={1}>
                        私密
                      </SelectItem>
                    </Select>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {ctrlState === 'move' || ctrlState === 'copy' ? (
                  <Button
                    className="bg-pink-500 text-white text-tiny rounded-[10px]"
                    onPress={favVideoCtrlConfirm}
                  >
                    确定
                  </Button>
                ) : (
                  <Button
                    className="bg-pink-500 text-white text-tiny rounded-[10px]"
                    onPress={favCtrlConfirm}
                  >
                    确定
                  </Button>
                )}
                <Button className="text-tiny" color="danger" variant="light" onPress={onClose}>
                  取消
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* <Button onPress={() => {
          router.navigate('/login')
      }}>去登陆页</Button>
      <SwitchTransition mode={'out-in'}>
        <CSSTransition timeout={500}>
          <Suspense fallback={<div>Loading2</div>}>
            <Outlet />
          </Suspense>
        </CSSTransition>
      </SwitchTransition>*/}
    </div>
  )
}

export default Index
