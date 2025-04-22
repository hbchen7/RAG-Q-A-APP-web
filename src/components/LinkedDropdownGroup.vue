<script setup>
import { computed } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'

// 定义 Props
const props = defineProps({
  // --- Level 1 Props ---
  level1Options: {
    type: Array,
    required: true,
  },
  level1Selected: {
    type: [String, Number, Object, null],
    default: null,
  },
  level1Placeholder: {
    type: String,
    default: '请选择',
  },
  level1Loading: {
    type: Boolean,
    default: false,
  },
  level1Disabled: {
    type: Boolean,
    default: false,
  },
  level1OptionLabelKey: {
    type: String,
    default: 'name', // 默认使用 name 字段显示
  },
  level1OptionValueKey: {
    type: String,
    default: '_id', // 默认使用 _id 字段作为值
  },
  level1FixedTopOptions: {
    type: Array,
    default: () => [], // 示例: [{ label: '不使用', value: null }]
  },
  level1Icon: {
    type: Object, // 传递 Vue 组件
    default: null,
  },
  level1ShowEmptyOption: {
    // 新增：是否显示空选项提示
    type: Boolean,
    default: true,
  },
  level1EmptyText: {
    // 新增：空选项提示文字
    type: String,
    default: '暂无可用选项',
  },

  // --- Level 2 Props ---
  level2Options: {
    type: Array,
    required: true,
  },
  level2Selected: {
    type: [String, Number, Object, null],
    default: null,
  },
  level2Placeholder: {
    type: String,
    default: '请选择',
  },
  level2Disabled: {
    type: Boolean,
    default: false, // 外部可控制整体禁用
  },
  level2OptionLabelKey: {
    type: String,
    default: 'name', // 默认使用 name 字段显示 (例如模型ID)
  },
  level2OptionValueKey: {
    type: String,
    default: null, // 对于模型列表，值可能就是 label 本身，所以默认 null
  },
  level2FixedTopOptions: {
    type: Array,
    default: () => [], // 示例: [{ label: '全部', value: null }]
  },
  level2Icon: {
    type: Object,
    default: null,
  },
  level2ShowEmptyOption: {
    // 新增：是否显示空选项提示
    type: Boolean,
    default: true,
  },
  level2EmptyText: {
    // 新增：空选项提示文字
    type: String,
    default: '暂无可用选项',
  },
})

// 定义 Emits
const emit = defineEmits(['update:level1Selected', 'update:level2Selected'])

// --- Computed Properties ---

// 获取选项的显示标签
const getOptionLabel = (option, level) => {
  const key = level === 1 ? props.level1OptionLabelKey : props.level2OptionLabelKey
  return typeof option === 'object' && option !== null ? option[key] : option
}

// 获取选项的值
const getOptionValue = (option, level) => {
  const key = level === 1 ? props.level1OptionValueKey : props.level2OptionValueKey
  // 如果 valueKey 存在且 option 是对象，则取对应 key 的值
  if (key && typeof option === 'object' && option !== null && key in option) {
    return option[key]
  }
  // 否则直接返回值本身 (适用于简单数组或 level2ValueKey 为 null 的情况)
  return option
}

// 计算第一级按钮显示文本
const level1ButtonText = computed(() => {
  const selectedOption = props.level1Options.find(
    (opt) => getOptionValue(opt, 1) === props.level1Selected,
  )
  // 检查固定选项
  const fixedSelectedOption = props.level1FixedTopOptions.find(
    (opt) => opt.value === props.level1Selected,
  )

  if (fixedSelectedOption) return fixedSelectedOption.label
  if (selectedOption) return getOptionLabel(selectedOption, 1)
  return props.level1Placeholder
})

// 计算第二级按钮显示文本
const level2ButtonText = computed(() => {
  const selectedOption = props.level2Options.find(
    (opt) => getOptionValue(opt, 2) === props.level2Selected,
  )
  // 检查固定选项
  const fixedSelectedOption = props.level2FixedTopOptions.find(
    (opt) => opt.value === props.level2Selected,
  )

  if (fixedSelectedOption) return fixedSelectedOption.label
  if (selectedOption) return getOptionLabel(selectedOption, 2)
  return props.level2Placeholder
})

// 计算第二级按钮的最终禁用状态 (外部禁用优先，否则根据第一级是否选择)
const computedLevel2Disabled = computed(() => {
  return (
    props.level2Disabled ||
    props.level1Selected === null ||
    props.level1Selected === undefined
  )
})

// --- Event Handlers ---

const handleLevel1Select = (option) => {
  const value = getOptionValue(option, 1)
  emit('update:level1Selected', value)
  // 注意：选择第一级后，通常需要父组件清空第二级的选择，
  // 这里不直接 emit update:level2Selected 为 null，由父组件逻辑决定。
}

const handleLevel2Select = (option) => {
  const value = getOptionValue(option, 2)
  emit('update:level2Selected', value)
}

// 处理固定选项点击
const handleFixedOptionSelect = (option, level) => {
  if (level === 1) {
    emit('update:level1Selected', option.value)
  } else {
    emit('update:level2Selected', option.value)
  }
}

// --- Helper Functions ---
const isSelected = (option, level) => {
  const selectedValue = level === 1 ? props.level1Selected : props.level2Selected
  return getOptionValue(option, level) === selectedValue
}

const isFixedSelected = (option, level) => {
  const selectedValue = level === 1 ? props.level1Selected : props.level2Selected
  return option.value === selectedValue
}
</script>

<template>
  <el-button-group class="linked-dropdown-group">
    <!-- Level 1 Dropdown -->
    <el-dropdown trigger="click">
      <el-button :loading="level1Loading" :disabled="level1Disabled">
        <el-icon v-if="level1Icon && !level1Loading" class="el-icon--left"
          ><component :is="level1Icon"
        /></el-icon>
        {{ level1ButtonText }}
        <el-icon class="el-icon--right"><MoreFilled /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <!-- Fixed Top Options for Level 1 -->
          <el-dropdown-item
            v-for="fixedOpt in level1FixedTopOptions"
            :key="fixedOpt.value !== null ? fixedOpt.value : 'fixed-null-1'"
            :class="{ 'item-selected': isFixedSelected(fixedOpt, 1) }"
            @click="handleFixedOptionSelect(fixedOpt, 1)"
          >
            {{ fixedOpt.label }}
          </el-dropdown-item>

          <!-- Dynamic Options for Level 1 -->
          <template v-if="level1Options.length > 0">
            <el-dropdown-item
              v-for="(option, index) in level1Options"
              :key="
                getOptionValue(option, 1) !== null
                  ? getOptionValue(option, 1)
                  : `dyn-null-1-${index}`
              "
              :disabled="option.disabled"
              class="dropdown-item"
              :class="{ 'item-selected': isSelected(option, 1) }"
              @click="handleLevel1Select(option)"
            >
              <!-- Use slot for custom rendering, provide default -->
              <slot name="level1-option" :item="option" :selected="isSelected(option, 1)">
                <span>{{ getOptionLabel(option, 1) }}</span>
              </slot>
            </el-dropdown-item>
          </template>
          <!-- Empty State for Level 1 -->
          <el-dropdown-item
            v-else-if="level1ShowEmptyOption && level1FixedTopOptions.length === 0"
            disabled
          >
            {{ level1EmptyText }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Level 2 Dropdown -->
    <el-dropdown trigger="click" :disabled="computedLevel2Disabled">
      <el-button :disabled="computedLevel2Disabled">
        <el-icon v-if="level2Icon" class="el-icon--left"
          ><component :is="level2Icon"
        /></el-icon>
        {{ level2ButtonText }}
        <el-icon class="el-icon--right"><MoreFilled /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <!-- Fixed Top Options for Level 2 -->
          <el-dropdown-item
            v-for="fixedOpt in level2FixedTopOptions"
            :key="fixedOpt.value !== null ? fixedOpt.value : 'fixed-null-2'"
            :class="{ 'item-selected': isFixedSelected(fixedOpt, 2) }"
            @click="handleFixedOptionSelect(fixedOpt, 2)"
          >
            {{ fixedOpt.label }}
          </el-dropdown-item>

          <!-- Dynamic Options for Level 2 -->
          <template v-if="level2Options.length > 0">
            <el-dropdown-item
              v-for="(option, index) in level2Options"
              :key="
                getOptionValue(option, 2) !== null
                  ? getOptionValue(option, 2)
                  : `dyn-null-2-${index}`
              "
              :disabled="option.disabled"
              class="dropdown-item"
              :class="{ 'item-selected': isSelected(option, 2) }"
              @click="handleLevel2Select(option)"
            >
              <!-- Use slot for custom rendering, provide default -->
              <slot name="level2-option" :item="option" :selected="isSelected(option, 2)">
                <span>{{ getOptionLabel(option, 2) }}</span>
              </slot>
            </el-dropdown-item>
          </template>
          <!-- Empty State for Level 2 -->
          <el-dropdown-item
            v-else-if="level2ShowEmptyOption && level2FixedTopOptions.length === 0"
            disabled
          >
            {{ level2EmptyText }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </el-button-group>
</template>

<style lang="scss" scoped>
.linked-dropdown-group {
  // 可以添加一些按钮组的通用样式
  .el-button {
    min-width: 130px; // 给按钮一个最小宽度，避免内容变化时跳动
    display: flex;
    justify-content: space-between; // 让文字和图标分开
    align-items: center;

    // 限制按钮内文本宽度，避免过长
    :deep(span) {
      // 使用 :deep() 选择按钮内文本容器
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1; // 占据可用空间
      text-align: left; // 左对齐
      margin-right: 5px; // 与右侧图标间距
    }
  }

  .el-dropdown {
    &:not(:last-child) {
      // 按钮之间的间距可以由 el-button-group 控制，或在此微调
    }
  }
}

// 下拉菜单项的通用样式
// 注意：这些样式可能需要放在全局或父组件中才能完全生效，
// 因为 el-dropdown-menu 是动态添加到 body 的。
// 暂时放在 scoped 里，如果无效再考虑移出。
:deep(.el-dropdown-menu__item) {
  // 使用 :deep()
  &.item-selected {
    color: $primary-color;
    font-weight: bold; // 加粗选中项

    // 添加选中标记 (可选)
    &::after {
      content: '✓';
      margin-left: 8px;
      color: $primary-color;
    }
  }

  // 可以为 slot 的内容也提供一些基础样式
  .option-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%; // 确保内容撑满

    .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }
    .extra {
      font-size: 0.9em;
      color: $text-secondary;
      white-space: nowrap;
    }
  }
}
</style>
