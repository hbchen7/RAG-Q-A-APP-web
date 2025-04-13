<!-- filepath: src/components/BaseFormDialog.vue -->
<script setup>
import { computed } from 'vue'

/**
 * @description 基础表单对话框组件
 * @props {Boolean} modelValue - 控制对话框显示/隐藏 (v-model)
 * @props {String} title - 对话框标题
 * @props {String} confirmButtonText - 确认按钮文本
 * @props {String} width - 对话框宽度
 * @emits update:modelValue - 更新 modelValue 的事件 (v-model)
 * @emits confirm - 用户点击确认时触发
 * @emits cancel - 用户点击取消时触发
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  confirmButtonText: {
    type: String,
    default: '确定',
  },
  width: {
    type: String,
    default: '500px',
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// 控制对话框内部的显示状态，与 v-model 同步
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

/**
 * @description 处理取消操作
 */
const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

/**
 * @description 处理确认操作
 */
const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    class="base-form-dialog"
    @close="handleCancel"
  >
    <!-- 表单内容插槽 -->
    <slot name="form-content"></slot>

    <!-- 自定义底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <slot name="footer-actions">
          <el-button @click="handleCancel" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="handleConfirm" class="confirm-button">
            {{ confirmButtonText }}
          </el-button>
        </slot>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
// 对话框样式调整，使用 :deep() 影响 Element Plus 内部元素
:deep(.el-dialog) {
  border-radius: $border-radius-m;
  background-color: $light-bg;

  .el-dialog__header {
    padding: 16px 20px;
    margin-right: 0;
    border-bottom: 1px solid $shadow-dark;
    background-color: transparent;

    .el-dialog__title {
      color: $text-primary;
      font-weight: 500;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: $text-secondary;
        &:hover {
          color: $primary-color;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 20px;
    background-color: transparent;
  }

  .el-dialog__footer {
    padding: 16px 20px;
    border-top: 1px solid $shadow-dark;
    background-color: transparent;
    text-align: right;

    .dialog-footer {
      .el-button {
        border-radius: $border-radius-m;
        border: none;
        padding: 8px 16px;

        &.cancel-button {
          background-color: $light-bg;
          box-shadow: $box-shadow-outer-m;
          color: $text-primary;
          @include botton-hover-active-effect(1.05, 0.95);

          &:hover {
            background-color: $primary-hover;
          }
        }

        &.confirm-button {
          background-color: $primary-color;
          color: white;
          box-shadow: $box-shadow-outer-m;
          @include botton-hover-active-effect(1.05, 0.95);

          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
  }
}
</style>
