import request from '@/utils/request'

export const sayHelloAPI = (data) => {
  return request.post('/chat/hello', data)
}

/**
 * 创建话题、创建会话
 * @param {*} data
 * @returns
 */

export const createTopicAPI = (data) => {
  return request.post('/chat/createTopic', data)
}

/**
 * 获取话题列表
 * @param {*} data
 * @returns
 */

export const getTopicsAPI = (data) => {
  return request.post('/chat/topics', data)
}
