import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getKnowledgeList,
  createKnowledge,
  uploadFileToKnowledgeBase,
  deleteFileFromKnowledgeBase,
  deleteKnowledgeBase, // 引入删除知识库 API
  getTaskStatus, // 引入任务状态查询 API
} from '@/api/knowledgeAPI'
import { ElMessage, ElMessageBox } from 'element-plus'

const STORE_KEY = 'knowledge_base_store' // localStorage key

// 防抖刷新相关变量
let refreshDebounceTimer = null
const REFRESH_DEBOUNCE_DELAY = 1000 // 1秒防抖延迟

export const useKnowledgeStore = defineStore(
  'knowledge',
  () => {
    // --- State ---
    const knowledgeBases = ref([]) // 知识库列表
    const selectedKbId = ref(null) // 当前选中的知识库 ID
    const loading = ref(false) // 加载状态
    const error = ref(null) // 错误信息

    // 新增：用于聊天的知识库选择状态
    const KBtoChat = ref(null) // 聊天时选中的知识库
    const FileToChat = ref(null) // 聊天时选中的文件

    // --- Getters ---
    /**
     * @description 获取当前选中的知识库对象
     * @returns {object|null} 选中的知识库对象，如果未选中则返回 null
     */
    const selectedKnowledgeBase = computed(() => {
      if (!selectedKbId.value) return null
      return knowledgeBases.value.find((kb) => kb._id === selectedKbId.value) || null
    })

    // --- Actions ---

    /**
     * @description 从 API 获取知识库列表并更新状态
     */
    const fetchKnowledgeBases = async () => {
      loading.value = true
      error.value = null
      try {
        const response = await getKnowledgeList()
        // 检查返回的是否是数组，如果不是，可能是API返回了错误结构
        if (Array.isArray(response)) {
          knowledgeBases.value = response
          // 如果之前没有选中或者选中的 ID 不在新的列表中，则默认选中第一个
          const currentSelectionExists = knowledgeBases.value.some(
            (kb) => kb._id === selectedKbId.value,
          )
          if (
            (!selectedKbId.value || !currentSelectionExists) &&
            knowledgeBases.value.length > 0
          ) {
            selectedKbId.value = knowledgeBases.value[0]._id
          } else if (knowledgeBases.value.length === 0) {
            // 如果列表为空，清空选中 ID
            selectedKbId.value = null
          }
        } else {
          console.error('获取知识库列表失败: API 返回的不是预期的数组格式', response)
          knowledgeBases.value = [] // 清空列表避免错误数据
          selectedKbId.value = null
          error.value = '获取知识库列表失败: 响应格式错误'
          ElMessage.error(error.value)
        }
      } catch (err) {
        console.error('获取知识库列表失败:', err)
        error.value = err.message || '获取知识库列表失败'
        knowledgeBases.value = [] // 清空列表
        selectedKbId.value = null // 清空选中
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }

    /**
     * @description 设置当前选中的知识库 ID
     * @param {string} id - 要选中的知识库 ID
     */
    const setSelectedKbId = (id) => {
      selectedKbId.value = id
    }

    /**
     * @description 静默刷新知识库列表（不显示loading状态，用于后台任务完成后的更新）
     * @returns {Promise<boolean>} 操作是否成功
     */
    const refreshKnowledgeBasesQuietly = async () => {
      try {
        const response = await getKnowledgeList()
        if (Array.isArray(response)) {
          knowledgeBases.value = response
          // 保持当前选中状态，除非选中的项目不存在了
          const currentSelectionExists = knowledgeBases.value.some(
            (kb) => kb._id === selectedKbId.value,
          )
          if (!currentSelectionExists && knowledgeBases.value.length > 0) {
            selectedKbId.value = knowledgeBases.value[0]._id
          } else if (knowledgeBases.value.length === 0) {
            selectedKbId.value = null
          }
          return true
        } else {
          console.error('静默刷新失败: API 返回的不是预期的数组格式', response)
          return false
        }
      } catch (err) {
        console.error('静默刷新知识库列表失败:', err)
        return false
      }
    }

    /**
     * @description 防抖刷新知识库列表（避免多个任务同时完成时频繁刷新）
     * @param {string} taskId - 触发刷新的任务ID（用于日志记录）
     */
    const debouncedRefreshKnowledgeBases = (taskId) => {
      // 清除之前的定时器
      if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer)
      }

      // 设置新的定时器
      refreshDebounceTimer = setTimeout(async () => {
        console.log(`任务 ${taskId} 触发防抖刷新，开始更新知识库列表`)
        const success = await refreshKnowledgeBasesQuietly()
        if (success) {
          console.log('知识库列表刷新成功')
        } else {
          console.error('知识库列表刷新失败')
        }
        refreshDebounceTimer = null
      }, REFRESH_DEBOUNCE_DELAY)

      console.log(`任务 ${taskId} 请求刷新，将在 ${REFRESH_DEBOUNCE_DELAY}ms 后执行`)
    }

    /**
     * @description 创建新的知识库
     * @param {object} data - 创建知识库所需的数据 (来自 CreateKnowledgeBaseDialog)
     * @returns {Promise<boolean>} 操作是否成功
     */
    const createKnowledgeBase = async (data) => {
      loading.value = true
      error.value = null
      try {
        await createKnowledge(data)
        ElMessage.success('知识库创建成功')
        await fetchKnowledgeBases() // 重新加载列表
        // 创建成功后，自动选中新创建的知识库 (如果 API 返回了 ID)
        // 这里假设 fetchKnowledgeBases 会处理选中逻辑，通常选中第一个
        return true
      } catch (err) {
        console.error('创建知识库失败:', err)
        error.value = err.message || '创建知识库失败'
        ElMessage.error(error.value)
        return false
      } finally {
        loading.value = false
      }
    }

    /**
     * @description 轮询任务状态直到完成或失败
     * @param {string} taskId - 任务ID
     * @param {string} fileName - 文件名（用于用户提示）
     * @returns {Promise<object>} 最终的任务状态对象
     */
    const pollTaskStatus = async (taskId, fileName) => {
      const maxAttempts = 60 // 最大轮询次数 (5分钟，每5秒一次)
      const pollInterval = 5000 // 轮询间隔 5秒
      let attempts = 0

      return new Promise((resolve, reject) => {
        const checkStatus = async () => {
          try {
            attempts++
            const taskStatus = await getTaskStatus(taskId)

            console.log(
              `文件 "${fileName}" 处理状态:`,
              taskStatus.status,
              `(${attempts}/${maxAttempts})`,
            )

            switch (taskStatus.status) {
              case 'completed':
                ElMessage.success(`文件 "${fileName}" 处理完成`)
                resolve(taskStatus)
                return

              case 'failed': {
                const errorMsg = taskStatus.error_message || '未知错误'
                ElMessage.error(`文件 "${fileName}" 处理失败: ${errorMsg}`)
                reject(new Error(`任务失败: ${errorMsg}`))
                return
              }

              case 'processing':
              case 'pending':
                // 继续轮询
                if (attempts >= maxAttempts) {
                  ElMessage.warning(`文件 "${fileName}" 处理超时，请稍后查看`)
                  reject(new Error('任务处理超时'))
                  return
                }

                // 设置下次轮询
                setTimeout(checkStatus, pollInterval)
                break

              default:
                console.warn(`未知任务状态: ${taskStatus.status}`)
                // 对于未知状态，继续轮询但减少剩余尝试次数
                if (attempts >= maxAttempts) {
                  ElMessage.warning(`文件 "${fileName}" 状态未知，请手动刷新查看`)
                  reject(new Error(`未知任务状态: ${taskStatus.status}`))
                  return
                }
                setTimeout(checkStatus, pollInterval)
                break
            }
          } catch (error) {
            console.error(`查询任务 ${taskId} 状态失败:`, error)
            if (attempts >= maxAttempts) {
              ElMessage.error(`无法查询文件 "${fileName}" 的处理状态`)
              reject(error)
              return
            }
            // 网络错误等，继续重试
            setTimeout(checkStatus, pollInterval)
          }
        }

        // 开始第一次检查
        checkStatus()
      })
    }

    /**
     * @description 上传文件到指定的知识库
     * @param {string} kbId - 目标知识库 ID
     * @param {FormData} formData - 包含文件的 FormData 对象
     * @returns {Promise<boolean>} 操作是否成功
     */
    const uploadFile = async (kbId, formData) => {
      loading.value = true
      error.value = null

      // 从 FormData 中获取文件名用于用户提示
      const file = formData.get('file')
      const fileName = file ? file.name : '未知文件'

      try {
        // 1. 上传文件，获取任务ID
        const uploadResponse = await uploadFileToKnowledgeBase(kbId, formData)
        const taskId = uploadResponse.task_id

        if (!taskId) {
          throw new Error('服务器未返回任务ID')
        }

        ElMessage.success(`文件 "${fileName}" 上传成功，正在后台处理...`)
        console.log(`开始监听任务 ${taskId} 的处理状态`)

        // 记录上传前的聊天选择状态
        const previousChatKbId = KBtoChat.value?._id
        const previousChatFileMd5 = FileToChat.value?.file_md5

        // 2. 异步监听任务状态（不阻塞用户界面）
        // 先释放 loading 状态，让用户可以继续操作
        loading.value = false

        // 在后台监听任务完成
        pollTaskStatus(taskId, fileName)
          .then(() => {
            console.log(`任务 ${taskId} 完成，触发防抖刷新`)

            // 使用防抖刷新机制，避免多个任务同时完成时频繁刷新
            debouncedRefreshKnowledgeBases(taskId)

            // 延迟更新聊天选择状态，等待刷新完成
            setTimeout(() => {
              // ---- 更新聊天选择状态 ----
              if (previousChatKbId) {
                // 查找更新后的知识库对象
                const updatedKbInChat = knowledgeBases.value.find(
                  (kb) => kb._id === previousChatKbId,
                )
                if (updatedKbInChat) {
                  // 如果找到了，更新 KBtoChat 为新的对象引用
                  KBtoChat.value = updatedKbInChat

                  // 检查之前选中的文件是否还存在于更新后的文件列表中
                  if (previousChatFileMd5) {
                    const updatedFileInChat = updatedKbInChat.filesList.find(
                      (f) => f.file_md5 === previousChatFileMd5,
                    )
                    if (updatedFileInChat) {
                      // 文件仍然存在，更新 FileToChat 为新的文件对象引用
                      FileToChat.value = updatedFileInChat
                    } else {
                      // 文件已被删除或不存在，清空文件选择
                      FileToChat.value = null
                    }
                  } else {
                    // 之前没有选择文件，保持 null
                    FileToChat.value = null
                  }
                } else {
                  // 如果之前选中的知识库在刷新后找不到了，清空聊天选择
                  KBtoChat.value = null
                  FileToChat.value = null
                }
              }
              // ---- 结束：更新聊天选择状态 ----
            }, REFRESH_DEBOUNCE_DELAY + 100) // 比防抖延迟稍长一点，确保刷新完成
          })
          .catch((error) => {
            console.error(`任务 ${taskId} 监听失败:`, error)
            // 任务失败时也尝试触发防抖刷新，以防有部分处理结果
            debouncedRefreshKnowledgeBases(taskId)
          })

        return true
      } catch (err) {
        console.error('文件上传失败:', err)
        error.value = err.message || '文件上传失败'
        ElMessage.error(error.value)
        return false
      } finally {
        // 确保在同步部分结束时释放 loading
        loading.value = false
      }
    }

    /**
     * @description 从指定的知识库中删除文件
     * @param {string} kbId - 目标知识库 ID
     * @param {string} fileMd5 - 要删除的文件的 MD5 值
     * @returns {Promise<boolean>} 操作是否成功
     */
    const deleteFile = async (kbId, fileMd5) => {
      try {
        await ElMessageBox.confirm('确定要删除这个文件吗？删除后无法恢复。', '删除确认', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning',
        })
        // 用户确认删除
        loading.value = true // 可以考虑为删除单独设置 loading 状态
        error.value = null
        try {
          await deleteFileFromKnowledgeBase(kbId, fileMd5)
          ElMessage.success('文件删除成功')

          // 记录删除前的聊天选择状态
          const previousChatKbId = KBtoChat.value?._id
          const previousChatFileMd5 = FileToChat.value?.file_md5

          await fetchKnowledgeBases() // 重新加载列表

          // ---- 新增：更新聊天选择状态 ----
          if (previousChatKbId) {
            // 查找更新后的知识库对象
            const updatedKbInChat = knowledgeBases.value.find(
              (kb) => kb._id === previousChatKbId,
            )
            if (updatedKbInChat) {
              // 如果找到了，更新 KBtoChat 为新的对象引用
              KBtoChat.value = updatedKbInChat

              // 检查之前选中的文件是否还存在于更新后的文件列表中
              if (previousChatFileMd5) {
                const updatedFileInChat = updatedKbInChat.filesList.find(
                  (f) => f.file_md5 === previousChatFileMd5,
                )
                if (updatedFileInChat) {
                  // 文件仍然存在，更新 FileToChat 为新的文件对象引用
                  FileToChat.value = updatedFileInChat
                } else {
                  // 文件已被删除或不存在，清空文件选择
                  FileToChat.value = null
                }
              } else {
                // 之前没有选择文件，保持 null
                FileToChat.value = null
              }
            } else {
              // 如果之前选中的知识库在刷新后找不到了（不太可能，除非KB被同时删除），清空聊天选择
              KBtoChat.value = null
              FileToChat.value = null
            }
          }
          // ---- 结束：更新聊天选择状态 ----

          return true
        } catch (err) {
          console.error('删除文件失败:', err)
          error.value = err.message || '删除文件失败'
          ElMessage.error(error.value)
          return false
        } finally {
          loading.value = false
        }
        // eslint-disable-next-line no-unused-vars
      } catch (_cancel) {
        // 用户取消删除
        ElMessage.info('已取消删除')
        return false // 返回 false 表示操作未执行
      }
    }

    /**
     * @description 删除指定的知识库及其所有文件
     * @param {string} kbId - 要删除的知识库的 ID
     * @returns {Promise<boolean>} 操作是否成功
     */
    const deleteKnowledge = async (kbId) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个知识库及其所有文件吗？删除后无法恢复。',
          '删除确认',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          },
        )
        // 用户确认删除
        loading.value = true
        error.value = null
        try {
          await deleteKnowledgeBase(kbId)
          ElMessage.success('知识库删除成功')
          await fetchKnowledgeBases() // 刷新列表
          // 如果删除的是当前选中的知识库，需要重新设置选中项(fetchKnowledgeBases 会处理)
          return true
        } catch (err) {
          console.error('删除知识库失败:', err)
          error.value = err.message || '删除知识库失败'
          ElMessage.error(error.value)
          return false
        } finally {
          loading.value = false
        }
        // eslint-disable-next-line no-unused-vars
      } catch (_cancel) {
        // 用户取消删除
        ElMessage.info('已取消删除')
        return false
      }
    }

    /**
     * @description 应用启动时尝试从 localStorage 加载缓存
     *   (由 pinia-plugin-persistedstate 自动处理，此函数可能无需手动调用，
     *    除非你想在特定时机强制加载)
     */
    const loadFromLocalStorage = () => {
      // 通常 Pinia 持久化插件会自动处理加载
      // 如果需要手动逻辑，可以在这里实现
      console.log('尝试从 localStorage 加载 knowledge store...')
    }

    // 新增：设置聊天时使用的知识库
    const setChatKnowledgeBase = (kb) => {
      KBtoChat.value = kb
      // 重置文件选择
      FileToChat.value = null
    }

    // 新增：设置聊天时使用的文件
    const setChatFile = (file) => {
      FileToChat.value = file
    }

    // 新增：清除聊天时的知识库和文件选择
    const clearChatKnowledgeBase = () => {
      KBtoChat.value = null
      FileToChat.value = null
    }

    return {
      // State
      knowledgeBases,
      selectedKbId,
      loading,
      error,
      KBtoChat,
      FileToChat,
      // Getters
      selectedKnowledgeBase,
      // Actions
      fetchKnowledgeBases,
      refreshKnowledgeBasesQuietly, // 静默刷新函数
      setSelectedKbId,
      createKnowledgeBase,
      uploadFile,
      deleteFile,
      deleteKnowledge, // 导出删除知识库 action
      loadFromLocalStorage, // 保留以备将来使用
      // 新增的 actions
      setChatKnowledgeBase,
      setChatFile,
      clearChatKnowledgeBase,
    }
  },
  {
    // Pinia 持久化配置
    persist: {
      enabled: true,
      strategies: [
        {
          key: STORE_KEY,
          storage: localStorage,
          paths: ['knowledgeBases', 'selectedKbId', 'KBtoChat', 'FileToChat'], // 添加新的持久化字段
        },
      ],
    },
  },
)
