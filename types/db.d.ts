interface DbReq<T> {
  type: string
  params: string
  data?: T
  responseStatus: number
}

type Data = {
  fav_videos_list: FavVideoInfoCacheObject
  fav_videos_info_list: FavVideoInfoListObject
}
