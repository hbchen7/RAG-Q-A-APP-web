import request from '@/utils/request'

/**
 * @description 创建新的知识库
 * @param {object} data - 创建知识库所需的数据
 * @param {string} data.title - 知识库标题
 * @param {string[]} [data.tag] - 知识库标签列表 (可选)
 * @param {string} [data.description] - 知识库描述 (可选)
 * @returns {Promise<object>} 创建成功后的知识库对象
 */
export const createKnowledge = (data) => {
  // 修正路径，后端路由是 /knowledge/
  return request.post('/knowledge/', data)
}

/**
 * @description 上传文件到指定的知识库
 * @param {string} kbId - 目标知识库的 ID
 * @param {FormData} formData - 包含文件和其他参数的 FormData 对象
 *   - formData.append('file', fileObject) // 文件对象
 *   - formData.append('embedding_supplier', supplier) // e.g., 'openai'
 *   - formData.append('embedding_model', model) // e.g., 'text-embedding-ada-002'
 *   - formData.append('embedding_api_key', apiKey) // (可选)
 *   - formData.append('is_reorder', isReorder) // (可选, boolean)
 * @returns {Promise<object>} 上传结果
 */
export const uploadFileToKnowledgeBase = (kbId, formData) => {
  return request.post(`/knowledge/${kbId}/files/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // 必须设置请求头为 multipart/form-data
    },
  })
}

/**
 * @description 获取知识库列表
 * @returns {Promise<Array<object>>} 包含所有知识库对象的数组
 */
export const getKnowledgeList = () => {
  return request.get('/knowledge/')
}

/**
 * @description 删除指定的知识库及其关联数据
 * @param {string} kbId - 要删除的知识库的 ID
 * @returns {Promise<object>} 删除操作的结果消息
 */
export const deleteKnowledgeBase = (kbId) => {
  return request.delete(`/knowledge/${kbId}`)
}
