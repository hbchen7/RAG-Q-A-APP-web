<template>
  <BaseFormDialog
    v-model="dialogVisible"
    :title="title"
    :confirm-button-text="confirmButtonText"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    width="600px"
  >
    <template #form-content>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="知识库名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入知识库名称" />
        </el-form-item>

        <el-form-item label="标签 (可选)" prop="tag">
          <el-select
            v-model="form.tag"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="输入标签按回车确认"
            no-data-text="输入标签按回车确认"
            style="width: 100%"
          >
            <!-- 这里不需要 el-option，allow-create 会处理用户输入 -->
          </el-select>
        </el-form-item>

        <el-form-item label="描述 (可选)" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述信息"
          />
        </el-form-item>

        <el-divider>嵌入配置</el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <!-- 令牌选择 (复用 chatPage 逻辑) -->
            <el-form-item
              label="选择令牌 (用于 API Key 和模型列表)"
              prop="selectedTokenId"
            >
              <el-dropdown trigger="click" style="width: 100%">
                <el-button :loading="oneapiStore.loading" class="dropdown-button">
                  {{ selectedTokenName }}
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="token in oneapiStore.tokenList"
                      :key="token.id"
                      :disabled="token.status === 0"
                      :class="{
                        'token-disabled': token.status === 0,
                        'token-selected': token.id === form.selectedTokenId,
                      }"
                      @click="handleSelectToken(token)"
                    >
                      <div class="token-item">
                        <span class="token-name">{{ token.name }}</span>
                        <span class="token-quota">{{
                          oneapiStore.getTokenQuota(token)
                        }}</span>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="oneapiStore.tokenList.length === 0" disabled>
                      暂无可用令牌
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 模型选择 (复用 chatPage 逻辑) -->
            <el-form-item label="选择嵌入模型" prop="embeddingModel">
              <el-select
                v-model="form.embeddingModel"
                placeholder="请选择模型"
                style="width: 100%"
                :disabled="
                  !form.selectedTokenId || oneapiStore.availableModels.length === 0
                "
                filterable
              >
                <el-option
                  v-for="modelId in oneapiStore.availableModels"
                  :key="modelId"
                  :label="modelId"
                  :value="modelId"
                />
                <template #empty>
                  <el-empty
                    description="请先选择令牌或令牌无可用模型"
                    :image-size="60"
                  ></el-empty>
                </template>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="API Key (自动填充)" prop="embeddingApiKey">
          <el-input
            v-model="form.embeddingApiKey"
            placeholder="选择令牌后自动填充"
            readonly
          />
        </el-form-item>
      </el-form>
    </template>
  </BaseFormDialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElDivider,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElRow,
  ElCol,
  ElIcon,
  ElEmpty,
  ElMessage,
} from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import BaseFormDialog from '@/components/BaseFormDialog.vue'
import { oneapiModelListStore } from '@/stores' // 引入 oneapi store

/**
 * @const {string[]} embeddingModels - 适用于创建知识库的嵌入模型名称关键词列表 (小写).
 * @description 用于在创建知识库前验证用户选择的模型是否为嵌入模型。
 */
const embeddingModels = [
  'bge-m3',
  'nomic embed',
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002',
  'e5-mistral', // 确认这是否确实是 embedding-only
  'jina-embeddings-v2-base-en',
  'bge-large-en-v1.5',
  'bge-small-zh',
  'bge-multilingual-gemma2',
  'bge-icl',
].map((name) => name.toLowerCase()) // 转为小写，便于不区分大小写比较

const props = defineProps({
  modelValue: {
    // for v-model
    type: Boolean,
    required: true,
  },
  // 可以传入一个知识库对象用于编辑，但这里是创建，所以不需要
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const oneapiStore = oneapiModelListStore()

const title = ref('创建新知识库')
const confirmButtonText = ref('创建')
const formRef = ref(null)

// 对话框可见性控制
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 表单数据模型
const form = reactive({
  title: '',
  tag: [],
  description: '',
  selectedTokenId: null, // 存储选中的令牌 ID
  embeddingModel: null, // 存储选中的嵌入模型 ID
  embeddingApiKey: '', // 存储自动填充的 API Key
})

// 校验规则
const rules = reactive({
  title: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  selectedTokenId: [{ required: true, message: '请选择令牌', trigger: 'change' }], // 改为 change 触发
  embeddingModel: [{ required: true, message: '请选择嵌入模型', trigger: 'change' }], // 改为 change 触发
  embeddingApiKey: [
    { required: true, message: 'API Key 不能为空 (请选择有效令牌)', trigger: 'change' },
  ], // 改为 change 触发
})

// 计算属性，用于显示令牌名称
const selectedTokenName = computed(() => {
  if (!form.selectedTokenId) return '选择令牌'
  const token = oneapiStore.tokenList.find((t) => t.id === form.selectedTokenId)
  return token ? token.name : '选择令牌'
})

// --- Watchers ---
// 监听对话框打开，重置表单和 OneAPI 状态
watch(dialogVisible, (newVal) => {
  if (newVal) {
    resetForm()
    // 尝试从 store 同步初始选中的 token 和 model (如果存在)
    if (oneapiStore.selectedToken) {
      form.selectedTokenId = oneapiStore.selectedToken.id
      // 更新 API Key 和可用模型
      updateApiKeyAndModels(oneapiStore.selectedToken)
      if (
        oneapiStore.selectedModel &&
        oneapiStore.availableModels.includes(oneapiStore.selectedModel)
      ) {
        form.embeddingModel = oneapiStore.selectedModel
      }
    } else {
      form.selectedTokenId = null
      form.embeddingModel = null
      form.embeddingApiKey = ''
    }
  }
})

// 监听选中的令牌 ID 变化，更新 API Key 和模型列表
watch(
  () => form.selectedTokenId,
  (newTokenId) => {
    if (newTokenId) {
      const token = oneapiStore.tokenList.find((t) => t.id === newTokenId)
      if (token) {
        updateApiKeyAndModels(token)
      } else {
        // 如果找不到 token (不太可能发生)，清空
        form.embeddingModel = null
        form.embeddingApiKey = ''
      }
    } else {
      form.embeddingModel = null
      form.embeddingApiKey = ''
    }
  },
)

// --- Methods ---

/**
 * @description 将 API Key 脱敏处理 (例如 sk-abcd****wxyz)
 * @param {string} key - 原始 API Key (需要包含 sk- 前缀)
 * @returns {string} 脱敏后的 API Key 或 'N/A'
 */
const maskApiKey = (key) => {
  if (!key || typeof key !== 'string' || !key.startsWith('sk-')) {
    return '无效 Key' // 或者返回空字符串
  }
  const actualKey = key.substring(3) // 去掉 'sk-'
  if (actualKey.length <= 8) {
    // 如果 key 太短，可以考虑不同的处理方式，这里简单处理
    return `sk-${actualKey.substring(0, 2)}****${actualKey.substring(actualKey.length - 2)}`
  }
  const prefix = actualKey.substring(0, 4)
  const suffix = actualKey.substring(actualKey.length - 4)
  return `sk-${prefix}****${suffix}`
}

/**
 * @description 根据选中的令牌更新 API Key (脱敏显示) 和可用模型列表，并重置选中的模型
 * @param {object} token - 选中的令牌对象
 */
const updateApiKeyAndModels = (token) => {
  // 使用 maskApiKey 函数处理后赋值给 form.embeddingApiKey 用于展示
  form.embeddingApiKey = token.key ? maskApiKey(`sk-${token.key}`) : ''
  // 注意：这里直接使用了 oneapiStore.availableModels，它会根据 oneapiStore.selectedToken 变化
  // 但我们的表单状态 selectedTokenId 可能与 store 不同步
  // 应该基于 form.selectedTokenId 对应的 token 来确定可用模型
  const availableModelsForSelectedToken = token.models ? token.models.split(',') : []

  // 如果当前选中的模型不在新令牌的可用模型列表中，则清空
  if (
    form.embeddingModel &&
    !availableModelsForSelectedToken.includes(form.embeddingModel)
  ) {
    form.embeddingModel = null
  }
  // 手动触发 API Key 和模型的校验，因为它们是根据令牌选择自动变化的
  nextTick(() => {
    formRef.value?.validateField('embeddingApiKey')
    formRef.value?.validateField('embeddingModel')
  })
}

/**
 * @description 处理令牌选择事件
 * @param {object} token - 选择的令牌对象
 */
const handleSelectToken = (token) => {
  form.selectedTokenId = token.id
  // watch 会自动处理后续更新
}

/**
 * @description 重置表单
 */
const resetForm = () => {
  form.title = ''
  form.tag = []
  form.description = ''
  form.selectedTokenId = null
  form.embeddingModel = null
  form.embeddingApiKey = ''
  nextTick(() => {
    formRef.value?.clearValidate() // 清除校验状态
  })
}

/**
 * @description 处理取消
 */
const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

/**
 * @description 处理确认
 */
const handleConfirm = async () => {
  if (!formRef.value) return
  try {
    // 1. 执行基础表单校验
    await formRef.value.validate()

    // // --- 新增检查逻辑 开始 ---
    // // 2. 检查选择的模型是否为嵌入模型
    // const selectedModelNameLower = form.embeddingModel?.toLowerCase() // 获取选中模型名称并转小写

    // // 检查 selectedModelNameLower 是否包含 embeddingModels 数组中的任何一个元素
    // const isEmbeddingModelSelected =
    //   selectedModelNameLower &&
    //   embeddingModels.some((embedModel) => selectedModelNameLower.includes(embedModel))

    // if (!isEmbeddingModelSelected) {
    //   // 如果选择的不是嵌入模型，则提示并阻止
    //   ElMessage.warning(
    //     '请选择一个有效的嵌入模型进行知识库创建，例如 bge-m3 或 text-embedding 系列。',
    //   )
    //   return // 阻止后续执行
    // }
    // // --- 新增检查逻辑 结束 ---

    // 3. (如果通过检查) 查找选中的令牌以获取原始 Key
    const selectedToken = oneapiStore.tokenList.find((t) => t.id === form.selectedTokenId)

    if (!selectedToken || !selectedToken.key) {
      ElMessage.error('无法获取所选令牌的有效 API Key，请检查令牌配置')
      return // 阻止继续执行
    }

    // 4. 构造提交给 store 的数据
    const dataToSubmit = {
      title: form.title,
      tag: form.tag,
      description: form.description,
      embedding_config: {
        embedding_model: form.embeddingModel,
        embedding_supplier: 'oneapi',
        embedding_apikey: `sk-${selectedToken.key}`,
      },
    }
    // 5. 触发确认事件
    emit('confirm', dataToSubmit)
    // dialogVisible.value = false; // 通常由父组件在 confirm 事件后关闭
  } catch (error) {
    // 捕获 validate() 的 reject 或其他错误
    console.log('表单校验或处理失败', error)
    // 避免重复提示，如果不是上面嵌入模型的警告，则提示检查表单
    if (!(error instanceof Error && error.message.includes('嵌入模型'))) {
      ElMessage.warning('请检查表单输入项是否完整且有效')
    }
  }
}
</script>

<style scoped lang="scss">
@use 'sass:color';

// 复用 chatPage 的下拉菜单样式 (如果需要可以提取成公共样式)
.dropdown-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// 使 el-select 边框和背景融入
:deep(.el-select .el-input__wrapper) {
  box-shadow: $box-shadow-inner-m; // 内凹效果
  border: none !important; // 移除边框
  background-color: $light-bg; // 背景色
}

// 调整多选标签样式 (可选)
:deep(.el-select .el-select__tags-text) {
  color: $text-primary;
}
:deep(.el-tag--info) {
  background-color: color.adjust($light-bg, $lightness: -5%);
  color: $text-secondary;
  border: none;
}

// 下拉菜单项样式 (与 chatPage 保持一致)
:deep(.el-dropdown-menu__item) {
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

:deep(.token-disabled) {
  opacity: 0.5;
  text-decoration: line-through;
  cursor: not-allowed;
  .token-quota {
    text-decoration: line-through;
  }
}

:deep(.token-selected) {
  color: $primary-color;
  font-weight: 500;

  &::after {
    content: '✓';
    margin-left: 8px;
    color: $primary-color;
  }
}

// 调整表单项的底部边距
.el-form-item {
  margin-bottom: 18px;
}

// 分割线样式
.el-divider--horizontal {
  margin: 16px 0 20px 0; // 调整分割线上下的间距
}
</style>
