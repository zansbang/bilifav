import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import router from '../router'

//process.env.NODE_ENV 判断是否为开发环境 根据不同环境使用不同的baseURL 方便调试
const defaultRequestConfig: AxiosRequestConfig = {
  timeout: 30000,
  baseURL: import.meta.env.RENDERER_VITE_BASE_URL ? '' : import.meta.env.RENDERER_VITE_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  responseType: 'json',
  withCredentials: true
}

//创建axios实例
const axiosInstance = axios.create(defaultRequestConfig)

//统一请求拦截 可配置自定义headers 例如 language、token等


//核心处理代码 将返回一个promise 调用then将可获取响应的业务数据
const requestHandler = <T, R>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  path: string = '',
  params: R | undefined,
  customConfig: AxiosRequestConfig = {}
): Promise<T> => {
  let response: Promise<axiosTypes<responseTypes<T>>>
  /*axiosInstance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      Object.assign(config, customConfig)
     /!* if(Object.keys(customConfig).length > 0){
        Object.assign(config, customConfig)
        console.log('Object.keys(customConfig)',Object.keys(customConfig))
        console.log('customConfig',customConfig)
      }else{
        Object.assign(config,{responseType: 'json'})
      }*!/

      console.log('config.url',config.url)
      return config
    },
    (error) => {
      console.log(error)
      Promise.reject(error)
    }
  )*/
  switch (method) {
    case 'get':
      response = axiosInstance.get(url + path, { params: { ...params }, ...customConfig })
      break
    case 'post':
      response = axiosInstance.post(url + path, { ...params }, { ...customConfig })
      break
    case 'put':
      response = axiosInstance.put(url + path, { ...params }, { ...customConfig })
      break
    case 'delete':
      response = axiosInstance.delete(url + path, { params: { ...params }, ...customConfig })
      break
  }

  return new Promise<T>((resolve, reject) => {
    response
      .then((res) => {
        //业务代码 可根据需求自行处理

        const data = res.data
        console.log('res', res)
        console.log('data', data)

        if (res.headers['content-type'].indexOf('text/html') !== -1) {
          const reData = {
            code: 0,
            message: '',
            data: res.data
          }
          return resolve(reData.data)

        }

        if (res.headers['content-type'].indexOf('image') !== -1) {
          return resolve(data)
        }
        if (data.code !== 0) {
          //特定状态码 处理特定的需求
          if (data.code == 401) {
            console.log('登录异常，执行登出...')
          }

          if (data.code === -101) {
            router.navigate('/login')
          }


          if (data.code === undefined) {
            return resolve(data)

          }

          const e = JSON.stringify(data)

          console.log(`请求错误：${e}`)
          //数据请求错误 使用reject将错误返回
          return reject(data)
        } else {
          //数据请求正确 使用resolve将结果返回
          return resolve(data.data)
        }
      })
      .catch((error) => {
        const e = JSON.stringify(error)

        console.log(`网络错误：${e}`)
        return reject(error)
      })
  })
}

// 使用 req 统一调用，包括封装的get、post、put、delete等方法
const req = {
  get: <T, R>(url: string, params?: R, config?: AxiosRequestConfig, path?: string): Promise<T> =>
    requestHandler<T, R>('get', url, path, params, config),
  post: <T, R>(url: string, params?: R, config?: AxiosRequestConfig, path?: string): Promise<T> =>
    requestHandler<T, R>('post', url, path, params, config),
  put: <T, R>(url: string, params?: R, config?: AxiosRequestConfig, path?: string): Promise<T> =>
    requestHandler<T, R>('put', url, path, params, config),
  delete: <T, R>(url: string, params?: R, config?: AxiosRequestConfig, path?: string): Promise<T> =>
    requestHandler<T, R>('delete', url, path, params, config),
  download: (url: string): Promise<any> => requestHandler('get', url, '', undefined, { responseType: 'arraybuffer' })
}

// 导出至外层，方便统一使用
export default req
