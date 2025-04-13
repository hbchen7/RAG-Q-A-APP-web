<script setup>
// chatPage.vue script部分
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Plus, Delete, Setting, MoreFilled, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElEmpty, ElMessageBox } from 'element-plus'
import { sayHelloAPI } from '@/api/chatAPI'
import { getSessionHistoryAPI } from '@/api/sessionAPI'
import { oneapiModelListStore, useAuthStore } from '@/stores'
import { useAssistantStore } from '@/stores/modules/assistant'
import { useSessionStore } from '@/stores/modules/session'
import { renderMarkdown } from '@/utils/markdown'
import CreateAssistantDialog from '@/components/CreateAssistantDialog.vue'
import EditAssistantDialog from '@/components/EditAssistantDialog.vue'
import EditSessionDialog from '@/components/EditSessionDialog.vue'

const OneapiStore = oneapiModelListStore()
const assistantStore = useAssistantStore()
const sessionStore = useSessionStore()

// 在组件挂载时初始化
onMounted(async () => {
  OneapiStore.init()
  console.log('组件挂载前的 currentAssistant:', assistantStore.currentAssistant)

  // 获取助手列表
  await assistantStore.fetchAssistantList()
  console.log('获取列表后的 currentAssistant:', assistantStore.currentAssistant)

  // 如果有当前选中的助手，加载其会话列表
  const currentAssistant = assistantStore.currentAssistant
  if (currentAssistant && currentAssistant._id) {
    console.log('初始化时加载当前助手的会话列表...')
    await sessionStore.fetchSessionList(currentAssistant._id)
  }
})

// 在组件卸载时清理
onUnmounted(() => {
  OneapiStore.cleanup()
})

// 计算属性：当前选中的令牌名称
const selectedTokenName = computed(() => OneapiStore.selectedToken?.name || '选择令牌')

// 计算属性：当前选中的模型名称
const selectedModelName = computed(() => OneapiStore.selectedModel || '选择模型')

// 处理令牌选择
const handleSelectToken = (token) => {
  OneapiStore.selectToken(token)
}

// 处理模型选择
const handleSelectModel = (modelId) => {
  OneapiStore.selectModel(modelId)
  ElMessage.success(`已切换到模型: ${modelId}`)
}

// 当前选中的助手和话题
const currentAssistant = computed(() => assistantStore.getCurrentAssistant)
const currentSession = computed(() => sessionStore.getCurrentSession)

// 聊天消息
const messages = ref([])
// 输入框内容
const inputMessage = ref('')
// 消息加载状态
const messagesLoading = ref(false)
// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const totalPages = ref(0)
// 消息渲染相关
const renderedMessages = ref([])
const scrollbarRef = ref(null)

// 滚动到底部 - 使用 scrollTo 方法
const scrollToBottom = () => {
  nextTick(() => {
    const scrollbar = scrollbarRef.value
    console.log('Attempting to scroll to bottom. Scrollbar ref:', scrollbar)
    if (scrollbar && typeof scrollbar.scrollTo === 'function') {
      // 获取 scrollHeight 可能仍然需要 wrap
      const wrap = scrollbar.wrapRef // Element Plus 内部可能使用 wrapRef
      if (wrap) {
        const scrollHeight = wrap.scrollHeight
        console.log('Scrollbar wrap found. scrollHeight:', scrollHeight)
        scrollbar.scrollTo({ top: scrollHeight, behavior: 'smooth' }) // 使用 scrollTo 方法并添加平滑滚动
        console.log('Called scrollbar.scrollTo({ top:', scrollHeight, '})')
      } else {
        console.warn('Scrollbar wrapRef not found when trying to get scrollHeight.')
        // 备选方案：尝试滚动到一个非常大的数，确保到底部
        scrollbar.scrollTo({ top: 999999, behavior: 'smooth' })
        console.warn('Falling back to scrollTo a large number.')
      }
    } else {
      console.warn('Scrollbar instance or scrollTo method not found.')
    }
  })
}

// 监听消息变化，自动渲染 Markdown
watch(
  messages,
  async (newMessages) => {
    console.log('消息列表发生变化，开始渲染:', newMessages)
    try {
      renderedMessages.value = await Promise.all(
        newMessages.map(async (msg) => {
          console.log('正在渲染消息:', msg)
          return {
            ...msg,
            renderedContent: await renderMarkdown(msg.content),
          }
        }),
      )
      console.log('渲染完成，更新后的 renderedMessages:', renderedMessages.value)
    } catch (error) {
      console.error('渲染消息时出错:', error)
      // 确保即使渲染失败也能显示原始消息
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
    // 仅在消息列表实际增加（通常是新消息）时滚动
    if (newRenderedMessages.length > oldRenderedMessages?.length) {
      console.log('Rendered messages updated, scrolling to bottom.')
      scrollToBottom()
    }
  },
  { deep: true },
)

// 聊天配置
const chat_config = ref({
  chat_history_max_length: 5,
  temperature: 0.8,
})
// const knowledge_config = ref({
//   embedding_supplier: 'ollama',
// })

// llm 模型配置
const llm_config = computed(() => ({
  supplier: 'oneapi',
  model: OneapiStore.selectedModel,
  api_key: OneapiStore.selectedToken?.key ? `sk-${OneapiStore.selectedToken.key}` : '',
}))

// 修改 chat 计算属性，确保使用新的 llm_config
const chat = computed(() => ({
  question: inputMessage.value,
  session_id: currentSession.value?._id,
  chat_config: chat_config.value,
  llm_config: llm_config.value,
}))

// 选项卡激活项
const activeTab = ref('assistants')

// 模拟数据 - 实际项目中应该从API获取
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

// 加载消息记录
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

    // 更新分页信息、消息列表
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
  console.log(`Loading more messages, page: ${currentPage.value}`)

  try {
    const response = await getSessionHistoryAPI(currentSession.value._id, {
      page: currentPage.value,
      page_size: pageSize.value,
    })

    const scrollbar = scrollbarRef.value?.wrap
    const oldScrollHeight = scrollbar?.scrollHeight || 0

    // 将新消息添加到数组前面
    messages.value = [...response.items, ...messages.value]

    // 等待 DOM 更新后恢复滚动位置
    nextTick(() => {
      if (scrollbar) {
        const newScrollHeight = scrollbar.scrollHeight
        scrollbar.scrollTop =
          newScrollHeight - oldScrollHeight + (scrollbar.scrollTop || 0) // 尝试保持位置
        console.log(
          `Messages loaded. Old height: ${oldScrollHeight}, New height: ${newScrollHeight}, Restored scrollTop: ${scrollbar.scrollTop}`,
        )
      }
    })
  } catch (error) {
    currentPage.value-- // 恢复页码
    console.error('加载更多消息失败:', error)
    ElMessage.error('加载更多消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// 处理滚动事件 - 修改签名和条件
const handleScroll = ({ scrollTop }) => {
  // console.log('Scroll event detected, scrollTop:', scrollTop) // 调试时可以取消注释
  // 当滚动到接近顶部时加载更多消息
  if (scrollTop < 10 && !messagesLoading.value && currentPage.value < totalPages.value) {
    console.log('Scrolled near top, loading more messages...')
    loadMoreMessages()
  }
}

// 修改发送消息函数，移除冗余的 scrollToBottom 调用
const sendMessage = async () => {
  if (!OneapiStore.selectedModel) {
    ElMessage.info('请先选择一个模型')
    return
  }
  if (!currentSession.value) {
    ElMessage.info('请先选择一个话题')
    return
  }
  if (!inputMessage.value.trim()) return

  const userMessage = {
    id: Date.now(),
    type: 'human',
    content: inputMessage.value,
  }
  messages.value.push(userMessage)
  console.log('messages.value pushed:', userMessage)
  const messagePayload = chat.value
  const currentInput = inputMessage.value
  inputMessage.value = ''

  console.log('Sending message payload:', messagePayload)

  try {
    const answer = await sayHelloAPI(messagePayload)
    messages.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: answer,
    })
  } catch (error) {
    ElMessage.error('发送消息失败')
    console.error('发送消息 API 调用失败:', error)
    // 失败时恢复输入框内容
    messages.value = messages.value.filter((m) => m.id !== userMessage.id)
    inputMessage.value = currentInput
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
      console.log(
        `当前助手切换为: ${newAssistant.title || newAssistant.name} (ID: ${newAssistant._id}), 准备加载会话列表...`,
      )
      await sessionStore.fetchSessionList(newAssistant._id)
    } else {
      console.log('当前没有选中助手，清空会话列表。')
      sessionStore.sessionsList = []
      sessionStore.currentSession = null
    }
  },
  { immediate: true }, // 添加 immediate: true，确保组件挂载时就执行一次
)

// 监听当前会话变化，用于调试或触发其他逻辑
watch(
  () => sessionStore.currentSession,
  (newSession) => {
    if (newSession) {
      console.log(`当前会话切换为: ${newSession.name} (ID: ${newSession.id})`)
      loadMessages()
    } else {
      console.log('当前没有选中会话。')
      messages.value = []
    }
  },
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
            <p>设置内容开发中...</p>
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
        </div>

        <!-- 输入框区域 -->
        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入消息..."
            @keyup.enter="sendMessage"
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
            </el-button-group>

            <!-- 右侧聊天按钮组 -->
            <el-button-group>
              <el-button :icon="Delete"></el-button>
              <el-button :icon="Setting"></el-button>
              <el-button @click="sendMessage">⬆️</el-button>
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
    .token-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      width: 100%;

      .token-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 5px;
      }

      .token-quota {
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
  .model-selected {
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
