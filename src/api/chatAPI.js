import request from '@/utils/request'

export const sayHelloAPI = (data) => {
  return request.post('/chat', data)
}
