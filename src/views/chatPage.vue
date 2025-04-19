<script setup>
// chatPage.vue script部分
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Plus,
  Delete,
  Setting,
  MoreFilled,
  Edit,
  Collection,
  VideoPause,
} from '@element-plus/icons-vue'
import { ElMessage, ElEmpty, ElMessageBox, ElNotification } from 'element-plus'
import { getSessionHistoryAPI } from '@/api/sessionAPI'
import { oneapiModelListStore, useAuthStore } from '@/stores'
import { useAssistantStore } from '@/stores/modules/assistant'
import { useSessionStore } from '@/stores/modules/session'
import { useKnowledgeStore } from '@/stores/modules/knowledge'
import { useChatConfigStore } from '@/stores/modules/chatConfig'
import { renderMarkdown } from '@/utils/markdown'
import CreateAssistantDialog from '@/components/CreateAssistantDialog.vue'
import EditAssistantDialog from '@/components/EditAssistantDialog.vue'
import EditSessionDialog from '@/components/EditSessionDialog.vue'
import SettingSlider from '@/components/SettingSlider.vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { baseURL } from '@/utils/request'
const OneapiStore = oneapiModelListStore()
const assistantStore = useAssistantStore()
const sessionStore = useSessionStore()
const knowledgeStore = useKnowledgeStore()
const chatConfigStore = useChatConfigStore()

// 在组件挂载时初始化
onMounted(async () => {
  OneapiStore.init()
  await assistantStore.fetchAssistantList()
  await knowledgeStore.fetchKnowledgeBases()
  const currentAssistant = assistantStore.currentAssistant
  if (currentAssistant && currentAssistant._id) {
    await sessionStore.fetchSessionList(currentAssistant._id)
  }
})

// 在组件卸载时清理
onUnmounted(() => {
  OneapiStore.cleanup()
  if (abortController.value) {
    abortController.value.abort()
  }
})

// 计算属性：当前选中的令牌名称
const selectedTokenName = computed(() => OneapiStore.selectedToken?.name || '选择令牌')

// 计算属性：当前选中的模型名称
const selectedModelName = computed(() => OneapiStore.selectedModel || '选择模型')

// 计算属性：当前选中的知识库名称
const selectedKnowledgeBaseName = computed(() =>
  knowledgeStore.KBtoChat ? knowledgeStore.KBtoChat.title : '不使用知识库',
)

// 计算属性：当前选中的文件名称
const selectedFileName = computed(() =>
  knowledgeStore.FileToChat ? knowledgeStore.FileToChat.file_name : '文件全选',
)

// 处理令牌选择
const handleSelectToken = (token) => {
  OneapiStore.selectToken(token)
}

// 处理模型选择
const handleSelectModel = (modelId) => {
  OneapiStore.selectModel(modelId)
  ElMessage.success(`已切换到模型: ${modelId}`)
}

// 处理知识库选择
const handleSelectKnowledgeBase = (kb) => {
  if (!kb) {
    knowledgeStore.clearChatKnowledgeBase()
    return
  }
  knowledgeStore.setChatKnowledgeBase(kb)
}

// 处理文件选择
const handleSelectFile = (file) => {
  if (!file) {
    knowledgeStore.setChatFile(null)
    return
  }
  knowledgeStore.setChatFile(file)
}

// 当前选中的助手和话题
const currentAssistant = computed(() => assistantStore.getCurrentAssistant)
const currentSession = computed(() => sessionStore.getCurrentSession)

// 聊天消息
const messages = ref([])
// 输入框内容
const inputMessage = ref('')
// 消息加载状态 (用于历史记录)
const messagesLoading = ref(false)
// 流式响应状态
const isStreaming = ref(false)
// AbortController ref
const abortController = ref(null)
// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const totalPages = ref(0)
// 消息渲染相关
const renderedMessages = ref([])
const scrollbarRef = ref(null)

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const scrollbar = scrollbarRef.value
    if (scrollbar && typeof scrollbar.scrollTo === 'function') {
      const wrap = scrollbar.wrapRef
      if (wrap) {
        const scrollHeight = wrap.scrollHeight
        scrollbar.scrollTo({ top: scrollHeight, behavior: 'smooth' })
      } else {
        // 保留警告日志
        console.warn('Scrollbar wrapRef not found when trying to get scrollHeight.')
        scrollbar.scrollTo({ top: 999999, behavior: 'smooth' })
        console.warn('Falling back to scrollTo a large number.')
      }
    } else {
      // 保留警告日志
      console.warn('Scrollbar instance or scrollTo method not found.')
    }
  })
}

// 监听消息变化，自动渲染 Markdown
watch(
  messages,
  async (newMessages) => {
    try {
      renderedMessages.value = await Promise.all(
        newMessages.map(async (msg) => {
          return {
            ...msg,
            renderedContent: await renderMarkdown(msg.content),
          }
        }),
      )
    } catch (error) {
      console.error('渲染消息时出错:', error)
      renderedMessages.value = newMessages.map((msg) => ({
        ...msg,
        renderedContent: msg.content,
      }))
    }
  },
  { deep: true, immediate: true },
)

// 监听渲染后的消息变化，自动滚动到底部
watch(
  renderedMessages,
  (newRenderedMessages, oldRenderedMessages) => {
    if (newRenderedMessages.length > oldRenderedMessages?.length) {
      scrollToBottom()
    }
  },
  { deep: true },
)

// 聊天配置
const chat_config = ref({
  chat_history_max_length: 5,
  prompt_override: assistantStore.currentAssistant?.prompt || '',
})
// llm 模型配置
const llm_config = computed(() => ({
  supplier: 'oneapi',
  model: OneapiStore.selectedModel,
  api_key: OneapiStore.selectedToken?.key ? `sk-${OneapiStore.selectedToken.key}` : '',
  temperature: chatConfigStore.temperature,
}))
// 知识库配置
const knowledge_config = ref(null) // 初始值设为 null

// 监听 KBtoChat 和 FileToChat 的变化，更新 knowledge_config
watch(
  [
    () => knowledgeStore.KBtoChat,
    () => knowledgeStore.FileToChat,
    () => chatConfigStore.searchK, // 添加对 searchK 的监听
  ],
  ([newKB, newFile, newSearchK]) => {
    if (!newKB) {
      knowledge_config.value = null
    } else {
      knowledge_config.value = {
        knowledge_base_id: newKB._id,
        search_k: newSearchK, // 使用最新的 searchK 值
        embedding_supplier: 'oneapi',
        embedding_model: 'BAAI/bge-m3',
        embedding_api_key: OneapiStore.selectedToken?.key
          ? `sk-${OneapiStore.selectedToken.key}`
          : '',
        ...(newFile ? { filter_by_file_md5: newFile.file_md5 } : {}),
      }
    }
  },
  { immediate: true },
)

// 选项卡激活项
const activeTab = ref('assistants')

const assistants = computed(() => assistantStore.getAssistantList)
const topics = computed(() => sessionStore.getSessionsList)

// 选择助手
const handleSelectAssistant = async (assistant) => {
  assistantStore.selectAssistant(assistant)

  // 立即加载该助手的会话列表
  if (assistant && assistant._id) {
    await sessionStore.fetchSessionList(assistant._id)
  }

  // 切换到话题标签页
  activeTab.value = 'topics'
}

// 选择话题
const handleSelectSession = (session) => {
  sessionStore.setCurrentSession(session)
  loadMessages()
}

// 加载消息记录 - 保留原有错误日志
const loadMessages = async () => {
  if (!currentSession.value?._id) {
    messages.value = []
    return
  }
  messagesLoading.value = true
  try {
    const response = await getSessionHistoryAPI(currentSession.value._id, {
      page: currentPage.value,
      page_size: pageSize.value,
    })
    totalPages.value = response.total_pages
    messages.value = response.items
  } catch (error) {
    console.error('加载消息记录失败:', error)
    ElMessage.error('加载消息记录失败')
    messages.value = []
  } finally {
    messagesLoading.value = false
  }
}

// 加载更多历史消息
const loadMoreMessages = async () => {
  if (currentPage.value >= totalPages.value || messagesLoading.value) return
  currentPage.value++
  messagesLoading.value = true

  try {
    const response = await getSessionHistoryAPI(currentSession.value._id, {
      page: currentPage.value,
      page_size: pageSize.value,
    })

    const scrollbar = scrollbarRef.value?.wrap
    const oldScrollHeight = scrollbar?.scrollHeight || 0

    messages.value = [...response.items, ...messages.value]

    nextTick(() => {
      if (scrollbar) {
        const newScrollHeight = scrollbar.scrollHeight
        scrollbar.scrollTop =
          newScrollHeight - oldScrollHeight + (scrollbar.scrollTop || 0)
      }
    })
  } catch (error) {
    currentPage.value--
    console.error('加载更多消息失败:', error)
    ElMessage.error('加载更多消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// 处理滚动事件
const handleScroll = ({ scrollTop }) => {
  if (scrollTop < 10 && !messagesLoading.value && currentPage.value < totalPages.value) {
    loadMoreMessages()
  }
}

// 发送消息函数 - 重构为使用 fetchEventSource
const sendMessage = async () => {
  // 1. 前置检查 (Guard Clauses)
  if (!OneapiStore.selectedModel) {
    ElMessage.info('请先选择一个模型')
    return
  }
  if (!currentSession.value) {
    ElMessage.info('请先选择一个话题')
    return
  }
  if (!inputMessage.value.trim() || isStreaming.value) return // 防止重复发送或在流式传输时发送

  // 2. 取消之前的流式请求 (如果存在)
  if (abortController.value) {
    abortController.value.abort()
    console.log('Previous stream aborted.')
  }

  // 3. 初始化本次请求
  abortController.value = new AbortController() // 创建新的 AbortController
  const userMessageContent = inputMessage.value.trim()
  const userMessage = {
    // 准备用户消息对象
    id: Date.now(),
    type: 'human',
    content: userMessageContent,
  }
  messages.value.push(userMessage) // 将用户消息添加到聊天记录

  // 4. 构建请求体 (Payload)
  const messagePayload = {
    question: userMessageContent,
    session_id: currentSession.value?._id,
    chat_config: chat_config.value,
    llm_config: llm_config.value,
    ...(knowledge_config.value ? { knowledge_config: knowledge_config.value } : {}), // 动态添加知识库配置
  }

  // 5. 更新 UI 状态 (开始流式传输)
  inputMessage.value = '' // 清空输入框
  isStreaming.value = true // 设置为流式状态 (会禁用输入框，改变发送按钮)

  // 6. 添加 AI 消息占位符
  const aiMessageId = Date.now() + 1 // 为 AI 回复生成唯一 ID
  messages.value.push({
    id: aiMessageId,
    type: 'ai',
    content: '', // 初始内容为空，等待后续 chunk 更新
  })
  let accumulatedContent = '' // 用于累积收到的文本块

  // 7. 调用 fetchEventSource 发起 SSE 请求
  try {
    console.log('发送流式消息 payload:', messagePayload)
    await fetchEventSource(baseURL + '/chat/stream', {
      // baseURL 来自 @/utils/request
      method: 'POST', // 使用 POST 方法
      headers: {
        'Content-Type': 'application/json', // 告知后端发送的是 JSON
        Accept: 'text/event-stream', // 表明希望接收 SSE 流
      },
      body: JSON.stringify(messagePayload), // 将 JS 对象序列化为 JSON 字符串
      signal: abortController.value.signal, // 关联 AbortController，用于取消请求

      // 8. 事件处理回调函数

      // 8.1 onopen: 连接成功建立时调用
      onopen(response) {
        if (
          response.ok && // 确保 HTTP 状态码是 2xx
          response.headers.get('content-type')?.includes('text/event-stream') // 确认响应类型正确
        ) {
          console.log('SSE connection opened.')
          // 连接成功，AI 消息占位符已添加，等待 onmessage
        } else {
          // 如果连接不成功或响应类型不对，则认为失败
          isStreaming.value = false // 重置流式状态
          throw new Error(`Failed to connect: ${response.status} ${response.statusText}`) // 抛出错误，会被外层 catch 或 onerror 捕获
        }
      },

      // 8.2 onmessage: 每次收到服务器发送的事件 (data: ...\n\n) 时调用
      onmessage(event) {
        console.log('Received SSE data:', event.data)
        try {
          const parsedData = JSON.parse(event.data) // 解析收到的 JSON 字符串
          // 找到对应的 AI 消息占位符
          const aiMessageIndex = messages.value.findIndex((msg) => msg.id === aiMessageId)

          if (aiMessageIndex === -1) {
            // 如果找不到，可能消息已被删除或出现异常
            console.warn('AI message placeholder not found.')
            return
          }

          // 根据事件类型处理
          if (parsedData.type === 'context') {
            // 处理上下文信息，可以使用 ElNotification 弹出通知
            console.log('Context received:', parsedData.data)
            // ElNotification({ title: 'Context', message: parsedData.data, type: 'info' })
          } else if (parsedData.type === 'chunk') {
            // 核心：处理文本块
            accumulatedContent += parsedData.data // 将新块追加到累积内容
            // 更新 Vue ref 中对应消息的内容，触发界面响应式更新
            messages.value[aiMessageIndex].content = accumulatedContent
            scrollToBottom() // 收到新内容，自动滚动到底部
          } else if (parsedData.type === 'error') {
            // 处理流内由后端报告的错误
            console.error('Stream error reported:', parsedData.data)
            messages.value[aiMessageIndex].content += `\n\n**错误:** ${parsedData.data}` // 将错误信息附加到消息末尾
            ElMessage.error(`流式响应出错: ${parsedData.data}`)
            // 发生错误，尝试中止连接
            if (abortController.value) {
              abortController.value.abort()
            }
          }
        } catch (e) {
          // 处理 JSON 解析失败的情况
          console.error('Failed to parse SSE data:', e, 'Raw data:', event.data)
          const aiMessageIndex = messages.value.findIndex((msg) => msg.id === aiMessageId)
          if (aiMessageIndex !== -1 && event.data && typeof event.data === 'string') {
            // 尝试将原始错误数据附加到消息中
            messages.value[aiMessageIndex].content +=
              `\n\n**解析错误，原始数据:** ${event.data}`
          }
          ElMessage.error('接收到无效的数据格式')
          // 解析错误，中止连接
          if (abortController.value) {
            abortController.value.abort()
          }
        }
      },

      // 8.3 onclose: 连接正常关闭时调用 (服务器关闭或客户端调用 abort())
      onclose() {
        console.log('SSE connection closed.')
        isStreaming.value = false // 重置流式状态
        abortController.value = null // 重置 AbortController 引用
        scrollToBottom() // 确保最后滚动到底部
      },

      // 8.4 onerror: 发生错误时调用 (网络错误、onopen/onmessage 中抛出的错误、AbortError)
      onerror(err) {
        console.error('SSE error:', err)
        isStreaming.value = false // 只要出错，就重置流式状态 (除了 AbortError)

        // 找到 AI 消息
        const aiMessageIndex = messages.value.findIndex((msg) => msg.id === aiMessageId)

        // 特殊处理 AbortError (用户手动取消)
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user.')
          // 如果 AI 消息还是空的，就把它从列表里移除
          if (aiMessageIndex !== -1 && !messages.value[aiMessageIndex].content) {
            messages.value.splice(aiMessageIndex, 1)
          }
          // **重要:** 对于 AbortError，我们直接 return，不执行后续错误处理，
          // 也不抛出错误，以防止库尝试重连。状态重置由 handleStopStreaming 或 onclose 处理。
          return
        }

        // 处理其他类型的错误 (网络、连接等)
        ElMessage.error(`连接错误: ${err.message || '未知错误'}`)
        if (aiMessageIndex !== -1) {
          // 在 AI 消息末尾附加错误信息
          messages.value[aiMessageIndex].content +=
            `\n\n**连接错误:** ${err.message || '未知错误'}`
        } else {
          // 如果连 AI 占位符都没有（可能 onopen 就失败了），则添加一条错误消息
          messages.value.push({
            id: Date.now(),
            type: 'ai',
            content: `**连接错误:** ${err.message || '未知错误'}`,
          })
        }

        abortController.value = null // 重置 AbortController 引用
        // **重要:** 对于非 AbortError，必须抛出错误 (throw err) 或不返回。
        // 这是 fetchEventSource 库的设计，抛出错误会阻止它默认的重连尝试。
        throw err
      },
    })
  } catch (err) {
    // 9. 捕获 fetchEventSource 启动时的错误
    // 这个 catch 主要捕获 fetchEventSource 启动时就发生的错误，
    // 例如 DNS 解析失败、网络连接无法建立等，这些错误发生在 onopen 之前。
    // onerror 中 throw 的错误也会在这里被捕获，但我们主要处理非 AbortError。
    console.error('Error initiating SSE request:', err)
    isStreaming.value = false // 确保重置状态

    if (err.name !== 'AbortError') {
      // AbortError 已在 onerror 处理
      ElMessage.error(`请求失败: ${err.message || '未知错误'}`)
      // 标记用户消息发送失败
      const userMessageIndex = messages.value.findIndex(
        (msg) => msg.id === userMessage.id,
      )
      if (userMessageIndex !== -1) {
        messages.value[userMessageIndex].content += ' (发送失败)'
      }
      // 移除可能已添加的 AI 占位符
      const aiMessageIndex = messages.value.findIndex((msg) => msg.id === aiMessageId)
      if (aiMessageIndex !== -1) {
        messages.value.splice(aiMessageIndex, 1)
      }
    }
    abortController.value = null // 重置 AbortController 引用
  }
}

// 处理停止流式传输的函数
const handleStopStreaming = () => {
  if (abortController.value) {
    abortController.value.abort()
    console.log('User requested to stop streaming.')
    // 主动重置状态，确保 UI 立即响应
    isStreaming.value = false
    abortController.value = null
  }
}

// 控制创建助手对话框
const showCreateAssistantDialog = ref(false)

const handleCreateAssistantConfirm = (assistantData) => {
  assistantStore.createAssistant(assistantData)
}

// 监听当前助手的变化，以加载会话列表
watch(
  () => assistantStore.currentAssistant,
  async (newAssistant) => {
    if (newAssistant && newAssistant._id) {
      await sessionStore.fetchSessionList(newAssistant._id)
    } else {
      sessionStore.sessionsList = []
      sessionStore.currentSession = null
    }
  },
  { immediate: true }, // 添加 immediate: true，确保组件挂载时就执行一次
)

// 打开创建助手对话框
const openCreateAssistantDialog = () => {
  showCreateAssistantDialog.value = true
}

// 创建新会话
const handleCreateSession = () => {
  sessionStore.createSession()
}

// 编辑助手相关
const showEditAssistantDialog = ref(false)
const editingAssistant = ref(null)

const handleEditAssistant = (assistant) => {
  editingAssistant.value = assistant
  showEditAssistantDialog.value = true
}

const handleEditAssistantConfirm = async (data) => {
  try {
    // 在data中加入参数username
    data.username = useAuthStore().user.username
    await assistantStore.updateAssistant(editingAssistant.value._id, data)
    showEditAssistantDialog.value = false
    editingAssistant.value = null
  } catch (error) {
    console.error('编辑助手失败:', error)
  }
}

const handleDeleteAssistant = async (assistant) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除助手 "${assistant.name || assistant.title}" 吗？\n删除后将无法恢复，且相关的会话也会被删除。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await assistantStore.deleteAssistant(assistant._id)
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除助手失败:', err)
    }
  }
}

// 编辑会话相关
const showEditSessionDialog = ref(false)
const editingSession = ref(null)

const handleEditSession = (session) => {
  editingSession.value = session
  showEditSessionDialog.value = true
}

const handleEditSessionConfirm = async (data) => {
  try {
    await sessionStore.updateSessionTitle(editingSession.value._id, data.title)
    showEditSessionDialog.value = false
    editingSession.value = null
  } catch (error) {
    console.error('编辑会话失败:', error)
  }
}

const handleDeleteSession = async (session) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除会话 "${session.name || session.title}" 吗？\n删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await sessionStore.deleteSession(session._id)
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除会话失败:', err)
    }
  }
}

// 新增：处理删除按钮点击
const handleDeleteButtonClick = () => {
  ElNotification({
    title: 'Hello~你好呀',
    message: '功能开发中，敬请期待',
    type: 'info',
  })
}

// 新增：处理设置按钮点击
const handleSettingButtonClick = () => {
  ElNotification({
    title: 'Hello~你好呀',
    message: '功能开发中，敬请期待',
    type: 'info',
  })
}
</script>

<template>
  <div class="chat-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 选项卡 -->
      <el-tabs v-model="activeTab" class="tabs">
        <el-tab-pane label="助手" name="assistants">
          <!-- 助手列表 -->
          <div class="list-header">
            <span>我的助手</span>
            <el-button
              @click="openCreateAssistantDialog"
              type="primary"
              :icon="Plus"
              circle
              size="small"
            />
          </div>
          <div class="list-content">
            <div v-if="assistants.length > 0">
              <div
                v-for="assistant in assistants"
                :key="assistant._id"
                class="list-item"
                :class="{ active: currentAssistant?._id === assistant._id }"
                @click="handleSelectAssistant(assistant)"
              >
                <span class="item-name">{{ assistant.name || assistant.title }}</span>
                <el-dropdown trigger="click" @click.stop>
                  <el-button
                    :icon="MoreFilled"
                    circle
                    size="small"
                    class="action-button"
                    @click.stop
                  />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEditAssistant(assistant)">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteAssistant(assistant)">
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <el-empty v-else description="创建一个新助手吧" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="话题" name="topics">
          <!-- 话题列表 -->
          <div class="list-header">
            <span>当前话题</span>
            <el-button
              type="primary"
              @click="handleCreateSession"
              :icon="Plus"
              circle
              size="small"
              :disabled="!currentAssistant"
            />
          </div>
          <div class="list-content">
            <div v-if="topics.length > 0">
              <div
                v-for="topic in topics"
                :key="topic._id"
                class="list-item"
                :class="{ active: currentSession?._id === topic._id }"
                @click="handleSelectSession(topic)"
              >
                <div class="topic-info">
                  <div class="topic-name">{{ topic.name || topic.title }}</div>
                </div>
                <el-dropdown trigger="click" @click.stop>
                  <el-button
                    :icon="MoreFilled"
                    circle
                    size="small"
                    class="action-button"
                  />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEditSession(topic)">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteSession(topic)">
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <el-empty v-else description="创建一个新会话吧" :image-size="60" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="设置" name="settings">
          <!-- 设置选项 -->
          <div class="settings-content">
            <SettingSlider
              v-model="chatConfigStore.searchK"
              label="知识库检索片段"
              description="设置每次检索时返回的相关文本片段数量。数值越大，召回的内容越多，但可能会增加噪音。"
              :min="1"
              :max="10"
              :step="1"
              @change="chatConfigStore.setSearchK"
            />

            <SettingSlider
              v-model="chatConfigStore.temperature"
              label="模型温度"
              description="控制模型回答的创造性。较低的值会产生更确定和一致的回答，较高的值会产生更多样和创造性的回答。"
              :min="0"
              :max="2"
              :step="0.1"
              @change="chatConfigStore.setTemperature"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <template v-if="currentSession">
        <!-- 聊天记录 -->
        <div class="chat-messages" v-loading="messagesLoading">
          <el-scrollbar height="100%" ref="scrollbarRef" @scroll="handleScroll">
            <div class="messages-container">
              <transition-group name="message-fade">
                <div
                  v-for="message in renderedMessages"
                  :key="message.id"
                  class="message"
                  :class="message.type"
                >
                  <div
                    class="message-content markdown-body"
                    v-html="message.renderedContent"
                  ></div>
                </div>
              </transition-group>
            </div>
          </el-scrollbar>
          <!-- 添加流式加载提示 -->
          <div v-if="isStreaming" class="streaming-indicator">...</div>
        </div>

        <!-- 输入框区域 -->
        <div class="chat-input">
          <!-- 在流式传输时禁用输入框 -->
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入消息..."
            @keyup.enter="sendMessage"
            :disabled="isStreaming"
          />
          <div class="input-actions">
            <!--左侧下拉菜单按钮组 -->
            <el-button-group class="el-button-group-chat-left">
              <!-- 令牌选择下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button :icon="MoreFilled" :loading="OneapiStore.loading">
                  {{ selectedTokenName }}
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="OneapiStore.tokenList.length === 0">
                      <el-dropdown-item disabled>暂无可用令牌</el-dropdown-item>
                    </template>
                    <template v-else>
                      <el-dropdown-item
                        v-for="token in OneapiStore.tokenList"
                        :key="token.id"
                        :disabled="token.status === 0"
                        :class="{
                          'token-disabled': token.status === 0,
                          'token-selected': token.id === OneapiStore.selectedToken?.id,
                        }"
                        @click="handleSelectToken(token)"
                      >
                        <div class="token-item">
                          <span class="token-name">{{ token.name }}</span>
                          <span class="token-quota">{{
                            OneapiStore.getTokenQuota(token)
                          }}</span>
                        </div>
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 模型选择下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button :icon="MoreFilled" :disabled="!OneapiStore.selectedToken">
                  {{ selectedModelName }}
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="!OneapiStore.selectedToken">
                      <el-dropdown-item disabled>请先选择令牌</el-dropdown-item>
                    </template>
                    <template v-else-if="OneapiStore.availableModels.length === 0">
                      <el-dropdown-item disabled>暂无可用模型</el-dropdown-item>
                    </template>
                    <template v-else>
                      <el-dropdown-item
                        v-for="modelId in OneapiStore.availableModels"
                        :key="modelId"
                        :class="{
                          'model-selected': modelId === OneapiStore.selectedModel,
                        }"
                        @click="handleSelectModel(modelId)"
                      >
                        {{ modelId }}
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 知识库选择下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button>
                  <el-icon><Collection /></el-icon>
                  {{ selectedKnowledgeBaseName }}
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="knowledgeStore.knowledgeBases.length === 0">
                      <el-dropdown-item disabled>暂无可用知识库</el-dropdown-item>
                    </template>
                    <template v-else>
                      <!-- 添加"不使用知识库"选项 -->
                      <el-dropdown-item
                        :class="{
                          'kb-selected': !knowledgeStore.KBtoChat,
                        }"
                        @click="handleSelectKnowledgeBase(null)"
                      >
                        不使用知识库
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-for="kb in knowledgeStore.knowledgeBases"
                        :key="kb._id"
                        :class="{
                          'kb-selected': kb._id === knowledgeStore.KBtoChat?._id,
                        }"
                        @click="handleSelectKnowledgeBase(kb)"
                      >
                        <div class="kb-item">
                          <span class="kb-name">{{ kb.title }}</span>
                          <span class="kb-files-count"
                            >{{ kb.filesList?.length || 0 }} 个文件</span
                          >
                        </div>
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 文件选择下拉菜单 -->
              <el-dropdown trigger="click" :disabled="!knowledgeStore.KBtoChat">
                <el-button :disabled="!knowledgeStore.KBtoChat">
                  {{ selectedFileName }}
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="!knowledgeStore.KBtoChat">
                      <el-dropdown-item disabled>请先选择知识库</el-dropdown-item>
                    </template>
                    <template v-else>
                      <!-- 添加"文件全选"选项 -->
                      <el-dropdown-item
                        :class="{
                          'file-selected': !knowledgeStore.FileToChat,
                        }"
                        @click="handleSelectFile(null)"
                      >
                        文件全选
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-for="file in knowledgeStore.KBtoChat.filesList"
                        :key="file.file_md5"
                        :class="{
                          'file-selected':
                            file.file_md5 === knowledgeStore.FileToChat?.file_md5,
                        }"
                        @click="handleSelectFile(file)"
                      >
                        {{ file.file_name }}
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>

            <!-- 右侧聊天按钮组 -->
            <el-button-group>
              <el-button :icon="Delete" @click="handleDeleteButtonClick"></el-button>
              <el-button :icon="Setting" @click="handleSettingButtonClick"></el-button>
              <!-- 条件渲染发送/停止按钮 -->
              <el-button
                v-if="!isStreaming"
                @click="sendMessage"
                :disabled="!inputMessage.trim()"
              >
                ⬆️
                <!-- 发送图标 -->
              </el-button>
              <el-button
                v-else
                @click="handleStopStreaming"
                :icon="VideoPause"
                type="danger"
              >
                <!-- 停止图标, 使用 danger 类型以示区分 -->
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="empty-state">
          <el-empty description="请选择一个话题开始聊天" />
        </div>
      </template>
    </div>

    <CreateAssistantDialog
      v-model="showCreateAssistantDialog"
      @confirm="handleCreateAssistantConfirm"
    />

    <!-- 编辑助手对话框 -->
    <EditAssistantDialog
      v-model="showEditAssistantDialog"
      :assistant="editingAssistant"
      @confirm="handleEditAssistantConfirm"
    />

    <!-- 编辑会话对话框 -->
    <EditSessionDialog
      v-model="showEditSessionDialog"
      :session="editingSession"
      @confirm="handleEditSessionConfirm"
    />
  </div>
</template>

<style lang="scss">
/* 移除 scoped，因为需要影响全局样式 */
.el-dropdown-menu {
  .el-dropdown-menu__item {
    .token-item,
    .kb-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      width: 100%;

      .token-name,
      .kb-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 5px;
      }

      .token-quota,
      .kb-files-count {
        color: $primary-color;
        font-size: 0.9em;
        white-space: nowrap;
      }
    }
  }

  .token-disabled {
    opacity: 0.5;
    text-decoration: line-through;

    .token-quota {
      text-decoration: line-through;
    }
  }

  .token-selected,
  .model-selected,
  .kb-selected,
  .file-selected {
    color: $primary-color;
    font-weight: 500;

    &::after {
      content: '✓';
      margin-left: 8px;
      color: $primary-color;
    }
  }
}

/* 移除 scoped，使样式可以影响 v-html 内容 */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
  }

  p {
    margin: 0.5em 0;
  }

  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family:
      ui-monospace,
      SFMono-Regular,
      SF Mono,
      Menlo,
      Consolas,
      Liberation Mono,
      monospace;
  }

  pre {
    padding: 16px;
    overflow: auto;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin: 0.5em 0;

    code {
      padding: 0;
      margin: 0;
      font-size: 1em;
      background-color: transparent;
      border: 0;
      white-space: pre;
      word-break: normal;
      overflow-wrap: normal;
    }
  }

  ul,
  ol {
    padding-left: 2em;
    margin: 0.5em 0;
  }

  li {
    margin: 0.25em 0;
  }

  blockquote {
    padding: 0 1em;
    color: #656d76;
    border-left: 0.25em solid #d0d7de;
    margin: 0.5em 0;
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
    margin: 0.5em 0;
    width: 100%;

    th,
    td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }

    tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
  }

  img {
    max-width: 100%;
    height: auto;
  }

  a {
    color: #0969da;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 40px);
  background-color: $light-bg;
  border-radius: $border-radius-m;

  .sidebar {
    width: 200px;
    display: flex;
    flex-direction: column;

    .tabs {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.el-tabs__nav) {
        // :deep() 保持在直接父级
        padding: 0 16px;
      }

      :deep(.el-tabs__content) {
        // :deep() 保持在直接父级
        flex: 1;
        overflow-y: auto;
      }

      // 通用列表样式 (提取公共部分)
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e6e6e6;

        span {
          font-weight: 500;
          color: $text-primary;
        }
      }

      .list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        cursor: pointer;
        margin-bottom: 8px;
        transition: all 0.3s;

        &:hover {
          background-color: $primary-hover;
        }

        &.active {
          background-color: $primary-active;
        }

        .item-name {
          margin-left: 12px;
          font-size: 14px;
          flex: 1;
        }

        .topic-info {
          flex: 1;
          margin-left: 12px;

          .topic-name {
            font-size: 14px;
            margin-bottom: 4px;
          }
        }

        .action-button {
          opacity: 0.6;
          color: $text-secondary;
          background: transparent;
          border: none;
          padding: 6px;
          margin-left: 8px;

          &:hover {
            opacity: 1;
            background-color: rgba(0, 0, 0, 0.1);
          }
        }
      }

      // 设置 Tab 特定样式
      .settings-content {
        padding: 16px; // 示例：给设置内容一些内边距
      }
    }
  }

  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: $light-bg;

    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      margin: 16px;
      border-radius: $border-radius-m;
      box-shadow: $box-shadow-inner-L; //内凹效果
      background-color: $light-bg;

      // 隐藏滚动条但保留滚动功能
      scrollbar-width: none; /* Firefox */
      &::-webkit-scrollbar {
        display: none; /* Chrome/Safari/Edge */
      }

      .messages-container {
        min-height: 100%;
      }

      .message {
        // message 的基础样式
        display: flex;
        margin-bottom: 20px;
        max-width: 80%;

        .message-content {
          padding: 12px 16px;
          border-radius: $border-radius-m;
          font-size: 14px;
          line-height: 1.5;
        }

        // 用户消息特定样式
        &.human {
          justify-content: flex-end; // 移到这里
          margin-left: auto; // 推到右边

          .message-content {
            background-color: $primary-color; // 统一主色调
            color: #fff;
            box-shadow: // 可以给用户消息也加一点阴影
              2px 2px 4px rgba(0, 0, 0, 0.1),
              -2px -2px 4px rgba(255, 255, 255, 0.6);
          }
        }

        // 助手消息特定样式
        &.ai {
          margin-right: auto; // 推到左边
          .message-content {
            background-color: #fff;
            color: $text-primary; // 确保文字颜色
            box-shadow:
              2px 2px 4px rgba(0, 0, 0, 0.05),
              -2px -2px 4px rgba(255, 255, 255, 0.8);
          }
        }
      }

      // 消息过渡动画
      .message-fade-enter-active,
      .message-fade-leave-active {
        transition: all 0.3s ease;
      }
      .message-fade-enter-from,
      .message-fade-leave-to {
        opacity: 0;
        transform: translateY(20px);
      }
    }

    .chat-input {
      padding: 16px; // 给输入区域一些内边距
      margin: 0 16px 16px 16px; // 与消息区域对齐
      border-radius: $border-radius-m;
      @include textarea_inner-effect; // 输入框内凹效果 (假设 mixin 适用于容器)

      // 如果 textarea_inner-effect 只适用于 input/textarea，则保持原样或调整 mixin
      // :deep(.el-textarea__inner) { ... } // 可能需要 :deep() 如果 mixin 不处理

      .input-actions {
        margin-top: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center; // 垂直居中按钮组

        .el-button-group {
          border-radius: $border-radius-m;
          padding: 4px;
          background-color: $light-bg; // 按钮组背景

          .el-button {
            background-color: $light-bg; // 按钮背景
            border: none;
            color: $primary-color;
            @include botton-hover-active-effect; // 按钮hover/active效果
          }
        }
      }
    }

    .empty-state {
      // 空状态样式
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #909399; // Element Plus 默认灰色

      :deep(.el-empty__description p) {
        // 示例：修改描述文字颜色
        color: $text-secondary;
      }
    }

    .streaming-indicator {
      text-align: center;
      color: $text-secondary;
      padding: 10px;
      font-style: italic;
      font-size: 0.9em;
    }
  }

  .settings-content {
    padding: 20px;

    .setting-item {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: $border-radius-m;
      background-color: #fff;
      box-shadow: $box-shadow-outer-m;

      .setting-label {
        font-size: 16px;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 12px;
      }

      .setting-description {
        margin-top: 8px;
        font-size: 14px;
        color: $text-secondary;
        line-height: 1.5;
      }

      :deep(.el-slider) {
        margin-top: 8px;
        width: 100%;

        .el-slider__runway {
          background-color: $light-bg;
        }

        .el-slider__bar {
          background-color: $primary-color;
        }

        .el-slider__button {
          border-color: $primary-color;
        }

        .el-slider__input {
          width: 80px;
          margin-left: 16px;
        }
      }
    }
  }
}

// 全局 :deep() 规则或针对特定组件的全局样式（如果无法放入 scoped）
// 例如 ElMessageBox 的样式，因为它通常是动态添加到 body 的
:deep(.token-dialog) {
  .el-message-box__header {
    background-color: $light-bg;
    padding: 16px;
    border-bottom: 1px solid $shadow-dark;
  }

  .el-message-box__title {
    color: $text-primary;
    font-weight: 500;
  }

  .el-message-box__content {
    padding: 20px;
    background-color: $light-bg;
  }

  .el-message-box__input {
    @include textarea_inner-effect(0, 0, true); // 假设 mixin 支持参数

    // 如果 mixin 不支持参数，或者需要更精确控制：
    .el-input {
      // 目标是 el-input 而不是 el-message-box__input
      padding: 0; // 移除可能存在的内边距
    }
    .el-input__wrapper {
      // Element Plus 可能使用 wrapper
      background-color: $light-bg;
      border: none;
      box-shadow: $box-shadow-inner-m;
      border-radius: $border-radius-m;
      padding: 1px 11px; // 默认内边距，根据需要调整
    }
    .el-input__inner {
      background-color: transparent; // 使 wrapper 背景生效
      // box-shadow: none; // box-shadow 在 wrapper 上
      // border-radius: $border-radius-m; // radius 在 wrapper 上
      color: $text-primary;

      &:focus {
        // 焦点样式可能由 el-input__wrapper 控制
        // box-shadow: $box-shadow-outer-m; // 可能不需要在这里设置
      }
    }
    &:focus-within .el-input__wrapper {
      // 焦点状态应用到 wrapper
      box-shadow: $box-shadow-outer-m; // 外发光效果
    }
  }

  .el-message-box__btns {
    padding: 16px;
    background-color: $light-bg;
    border-top: 1px solid $shadow-dark;

    .el-button {
      border-radius: $border-radius-m;
      padding: 8px 16px; // 统一按钮内边距

      &--default {
        background-color: $light-bg;
        border: none;
        box-shadow: $box-shadow-outer-m;
        color: $text-primary;

        &:hover {
          background-color: $primary-hover;
          // box-shadow: $box-shadow-outer-m; // 保持或微调 hover 阴影
        }
        &:active {
          // 添加 active 效果
          box-shadow: $box-shadow-inner-m; // 内凹效果
        }
      }

      &--primary {
        background-color: $primary-color;
        border: none;
        color: white;
        box-shadow: $box-shadow-outer-m;

        &:hover {
          opacity: 0.9;
          // background-color: darken($primary-color, 5%); // 轻微变暗
        }
        &:active {
          box-shadow: $box-shadow-inner-m;
        }
      }
    }
  }
}

// 聊天框左侧下拉菜单按钮组
.el-button-group-chat-left {
  .el-dropdown {
    &:not(:last-child) {
      margin-right: 8px;
    }

    .el-button {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 160px;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}
</style>
