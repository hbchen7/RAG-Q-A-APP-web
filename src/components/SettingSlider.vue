<!-- SettingSlider.vue -->
<template>
  <div class="setting-item">
    <div class="setting-header">
      <div class="setting-label">
        {{ label }}
        <el-tooltip
          :content="description"
          placement="top"
          :effect="effect"
          :show-after="showAfter"
        >
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>
    <div class="slider-container">
      <el-slider
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :min="min"
        :max="max"
        :step="step"
        :show-input="false"
        :show-input-controls="false"
        @change="$emit('change', $event)"
      />
      <div class="input-container">
        <el-input-number
          v-model="inputValue"
          :min="min"
          :max="max"
          :step="step"
          :controls-position="'right'"
          size="small"
          @change="handleInputChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
  effect: {
    type: String,
    default: 'dark',
  },
  showAfter: {
    type: Number,
    default: 100,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

// 用于数字输入框的本地值
const inputValue = ref(props.modelValue)

// 监听 modelValue 的变化，更新本地输入值
watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = newValue
  },
)

// 处理输入框变化
const handleInputChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style lang="scss" scoped>
.setting-item {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: $border-radius-m;
  background-color: #fff;
  box-shadow: $box-shadow-outer-m;

  .setting-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .setting-label {
      font-size: 15px;
      font-weight: 500;
      color: $text-primary;
      display: flex;
      align-items: center;
      gap: 8px;

      .help-icon {
        font-size: 14px;
        color: $text-secondary;
        cursor: help;
        transition: color 0.2s;

        &:hover {
          color: $primary-color;
        }
      }
    }
  }

  .slider-container {
    display: flex;
    flex-direction: column;
    gap: 12px;

    :deep(.el-slider) {
      flex: 1;

      .el-slider__runway {
        background-color: $light-bg;
        height: 8px;
      }

      .el-slider__bar {
        background-color: $primary-color;
        opacity: 0.8;
        height: 8px;
      }

      .el-slider__button {
        width: 15px;
        height: 15px;
        border: 2px solid $primary-color;
        background-color: #fff;

        &:hover {
          transform: scale(1.1);
          transition: transform 0.2s;
        }

        &.hover {
          transform: scale(1.1);
        }
      }

      .el-slider__button-wrapper {
        top: -5px;
        width: 12px;
        height: 12px;
      }
    }

    .input-container {
      display: flex;
      justify-content: flex-end;

      :deep(.el-input-number) {
        width: 150px;

        .el-input-number__decrease,
        .el-input-number__increase {
          background-color: $light-bg;
          border: none;
          color: $text-secondary;

          &:hover {
            color: $primary-color;
          }
        }

        .el-input__wrapper {
          box-shadow: none;

          border: none;

          &:hover {
            box-shadow: $box-shadow-inner-m;
          }

          .el-input__inner {
            color: $text-primary;
            text-align: center;
          }
        }
      }
    }
  }
}

:deep(.el-tooltip__popper) {
  font-size: 12px !important;
  line-height: 1.4;
  max-width: 300px;
}
</style>
