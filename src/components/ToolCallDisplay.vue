<!-- 工具调用显示组件,嵌入在消息气泡中 -->

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { ElButton, ElDialog, ElScrollbar } from 'element-plus'

const props = defineProps({
  toolCall: {
    type: Object,
    required: true,
    default: () => ({
      call_id: '',
      name: '未知工具',
      args: {},
      result_content: null,
      is_loading: true,
      show_result_dialog: false,
    }),
  },
})

const emit = defineEmits(['update:showResultDialog'])

// 直接使用 prop 中的响应式状态来控制对话框的显示
// const internalShowResultDialog = ref(props.toolCall.show_result_dialog)

// watch(() => props.toolCall.show_result_dialog, (newVal) => {
//   internalShowResultDialog.value = newVal
// })

// const updateShowDialog = (value) => {
//   // 如果需要，可以通过 emit 事件来通知父组件更新 prop
//   // context.emit('update:showResultDialog', value)
//   // 但对于 Element Plus 的 v-model，直接修改 ref 即可，如果 prop 是这样设计的
//   // 这里我们假设父组件会直接修改 toolCall.show_result_dialog
//   props.toolCall.show_result_dialog = value
// }

const openDialog = () => {
  if (!props.toolCall.is_loading) {
    // props.toolCall.show_result_dialog = true // 直接修改 prop，linter 会警告
    emit('update:showResultDialog', true) // 通过 emit 更新
  }
}

const closeDialog = () => {
  // props.toolCall.show_result_dialog = false // 直接修改 prop
  emit('update:showResultDialog', false) // 通过 emit 更新
}

const formattedArgs = computed(() => {
  try {
    return JSON.stringify(props.toolCall.args, null, 2)
  } catch (e) {
    console.error('Error stringifying toolCall.args:', e) // 使用错误对象
    return '参数解析错误'
  }
})

const formattedResultContent = computed(() => {
  if (
    props.toolCall.result_content === null ||
    props.toolCall.result_content === undefined
  ) {
    return '暂无结果'
  }
  try {
    // 尝试解析为JSON，如果成功则格式化输出，否则直接显示字符串
    const parsed = JSON.parse(props.toolCall.result_content)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    // console.warn('Result content is not valid JSON, displaying as is:', e) // 使用错误对象，并考虑降级为警告
    // 如果我们预期 result_content 有时可能就是普通字符串，那么这里不一定是错误
    // 为了消除 linter 警告，我们可以记录一下这个情况
    console.log('Result content is not a valid JSON, displaying as raw string. Error:', e)
    return props.toolCall.result_content // 不是合法的JSON字符串，直接显示
  }
})
</script>

<template>
  <div class="tool-call-display">
    <el-button
      :loading="toolCall.is_loading"
      :disabled="toolCall.is_loading"
      @click="openDialog"
      size="small"
      class="tool-button"
    >
      {{ toolCall.name }}
    </el-button>

    <el-dialog
      :model-value="toolCall.show_result_dialog"
      @update:model-value="(value) => emit('update:showResultDialog', value)"
      :title="`工具调用: ${toolCall.name}`"
      width="60%"
      @close="closeDialog"
      append-to-body
      custom-class="tool-call-dialog"
    >
      <div class="dialog-content">
        <section class="args-section">
          <h4>调用参数:</h4>
          <el-scrollbar max-height="200px">
            <pre>{{ formattedArgs }}</pre>
          </el-scrollbar>
        </section>
        <section class="result-section">
          <h4>调用结果:</h4>
          <el-scrollbar max-height="300px">
            <pre>{{ formattedResultContent }}</pre>
          </el-scrollbar>
        </section>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.tool-call-display {
  margin-top: 8px;
  margin-bottom: 8px;
}

.tool-button {
  background-color: #fff;
  color: $text-primary;
  border: 1px solid $shadow-dark;
  box-shadow: $box-shadow-outer-m;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: $primary-color;
    color: $primary-color;
  }

  &:active {
    box-shadow: $box-shadow-inner-m;
  }

  &[disabled] {
    opacity: 0.7;
    box-shadow: none;
  }
}

// Dialog 样式可以放到全局，如果很多地方用到类似弹窗
// 但如果只是这个组件用，放这里也可以
:deep(.tool-call-dialog) {
  .el-dialog__header {
    padding: 16px 20px;
    background-color: $light-bg;
    border-bottom: 1px solid $shadow-dark;

    .el-dialog__title {
      color: $text-primary;
      font-weight: 500;
    }
    .el-dialog__headerbtn {
      top: 0px; // 调整关闭按钮位置与 Element Plus 默认行为一致或根据需要调整
      .el-dialog__close {
        color: $text-secondary;
        &:hover {
          color: $primary-color;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 0; // 移除内边距，让 section 自己控制
    background-color: #fff; // 对话框内容背景
  }

  .dialog-content {
    section {
      padding: 15px 20px;
      border-bottom: 1px solid $shadow-dark;
      &:last-child {
        border-bottom: none;
      }

      h4 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 15px;
        color: $text-primary;
        font-weight: 500;
      }

      pre {
        background-color: $light-bg;
        padding: 10px;
        border-radius: $border-radius-m;
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
        white-space: pre-wrap;
        word-break: break-all;
        color: $text-primary;
        margin: 0;
      }
    }
  }

  .el-dialog__footer {
    padding: 12px 20px;
    background-color: $light-bg;
    border-top: 1px solid $shadow-dark;
    text-align: right;

    .el-button {
      // 按钮样式可以复用 theme.scss 中的 mixin 或直接定义
      &--default {
        background-color: #fff;
        border: 1px solid $shadow-dark;
        color: $text-primary;
        box-shadow: $box-shadow-outer-m;
        &:hover {
          border-color: $primary-color;
          color: $primary-color;
        }
        &:active {
          box-shadow: $box-shadow-inner-m;
        }
      }
    }
  }
}
</style>
