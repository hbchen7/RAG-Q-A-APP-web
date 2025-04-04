import request from '@/utils/request'

export const userLoginAPI = (data) => {
  return request.post('/user/login', data)
}

export const userRegisterAPI = (data) => {
  return request.post('/user/register', data)
}
