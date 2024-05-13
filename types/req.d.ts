//axios返回格式
interface axiosTypes<T> {
  data: T
  status: number
  statusText: string
  headers: T
}

//后台响应数据格式
//###该接口用于规定后台返回的数据格式，意为必须携带code、msg以及result
//###而data的数据格式 由外部提供。如此即可根据不同需求，定制不同的数据格式
interface responseTypes<T> {
  code: number
  message: string
  ttl?: number
  data: T
}
