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
 * @description 上传文件到指定的知识库（异步处理）
 * @param {string} kbId - 目标知识库的 ID
 * @param {FormData} formData - 包含文件的 FormData 对象
 *   - formData.append('file', fileObject) // 文件对象（必需）
 * @returns {Promise<object>} 包含任务ID的响应对象
 * @returns {string} returns.task_id - 文件处理任务ID，可用于查询处理状态
 * @returns {string} returns.message - 操作结果消息
 * @note 文件上传后会异步处理，使用返回的 task_id 调用 getTaskStatus() 查询处理进度
 * @note Embedding 配置（模型、供应商、API密钥）将从知识库记录中自动获取，无需手动传递
 */
export const uploadFileToKnowledgeBase = (kbId, formData) => {
  return request.post(`/knowledge/${kbId}/files/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // 必须设置请求头为 multipart/form-data
    },
  })
  /**响应示例
   * {
   *   "task_id": "task_67ff248e0e67faaaae7c5303_20250920103000",
   *   "message": "文件上传成功，正在异步处理中"
   * }
   */
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

/**
 * @description 查询文件处理任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<object>} 任务状态信息
 * @returns {string} returns.task_id - 任务ID
 * @returns {string} returns.status - 任务状态 (pending/processing/completed/failed)
 * @returns {string} returns.file_name - 文件名称
 * @returns {string} returns.kb_id - 知识库ID
 * @returns {string} returns.created_at - 创建时间
 * @returns {number} returns.retry_count - 重试次数
 * @returns {string|null} returns.error_message - 错误信息 (如果有)
 */
export const getTaskStatus = (taskId) => {
  return request.get(`/knowledge/tasks/${taskId}`)
  /**响应示例
   * {
   *   "task_id": "task_123456",
   *   "status": "processing",
   *   "file_name": "document.pdf",
   *   "kb_id": "67ff248e0e67faaaae7c5303",
   *   "created_at": "2025-09-20T10:30:00.000000",
   *   "retry_count": 0,
   *   "error_message": null
   * }
   */
}

/**
 * @description 查询文件处理队列状态
 * @returns {Promise<object>} 队列状态信息
 * @returns {number} returns.queue_size - 当前队列中的任务数量
 * @returns {number} returns.max_queue_size - 队列最大容量
 * @returns {number} returns.workers_count - 工作线程数量
 * @returns {boolean} returns.is_running - 队列是否正在运行
 */
export const getQueueStatus = () => {
  return request.get('/knowledge/queue/status')
  /**响应示例
   * {
   *   "queue_size": 3,
   *   "max_queue_size": 100,
   *   "workers_count": 2,
   *   "is_running": true
   * }
   */
}

// 2025年9月20日
