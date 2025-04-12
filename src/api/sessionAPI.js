import request from '@/utils/request'

/**
 * 创建一个新的会话
 * @param {object} data - 会话创建所需的数据
 * @param {string} [data.title='新会话'] - 会话标题，默认为 '新会话'
 * @param {string} [data.username='root'] - 用户名，
 * @param {string} [data.assistant_id] - 助手 ID
 * @returns {Promise} 返回一个 Promise 对象，包含创建的会话信息
 */
export const createSessionAPI = (data) => {
  return request.post('/session/create', data)
}

/**
 * 获取指定用户的会话列表
 * @param {object} params - 查询参数
 * @param {string} params.username - 需要查询会话列表的用户名
 * @returns {Promise} 返回一个 Promise 对象，包含用户的会话列表
 */
export const getSessionListAPI = (params) => {
  return request.get('/session/list', { params })
}

/**
 * 修改指定会话的标题
 * @param {string} sessionId - 要修改标题的会话 ID
 * @param {object} params - 查询参数
 * @param {string} params.title - 新的会话标题
 * @returns {Promise} 返回一个 Promise 对象，包含更新后的会话信息
 */
export const updateSessionTitleAPI = (sessionId, params) => {
  // 注意：后端接口定义中 title 是查询参数，不是路径参数或请求体
  return request.put(`/session/${sessionId}/title`, null, { params })
}

/**
 * 删除指定的会话（包括其历史消息）
 * @param {string} sessionId - 要删除的会话 ID
 * @returns {Promise} 返回一个 Promise 对象，包含删除操作的结果信息
 */
export const deleteSessionAPI = (sessionId) => {
  return request.delete(`/session/${sessionId}/delete`)
}
