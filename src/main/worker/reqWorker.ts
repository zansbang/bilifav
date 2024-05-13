import http from 'node:http'
import { parentPort } from 'worker_threads'
import got from 'got'
import { LowSync } from 'lowdb'


function setItemCoverStr(item): void{
  new Promise((resolve) => {
    parentPort!.once('message', async (e) => {
      console.log('fileName', e.data.fileName)
      console.log('imgUrl', item.cover)
      if (e.status === 0) {
        const lastIndex = item.cover.lastIndexOf('/')
        item.coverStr = item.cover.substring(lastIndex + 1, item.cover.length)
        return resolve()
      }
    })
  })
}

async function getImg(item): Promise<void> {
  return new Promise((resolve) => {
    if (item.coverStr == undefined && !item.baned) {

      got.get(item.cover, {
          responseType: 'buffer'
        })
        .then((buffer) => {
          const lastIndex = item.cover.lastIndexOf('/')
          parentPort!.postMessage({type: 'setLocalCover',data:{item,fileName:item.cover.substring(lastIndex + 1, item.cover.length), base64Data:buffer.body.toString('base64')}})

          return resolve(
            setItemCoverStr(item)
          )
        })
        .catch((err) => {
          console.log(err)
        })
    } else if (item.coverStr !== undefined && item.baned) {
      window.api.getLocalCover(item.coverStr).then((data) => {
        item.cover = data
        return resolve()
      })
    }
  })
}

async function getBase64Img(allVideos: FavVideoInfo[], callback: () => void): Promise<void> {
  const queueLimit = 30
  const forCounts = Math.ceil(allVideos.length / queueLimit)
  const queueGetImg: Promise<void>[] = []
  for (const item of allVideos) {
    queueGetImg.push(getImg(item))
  }
  Promise.all(queueGetImg).then(() => {
    callback()
  })



  /*let queueCount = Math.floor(item.pageCount / queueLimit)
  queueCount = queueCount == 0 ? 1 : queueCount
  queueLimit = queueCount == 1 ? item.pageCount : queueLimit
  for (let idx = 0; idx < queueCount; idx++) {
    const queue: Promise<FavInfoMore>[] = []
    const queueStartIdx = idx * queueLimit
    const queueEndIdx = queueStartIdx + queueLimit
    for (let i = queueStartIdx + 1; i <= queueEndIdx; i++) {
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
  }
  return allVideos*/


}


async function reqWorker(db: LowSync<Data>, dbReq: DbReq<FavVideosInfoListCache>): Promise<void> {
  await getBase64Img(dbReq.data, () => {
    db.data.fav_videos_info_list[dbReq.params] = dbReq.data!
    db.write()
  })

/*  const [err, res] = await got
    .get('http://i0.hdslb.com/bfs/archive/59e0861c4edb439a7d7cc7bb06e974b0ee740110.jpg', {
      responseType: 'buffer'
    })
    .then((buffer) => [null, buffer])
    .catch((err) => [err, null])*/

/*  http.get('http://i0.hdslb.com/bfs/archive/59e0861c4edb439a7d7cc7bb06e974b0ee740110.jpg', (response) => {
    let chunks = []

    // called when a data chunk is received.
    response.on('data', (chunk) => {
      chunks.push(chunk)
    })

    // called when the complete response is received.
    response.on('end', () => {
      console.log(Buffer.concat(chunks).toString('base64'))
    })

  }).on("error", (error) => {
    console.log("Error: " + error.message)
  })*/

}


export default reqWorker
