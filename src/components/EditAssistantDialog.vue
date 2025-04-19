<script setup>
import { ref, reactive, watch, computed } from 'vue'
import BaseFormDialog from './BaseFormDialog.vue'
import { ElForm, ElFormItem, ElInput } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  assistant: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 添加本地计算属性来控制对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 表单数据
const form = reactive({
  title: '',
  prompt: '',
})

// 表单引用，用于校验
const formRef = ref(null)

// 表单校验规则
const rules = reactive({
  title: [{ required: true, message: '请输入助手名称', trigger: 'blur' }],
  prompt: [{ required: true, message: '请输入提示词', trigger: 'blur' }],
})

// 监听对话框打开，打开时初始化表单数据
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.assistant) {
      form.title = props.assistant.title || props.assistant.name
      form.prompt = props.assistant.prompt || ''
    }
  },
)

// 处理确认编辑操作
const handleConfirm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('confirm', { ...form })
  } catch (error) {
    console.log('表单校验失败', error)
  }
}
</script>

<template>
  <base-form-dialog
    v-model="dialogVisible"
    title="编辑助手"
    confirm-button-text="保存"
    @confirm="handleConfirm"
  >
    <template #form-content>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleConfirm"
      >
        <el-form-item label="助手名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入助手名称"
            @keyup.enter.prevent="handleConfirm"
          />
        </el-form-item>
        <el-form-item label="提示词 (Prompt)" prop="prompt">
          <el-input
            v-model="form.prompt"
            type="textarea"
            :rows="5"
            placeholder="请输入助手的提示词或指令"
          />
        </el-form-item>
      </el-form>
    </template>
  </base-form-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-form) {
  .el-form-item__label {
    color: $text-primary;
    margin-bottom: 8px;
  }

  .el-input__wrapper,
  .el-textarea__inner {
    background-color: $light-bg;
    box-shadow: $box-shadow-inner-m;
    border-radius: $border-radius-m;
    border: none;
    padding: 1px 11px;
    color: $text-primary;
    transition: box-shadow $transition-duration $transition-timing-function;

    &:focus,
    &.is-focus {
      box-shadow: $box-shadow-outer-m;
    }
  }

  .el-textarea__inner {
    padding: 5px 11px;
  }

  .el-input__wrapper:focus,
  .el-textarea__inner:focus {
    outline: none;
    border: none;
  }
}
</style>
