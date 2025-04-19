import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getKnowledgeList,
  createKnowledge,
  uploadFileToKnowledgeBase,
  deleteFileFromKnowledgeBase,
  deleteKnowledgeBase, // 引入删除知识库 API
} from '@/api/knowledgeAPI'
import { ElMessage, ElMessageBox } from 'element-plus'

const STORE_KEY = 'knowledge_base_store' // localStorage key

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
     * @description 上传文件到指定的知识库
     * @param {string} kbId - 目标知识库 ID
     * @param {FormData} formData - 包含文件的 FormData 对象
     * @returns {Promise<boolean>} 操作是否成功
     */
    const uploadFile = async (kbId, formData) => {
      loading.value = true // 可以考虑为上传单独设置 loading 状态
      error.value = null
      try {
        await uploadFileToKnowledgeBase(kbId, formData)
        ElMessage.success('文件上传成功')
        await fetchKnowledgeBases() // 重新加载列表以更新文件列表
        // 或者可以尝试局部更新:
        // const kbIndex = knowledgeBases.value.findIndex(kb => kb._id === kbId);
        // if (kbIndex !== -1) {
        //   // 需要 API 返回新文件的信息才能精确更新
        //   // 假设 API 返回了更新后的文件列表 或 新文件对象
        // }
        return true
      } catch (err) {
        console.error('文件上传失败:', err)
        error.value = err.message || '文件上传失败'
        ElMessage.error(error.value)
        return false
      } finally {
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
          await fetchKnowledgeBases() // 重新加载列表
          // 或者局部更新
          // const kbIndex = knowledgeBases.value.findIndex(kb => kb._id === kbId);
          // if (kbIndex !== -1) {
          //   knowledgeBases.value[kbIndex].filesList = knowledgeBases.value[kbIndex].filesList.filter(f => f.file_md5 !== fileMd5);
          // }
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
