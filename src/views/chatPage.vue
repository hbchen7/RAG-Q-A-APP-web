<script setup>
// chatPage.vue script部分
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Delete, Setting, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sayHelloAPI } from '@/api/chatAPI'
import { oneapiModelListStore } from '@/stores'

// 使用 store
const OneapiStore = oneapiModelListStore()

// 在组件挂载时初始化
onMounted(() => {
  OneapiStore.init()
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
const currentAssistant = ref(null)
const currentTopic = ref(null)

// 创建新话题

// 聊天消息
const messages = ref([])
// 输入框内容
const inputMessage = ref('')

const chat_config = ref({
  chat_history_max_length: 5,
  temperature: 0.8,
})
// const knowledge_config = ref({
//   embedding_supplier: 'ollama',
// })

// 修改 llm_config 为计算属性
const llm_config = computed(() => ({
  supplier: 'oneapi',
  model: OneapiStore.selectedModel || '',
  api_key: OneapiStore.selectedToken?.key ? `sk-${OneapiStore.selectedToken.key}` : '',
}))

// 修改 chat 计算属性，确保使用新的 llm_config
const chat = computed(() => ({
  question: inputMessage.value,
  chat_config: chat_config.value,
  llm_config: llm_config.value,
}))

// 选项卡激活项
const activeTab = ref('assistants')

// 模拟数据 - 实际项目中应该从API获取
const assistants = ref([
  {
    id: 1,
    name: '通用助手',
  },
  {
    id: 2,
    name: '代码助手',
  },
])

const topics = ref([
  {
    id: 1,
    assistantId: 1,
    name: '默认话题',
    lastMessage: '我是DeepSeek-R1,我能帮你...',
  },
  { id: 2, assistantId: 1, name: '需求分析', lastMessage: '首先我们来分析需求...' },
  { id: 3, assistantId: 2, name: 'Vue3开发', lastMessage: 'Vue3的新特性包括...' },
])

// 选择助手
const selectAssistant = (assistant) => {
  currentAssistant.value = assistant
  // 加载该助手下的话题列表
  activeTab.value = 'topics'
}

// 选择话题
const selectTopic = (topic) => {
  currentTopic.value = topic
  // TODO: 加载话题的聊天记录
  loadMessages()
}

// 加载消息记录
const loadMessages = () => {
  // TODO: 从API获取消息记录
  messages.value = [
    { id: 1, type: 'user', content: '你好，请帮我规划一个项目。' },
    {
      id: 2,
      type: 'assistant',
      content: '好的，让我们开始。首先，请告诉我项目的基本需求。',
    },
  ]
}

// 发送消息

const sendMessage = async () => {
  // 检查输入是否为空
  if (!inputMessage.value.trim()) return
  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    type: 'user',
    content: inputMessage.value,
  })
  //
  const message = chat.value
  // 清空输入框
  inputMessage.value = ''
  console.log(message)
  // 调用API发送消息
  const answer = await sayHelloAPI(message)
  // 助手回复
  messages.value.push({
    id: Date.now() + 1,
    type: 'assistant',
    content: answer,
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
            <el-button type="primary" :icon="Plus" circle size="small" />
          </div>
          <div class="list-content">
            <div
              v-for="assistant in assistants"
              :key="assistant.id"
              class="list-item"
              :class="{ active: currentAssistant?.id === assistant.id }"
              @click="selectAssistant(assistant)"
            >
              <span class="item-name">{{ assistant.name }}</span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="话题" name="topics">
          <!-- 话题列表 -->
          <div class="list-header">
            <span>当前话题</span>
            <el-button @click="createNewTopic" :icon="Plus" circle size="small" />
          </div>
          <div class="list-content">
            <div
              v-for="topic in topics"
              :key="topic.id"
              class="list-item"
              :class="{ active: currentTopic?.id === topic.id }"
              @click="selectTopic(topic)"
            >
              <div class="topic-info">
                <div class="topic-name">{{ topic.name }}</div>
                <div class="topic-message">{{ topic.lastMessage }}</div>
              </div>
            </div>
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
      <template v-if="currentTopic">
        <!-- 聊天记录 -->
        <div class="chat-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.type"
          >
            <div class="message-content">{{ message.content }}</div>
          </div>
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

      .list-content {
        padding: 8px;
      }

      .list-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: $border-radius-m;
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
          // 助手列表项特定样式
          margin-left: 12px;
          font-size: 14px;
        }

        .topic-info {
          // 话题列表项特定样式
          flex: 1;
          margin-left: 12px;

          .topic-name {
            font-size: 14px;
            margin-bottom: 4px;
          }

          .topic-message {
            font-size: 12px;
            color: $text-secondary;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
      box-shadow: // 内凹效果
        inset 4px 4px 8px $shadow-dark,
        inset -4px -4px 8px $shadow-light;
      background-color: $light-bg;

      // 隐藏滚动条但保留滚动功能
      scrollbar-width: none; /* Firefox */
      &::-webkit-scrollbar {
        display: none; /* Chrome/Safari/Edge */
      }

      .message {
        // message 的基础样式
        display: flex;
        margin-bottom: 20px;
        max-width: 80%; // 移动 max-width 到这里更合适

        .message-content {
          padding: 12px 16px;
          border-radius: $border-radius-m;
          font-size: 14px;
          line-height: 1.5;
        }

        // 用户消息特定样式
        &.user {
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
        &.assistant {
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
