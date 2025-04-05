import request from '@/utils/request'

export const sayHelloAPI = (data) => {
  return request.post('/chat/hello', data)
}

export const getTopicsAPI = (data) => {
  return request.post('/chat/topics', data)
}
