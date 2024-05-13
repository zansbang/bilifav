import { app, shell, BrowserWindow, ipcMain, session, screen, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import DbWorker from './worker/dbWorker?nodeWorker'
import * as fs from 'node:fs'
import got from 'got'

let mainWindow: BrowserWindow
const global = { coverPath: join(app.getAppPath(), 'cover\\') }

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 920,
    show: false,
    frame: false,
    titleBarStyle: 'default',
    backgroundMaterial: 'acrylic',
    useContentSize: true,
    /*    titleBarStyle: 'hidden',
        titleBarOverlay: {
          color: '#2f3241',
          symbolColor: '#74b1be',
          height: 20
        },*/
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: false,
      nodeIntegrationInWorker: true
    }
  })
  Store.initRenderer()
  const store = new Store()
  const cookieStoreKey = 'cookies.mainWindow'
  const cookiesWatch = new Promise<void>((resolve) => {
    const cookies: Array<object> = (store.get(cookieStoreKey) as Array<object>) || []
    let recoverTimes = cookies.length
    if (recoverTimes <= 0) {
      //无cookie数据无需恢复现场
      resolve()
      return
    }

    //恢复cookie现场
    cookies.forEach((cookiesItem) => {
      const { secure = false, domain = '', path = '' } = cookiesItem

      mainWindow.webContents.session.cookies
        .set(
          Object.assign(cookiesItem, {
            url: (secure ? 'https://' : 'http://') + domain.replace(/^\./, '') + path
          })
        )
        .then(() => {
        })
        .catch((e) => {
          console.error({
            message: '恢复cookie失败',
            cookie: cookiesItem,
            errorMessage: e.message
          })
        })
        .finally(() => {
          recoverTimes--
          if (recoverTimes <= 0) {
            resolve()
          }
        })
    })
  })

  cookiesWatch.then(() => {
    //监听cookie变化保存cookie现场
    return new Promise<void>((resolve) => {
      let isCookiesChanged = false
      mainWindow.webContents.session.cookies.on('changed', () => {
        console.log('cookie changed')
        //检测cookies变动事件，标记cookies发生变化
        isCookiesChanged = true
      })

      //每隔500毫秒检查是否有cookie变动，有变动则进行持久化
      setInterval(() => {
        if (!isCookiesChanged) {
          return
        }
        mainWindow.webContents.session.cookies
          .get({})
          .then((cookies) => {
            store.set(cookieStoreKey, cookies)
          })
          .catch((error) => {
            console.log({ error })
          })
          .finally(() => {
            isCookiesChanged = false
          })
      }, 500)

      resolve()
    })
  })

  //通过electron的webRequest对象在请求返回阶段加上SameSite=None; Secure
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*.bilibili.com/*'] },
    (details, callback) => {
      if (
        details.responseHeaders &&
        details.responseHeaders['set-cookie'] &&
        details.responseHeaders['set-cookie'].length &&
        !details.responseHeaders['set-cookie'][0].includes('SameSite=none')
      ) {
        for (let i = 0; i < details.responseHeaders['set-cookie'].length; i++) {
          details.responseHeaders['set-cookie'][i] += '; SameSite=None; Secure'
        }
      }
      callback({ cancel: false, responseHeaders: details.responseHeaders })
    }
  )

  /*app.on('ready', async () => {
    // 多窗口数据存储
    global.sharedObject = {
      windowsIdList: [],
      store,cookieStoreKey
    }
  })*/

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })


  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  mainWindow.webContents.openDevTools({mode: 'bottom'})

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function openChildWindow(bvId:string): void {
  let childWindow = new BrowserWindow({
    width: 1920,
    height: 920,
    // parent: mainWindow,
    titleBarStyle: 'default',
    backgroundMaterial: 'acrylic',
    useContentSize: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webSecurity: false,
      nodeIntegrationInWorker: true
    }
  })

  childWindow.loadURL(`https://www.bilibili.com/video/${bvId}`)

  childWindow.on('close', ()=> {
    childWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const dbWorker = new DbWorker({})
  dbWorker.postMessage({ type: 'initDb' })
  dbWorker.on('message', async (e) => {
    switch (e.type){
      case 'setLocalCover':
        console.log('接收worker回调:',e.type)
        ipcMain.emit(e.type, '_event',e.data)
        break
      default:
    }
  })

  console.log('app.getpath',app.getAppPath())
  console.log('fs.existsSync(join(app.getAppPath(),\'cover\'))',fs.existsSync(join(app.getAppPath(),'cover')))

  async function getCookies(): Promise<NonNullable<unknown>> {
    const cookies = await mainWindow.webContents.session.cookies
      .get({})
    // console.log('main-getCookie', cookies)
    const cookiesObj = {}
    cookies.forEach((item) => {
      cookiesObj[item.name] = item.value
    })
    return cookiesObj
  }

  //创建视频封面保存目录
  if(!fs.existsSync(join(app.getAppPath(),'cover'))){
    fs.mkdirSync(join(app.getAppPath(), 'cover'), { recursive: true })
  }

  // IPC

  ipcMain.on('maxWindow',()=>{
    mainWindow.maximize()
  })
  ipcMain.on('minWindow',()=>{
    mainWindow.minimize()
  })
  ipcMain.on('closeWindow',()=>{
    mainWindow.close()
  })
  ipcMain.on('restoreWindow',()=>{
    mainWindow.restore()
  })

  let curWinWidth = 0
  let curWinHeight = 0
  ipcMain.handle('getWindowXY',()=>{
    const winPosition = mainWindow.getPosition()
    const cursorPosition = screen.getCursorScreenPoint()
    const x = cursorPosition.x - winPosition[0]
    const y = cursorPosition.y - winPosition[1]
    curWinWidth = mainWindow.getSize()[0]
    curWinHeight = mainWindow.getSize()[1]
    return { x, y }
  })

  ipcMain.on('moveWindow',(_event,args)=>{
    mainWindow.setBounds({
      width: curWinWidth,
      height: curWinHeight,
      x: args.x,
      y: args.y
    })
  })


  ipcMain.handle('getCookie', () => {
    return getCookies()
  })

  ipcMain.on('cleanCookie', () => {
    mainWindow.webContents.session.cookies
      .get({})
      .then((cookies) => {
        cookies.forEach((cookie) => {
          let url = ''
          // get prefix, like https://www.
          url += cookie.secure ? 'https://' : 'http://'
          url += cookie.domain?.charAt(0) === '.' ? 'www' : ''
          // append domain and path
          url += cookie.domain
          url += cookie.path
          mainWindow.webContents.session.cookies.remove(url, cookie.name)
        })
      })
      .catch((error) => {
        console.log(error)
      })
  })

  ipcMain.on('setGlobal', (_event, args) => {
    Object.assign(global, args)
    console.log('main-setGlobal', global)
  })

  ipcMain.handle('getGlobal', () => {
    return global
  })

  //获取本地图片封面
  ipcMain.handle('getLocalCover',(_event,args)=>{
    const path = global.coverPath + args.fileName
    console.log('main-getLocalCover', path)
    return new Promise<string>((resolve, reject) => {
      fs.stat(path, (err, stat) => {
        if (err) {
          console.error(err)
          return resolve()
        }
        // 检查文件类型
        if (stat.isFile() && /(\.jpg|\.jpeg|\.png|\.gif)$/.test(args.fileName)) {
          fs.readFile(path, (err, data) => {
            if (err) {
              console.log(err)
              return resolve()
            } else {
              const fileType = args.fileName.split('.')[1]
              // 转成base64
              return resolve(`data:image/${fileType};base64,${data.toString('base64')}`)
            }
          })
        }
      })
    })

  })


  //将获取图片请求放到worker中执行

  ipcMain.on('saveAllCovers',(_event,args) => {
    dbWorker.postMessage(args)
  })


/*
  const request = net.request('http://i0.hdslb.com/bfs/archive/59e0861c4edb439a7d7cc7bb06e974b0ee740110.jpg')
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`)
    console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
    response.on('data', (chunk) => {
      console.log(`接受到数据: ${chunk.toString('base64')}`)
    })
    response.on('end', () => {
      console.log('数据接受完成.')
    })
  })
  //结束请求
  request.end()
*/

  //保存图片封面到本地

  ipcMain.on('setLocalCover',(_event, args) => {
    if (!fs.existsSync(global.coverPath + args.fileName)) {
      // 保存文件
      fs.writeFile(global.coverPath+args.fileName, args.base64Data, "base64", (err) => {
        if (err) {
          console.log('报错：', err)
        } else {
          console.log(global.coverPath+args.fileName+ " 文件保存成功")
          dbWorker.postMessage({ type:'setLocalCoverCallback', status:0, data:{fileName:args.fileName} })
        }
      })
    } else {
      console.log('文件已存在,不再保存')
    }
  })


  ipcMain.on('setData', (_event, args) => {
    // console.log('main-setData', args)
    dbWorker.postMessage(args)
  })

  ipcMain.handle('getData', (event, args) => {
    console.log('main-getData', args)
    dbWorker.postMessage(args)
    return new Promise((resolve) => {
      dbWorker.once('message', (e) => {
        resolve(e.data)
      })
    })
  })

  ipcMain.on('playBV',(_event, args) => {
    openChildWindow(args)
  })

  createWindow()

  app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
