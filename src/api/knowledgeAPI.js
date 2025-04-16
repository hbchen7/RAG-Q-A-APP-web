import request from '@/utils/request'

/**
 * @description 创建新的知识库
 * @param {object} data - 创建知识库所需的数据
 * @param {string} data.title - 知识库标题
 * @param {string[]} [data.tag] - 知识库标签列表 (可选)
 * @param {string} [data.description] - 知识库描述 (可选)
 * @param {object} data.embedding_config - 嵌入模型配置
 * @param {string} data.embedding_config.embedding_model - 使用的嵌入模型名称 (例如 'text-embedding-ada-002')
 * @param {string} data.embedding_config.embedding_supplier - 嵌入模型提供商 (例如 'openai')
 * @param {string} [data.embedding_config.embedding_apikey] - 嵌入模型 API 密钥 (如果需要)
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
  /**响应示例
   * [
    {
        "_id": "67ff248e0e67faaaae7c5303",
        "title": "RAG知识库",
        "tag": [
            "RAG知识库"
        ],
        "description": "RAG知识库",
        "creator": "user1",
        "filesList": [
            {
                "file_md5": "a732ad338b1b9c01e1757e934526f35c",
                "file_path": "C:\\Users\\hbche\\AppData\\Local\\Temp\\tmp1liyk7wg_《蟹堡王员工规范》.md",
                "file_name": "《蟹堡王员工规范》.md",
                "upload_time": "2025-04-16T13:41:58.761000"
            }
        ],
        "embedding_config": {
            "embedding_model": "BAAI/bge-m3",
            "embedding_supplier": "oneapi",
            "embedding_apikey": "sk-enlDKhEcgGKyeJPx5b8c65Dc9d9b4842A24f5223A4Fb50C3"
        },
        "create_at": "2025-04-16T11:31:26.195000"
    }
]
   * 
   */
}

/**
 * @description 删除指定的知识库及其关联数据
 * @param {string} kbId - 要删除的知识库的 ID
 * @returns {Promise<object>} 删除操作的结果消息
 */
export const deleteKnowledgeBase = (kbId) => {
  return request.delete(`/knowledge/${kbId}`)
}

/**
 * @description 从指定的知识库中删除指定的文件
 * @param {string} kbId - 目标知识库的 ID
 * @param {string} fileMd5 - 要删除的文件的 MD5 值
 * @returns {Promise<object>} 删除操作的结果消息
 */
export const deleteFileFromKnowledgeBase = (kbId, fileMd5) => {
  return request.delete(`/knowledge/${kbId}/files/${fileMd5}`)
}
