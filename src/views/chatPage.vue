<script setup>
import { ref, computed } from 'vue'
import { Plus, Delete, Setting } from '@element-plus/icons-vue'
import { sayHelloAPI } from '@/api/chatAPI'
// import { LLMconfig } from '@/stores'

// 当前选中的助手和话题
const currentAssistant = ref(null)
const currentTopic = ref(null)

// 聊天消息
const messages = ref([])
// 输入框内容
const inputMessage = ref('')
const llm_config = ref({
  supplier: 'ollama',
  model: 'deepseek-r1:latest',
  apiKey: '',
})
const chat_config = ref({
  chat_history_max_length: 5,
  temperature: 0.8,
})
// const knowledge_config = ref({
//   embedding_supplier: 'ollama',
// })

// 修改chat对象为计算属性，确保始终获取最新值
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
            <el-button type="primary" :icon="Plus" circle size="small" />
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
            <el-button-group>
              <el-button :icon="Delete"></el-button>
              <el-button :icon="Setting"></el-button>
              <el-button type="primary" @click="sendMessage">⬆️</el-button>
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

<style lang="scss" scoped>
// 添加新拟态变量
$light-bg: #ecf0f3;
$shadow-dark: #d1d9e6;
$shadow-light: #f9f9f9;

.chat-container {
  display: flex;
  height: calc(100vh - 40px);
  background-color: $light-bg; // 使用统一背景色
  border-radius: 8px;
}

.sidebar {
  width: 200px;
  // border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;

  .tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__content) {
      flex: 1;
      overflow-y: auto;
    }
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e6e6;

  span {
    font-weight: 500;
    color: #333;
  }
}

.list-content {
  padding: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #e4eaf1;
  }

  .item-name {
    margin-left: 12px;
    font-size: 14px;
  }

  .topic-info {
    flex: 1;
    margin-left: 12px;

    .topic-name {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .topic-message {
      font-size: 12px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: $light-bg;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  margin: 16px;
  border-radius: 8px;
  // 内凹效果
  box-shadow:
    inset 4px 4px 8px $shadow-dark,
    inset -4px -4px 8px $shadow-light;
  background-color: $light-bg;

  // 隐藏滚动条但保留滚动功能
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari/Edge */
  }

  .message {
    margin-bottom: 20px;

    &.user .message-content {
      background-color: #4b70e2; // 统一主色调
      color: #fff;
    }

    &.assistant .message-content {
      background-color: #fff;
      box-shadow:
        2px 2px 4px rgba(0, 0, 0, 0.05),
        -2px -2px 4px rgba(255, 255, 255, 0.8);
    }
  }
}

.message {
  display: flex;
  margin-bottom: 20px;

  &.user {
    justify-content: flex-end;

    .message-content {
      background-color: #409eff;
      color: #fff;
    }
  }

  &.assistant .message-content {
    background-color: #f4f4f5;
    color: #333;
  }

  .message-content {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
}

.chat-input {
  padding: 20px;
  margin: 0 16px 16px;
  border-radius: 8px;
  background-color: $light-bg;
  // // 外凸效果
  // box-shadow:
  //   4px 4px 8px $shadow-dark,
  //   -4px -4px 8px $shadow-light;

  :deep(.el-textarea__inner) {
    background-color: $light-bg;
    // 内凹效果
    box-shadow:
      inset 2px 2px 4px $shadow-dark,
      inset -2px -2px 4px $shadow-light;
    border: none;
    border-radius: 8px;
  }

  .input-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end; // 改为右对齐
    align-items: center;

    .el-button-group {
      border-radius: 8px;
      padding: 4px;
      background-color: $light-bg;

      .el-button {
        background-color: $light-bg;
        border: none;
        color: #4b70e2; // 统一主色调
        box-shadow: none;

        &:hover {
          color: #3a5bbf; // 加深色调
        }

        &:active {
          box-shadow:
            inset 2px 2px 4px $shadow-dark,
            inset -2px -2px 4px $shadow-light;
        }

        &.el-button--primary {
          background-color: #4b70e2;
          color: white;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

:deep(.el-tabs__nav) {
  padding: 0 16px;
}
</style>
