import { parentPort } from 'worker_threads'
import got from 'got'
import { LowSync } from 'lowdb'

//设置封面
function getLocalCover(fileName: string): Promise<string> {
  return new Promise((resolve) => {
    parentPort!.postMessage({
      type: 'getLocalCover',
      data: fileName
    })
    parentPort!.once('message', async (data) => {
      return resolve(data)
    })
  })
}

//下载图片
async function getImg(item): Promise<void> {
  console.log('item title', item.title)
  console.log('item coverStr', item.coverStr)
  // console.log('window',window)

  if (item.coverStr == undefined && !item.baned) {
    const lastIndex = item.cover.lastIndexOf('/')
    got
      .get(item.cover, {
        // @ts-ignore
        responseType: 'buffer'
      })
      .then((buffer) => {


        parentPort!.postMessage({
          type: 'setLocalCover',
          data: {
            item,
            fileName: item.cover.substring(lastIndex + 1, item.cover.length),
            // @ts-ignore
            base64Data: buffer.body.toString('base64')
          }
        })
      })
    item.coverStr = item.cover.substring(lastIndex + 1, item.cover.length)
  } else if (item.coverStr !== undefined && item.baned) {
    /*window.api.getLocalCover(item.coverStr).then((data) => {
      item.cover = data
    })*/
    console.log('获取本地封面')
    const localCover = await getLocalCover(item.coverStr)
    item.cover = localCover
    console.log('localCover', localCover)
  }
  return new Promise((resolve) => {
    return resolve()
  })
}

//TODO: 待优化，批量请求下载图片，而不是一下子全部下载
async function getBase64Img(allVideos: FavVideoInfo[], callback: () => void): Promise<void> {
  // const queueLimit = 30
  // const forCounts = Math.ceil(allVideos.length / queueLimit)
  const queueGetImg: Promise<void>[] = []
  // let i = 1
  for (const item of allVideos) {
    // item.title = `${i++} ${item.title}`
    queueGetImg.push(getImg(item))
  }
  Promise.all(queueGetImg)
    .then(() => {
      console.log('then')
      callback()
    })
    .catch((reason) => {
      console.log('reason---', reason)
    })
    .finally(() => {
      console.log('finally---')
    })
}

async function reqWorker(db: LowSync<Data>, dbReq: DbReq<FavVideosInfoListCache>): Promise<void> {
  // @ts-ignore
  await getBase64Img(dbReq.data, () => {
    console.log('getBase64Img done')
    // @ts-ignore
    db.data.fav_videos_info_list[dbReq.params] = dbReq.data!
    db.write()
  })
}

export default reqWorker
