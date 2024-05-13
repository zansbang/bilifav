import { parentPort } from 'worker_threads'
import { LowSync } from 'lowdb'
import { JSONFileSync } from 'lowdb/node'
import lodash from 'lodash'
import reqWorker from './reqWorker'

const defaultData: Data = {
  fav_videos_list: {},
  fav_videos_info_list: {}
}

class LowWithLodash<T> extends LowSync<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

function convertStrKeyToNumKey(obj): FavVideosListCache {
  return new Map(Object.entries(obj).map(([key, value]) => [Number(key), value]))
}

let db: LowSync<Data>

function initDb(): void {
  const adapter = new JSONFileSync<Data>('src/main/db/bilifav.json')
  db = new LowWithLodash(adapter, defaultData)
  db.read()
  // const db = JSONFileSyncPreset('bilifav.json', { test: [1,2,3] })
  // db.read()
  // db.data = { test: [4,5,6] }
  // db.write()
}

parentPort!.on('message', async (dbReq: DbReq<FavVideosInfoListCache>) => {
  switch (dbReq.type) {
    case 'initDb':
      initDb()
      break
    case 'setFavVideosListData':
      db.data.fav_videos_list = Object.fromEntries(dbReq.data!)
      db.write()
      break
    case 'updateFavVideosListData':
      db.data.fav_videos_list = Object.assign(db.data.fav_videos_list, Object.fromEntries(dbReq.data!))
      db.write()
      break
    case 'getFavVideosListData':
      console.log('发送回调给worker')
      parentPort!.postMessage({
        type: 'getFavVideosListData',
        data: convertStrKeyToNumKey(db.data.fav_videos_list)
      })
      break
    case 'updateFavVideosInfoListDataByFavId':
      // console.log('dbReq.data',dbReq.data)
      db.data.fav_videos_info_list[dbReq.params] = dbReq.data!
      db.write()
      break
    case 'getFavVideosInfoListDataByFavId':
      console.log('发送回调给worker')
      parentPort!.postMessage({
        type: 'getFavVideosInfoListDataByFavId',
        data: db.data.fav_videos_info_list[dbReq.params]
      })
      break
    case 'saveAllCovers':
      reqWorker(db,dbReq)
      break
    case 'showData':
      break
    default:
  }
})
