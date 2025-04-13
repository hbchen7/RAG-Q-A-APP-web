<script setup>
import { ref, reactive, watch, computed } from 'vue'
import BaseFormDialog from './BaseFormDialog.vue'
import { ElForm, ElFormItem, ElInput } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  session: {
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
})

// 表单引用，用于校验
const formRef = ref(null)

// 表单校验规则
const rules = reactive({
  title: [{ required: true, message: '请输入会话名称', trigger: 'blur' }],
})

// 监听对话框打开，打开时初始化表单数据
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.session) {
      form.title = props.session.title || props.session.name
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
    title="编辑会话"
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
        <el-form-item label="会话名称" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入会话名称"
            @keyup.enter.prevent="handleConfirm"
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

  .el-input__wrapper {
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

  .el-input__wrapper:focus {
    outline: none;
    border: none;
  }
}
</style>
