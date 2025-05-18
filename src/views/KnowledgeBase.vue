<template>
  <el-container class="knowledge-base-container">
    <!-- 左侧边栏 -->
    <el-aside width="240px" class="kb-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog"
          >新建知识库</el-button
        >
      </div>
      <el-scrollbar class="kb-list-scrollbar">
        <div
          v-if="knowledgeStore.loading && knowledgeStore.knowledgeBases.length === 0"
          class="loading-placeholder"
        >
          <el-skeleton :rows="5" animated />
        </div>
        <el-menu
          v-else-if="knowledgeStore.knowledgeBases.length > 0"
          :default-active="knowledgeStore.selectedKbId"
          class="kb-menu"
          @select="handleSelectKb"
        >
          <el-menu-item
            v-for="kb in knowledgeStore.knowledgeBases"
            :key="kb._id"
            :index="kb._id"
          >
            <template #title>
              <span class="kb-title">{{ kb.title }}</span>
            </template>
            <!-- 知识库操作按钮 -->
            <el-dropdown
              trigger="click"
              @command="handleKbCommand($event, kb)"
              @click.stop
            >
              <el-button
                :icon="MoreFilled"
                circle
                size="small"
                class="action-button"
                @click.stop
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <!-- 可以添加编辑功能 -->
                  <!-- <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>编辑
                        </el-dropdown-item> -->
                  <el-dropdown-item command="delete" :icon="Delete">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-menu-item>
        </el-menu>
        <el-empty v-else description="暂无知识库" :image-size="80"></el-empty>
      </el-scrollbar>
    </el-aside>

    <!-- 右侧主内容区 -->
    <el-main class="kb-main-content">
      <div v-if="knowledgeStore.loading && !selectedKb" class="loading-placeholder">
        <el-skeleton :rows="10" animated />
      </div>
      <template v-else-if="selectedKb">
        <!-- 知识库详情和文件上传 -->
        <div class="kb-detail-header">
          <el-descriptions :title="selectedKb.title" :column="2" border class="kb-info">
            <el-descriptions-item label="创建者">{{
              selectedKb.creator
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
              formatDate(selectedKb.create_at)
            }}</el-descriptions-item>
            <el-descriptions-item label="embedding">{{
              selectedKb.embedding_config?.embedding_model || 'N/A'
            }}</el-descriptions-item>
            <el-descriptions-item label="标签" :span="3">
              <el-tag
                v-for="tag in selectedKb.tag"
                :key="tag"
                size="small"
                style="margin-right: 5px"
                >{{ tag }}</el-tag
              >
              <span v-if="!selectedKb.tag || selectedKb.tag.length === 0">无</span>
            </el-descriptions-item>

            <el-descriptions-item label="描述" :span="3">{{
              selectedKb.description || '无'
            }}</el-descriptions-item>

            <!-- <el-descriptions-item label="supplier">{{
              selectedKb.embedding_config?.embedding_supplier || 'N/A'
            }}</el-descriptions-item> -->
          </el-descriptions>

          <!-- 文件上传区域 -->
          <div class="file-upload-area">
            <el-upload
              drag
              multiple
              action=""
              :http-request="handleFileUpload"
              :show-file-list="false"
              :before-upload="beforeUploadCheck"
              class="kb-uploader"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  现支持 PDF、Txt等格式，现支持上传以内的文件
                </div>
              </template>
            </el-upload>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="file-list-section">
          <h3>文件列表</h3>
          <el-table
            :data="selectedKb.filesList || []"
            style="width: 100%"
            v-loading="fileLoading"
            empty-text="暂无文件"
          >
            <el-table-column prop="file_name" label="文件名" sortable></el-table-column>
            <el-table-column label="上传时间" sortable width="200">
              <template #default="{ row }">
                {{ formatDate(row.upload_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  @click="handleDeleteFile(row.file_md5)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <el-empty v-else description="请在左侧选择一个知识库" :image-size="100"></el-empty>
    </el-main>

    <!-- 创建知识库对话框 -->
    <CreateKnowledgeBaseDialog
      v-model="showCreateDialogVisible"
      @confirm="handleCreateKbConfirm"
    />
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  ElContainer,
  ElAside,
  ElMain,
  ElButton,
  ElScrollbar,
  ElMenu,
  ElMenuItem,
  ElIcon,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElUpload,
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElSkeleton,
  ElMessage,
  ElNotification,
} from 'element-plus'
import { Plus, Delete, MoreFilled, UploadFilled } from '@element-plus/icons-vue'
import { useKnowledgeStore } from '@/stores/modules/knowledge'
import CreateKnowledgeBaseDialog from '@/components/CreateKnowledgeBaseDialog.vue' // 稍后创建
import { format } from 'date-fns' // 用于格式化日期

const knowledgeStore = useKnowledgeStore()

// 控制创建对话框的显示
const showCreateDialogVisible = ref(false)
// 文件上传/删除时的加载状态 (可选，如果希望操作时表格有 loading)
const fileLoading = ref(false)

// --- Computed ---
// 获取当前选中的知识库对象
const selectedKb = computed(() => knowledgeStore.selectedKnowledgeBase)

// --- Lifecycle Hooks ---
onMounted(() => {
  // 组件挂载时获取知识库列表
  knowledgeStore.fetchKnowledgeBases()
})

// --- Methods ---

/**
 * @description 打开创建知识库对话框
 */
const openCreateDialog = () => {
  showCreateDialogVisible.value = true
}

/**
 * @description 处理创建知识库对话框确认事件
 * @param {object} formData - 对话框返回的表单数据
 */
const handleCreateKbConfirm = async (formData) => {
  await knowledgeStore.createKnowledgeBase(formData)
  // 创建成功后关闭对话框
  showCreateDialogVisible.value = false
}

/**
 * @description 处理菜单选择事件，切换选中的知识库
 * @param {string} index - 被选中的菜单项的 index (即 kbId)
 */
const handleSelectKb = (index) => {
  knowledgeStore.setSelectedKbId(index)
}

/**
 * @description 处理知识库操作命令（如图标按钮下拉菜单）
 * @param {string} command - 命令名称 ('delete')
 * @param {object} kb - 当前操作的知识库对象
 */
const handleKbCommand = async (command, kb) => {
  if (command === 'delete') {
    await knowledgeStore.deleteKnowledge(kb._id)
  }
  // else if (command === 'edit') {
  //    // 处理编辑逻辑
  // }
}

/**
 * @description 格式化日期时间字符串
 * @param {string | Date} dateTimeString - 日期时间字符串或 Date 对象
 * @returns {string} 格式化后的字符串 (YYYY-MM-DD HH:mm:ss)
 */
const formatDate = (dateTimeString) => {
  if (!dateTimeString) return 'N/A'
  try {
    return format(new Date(dateTimeString), 'yyyy-MM-dd HH:mm:ss')
  } catch (e) {
    console.error('日期格式化错误:', e)
    return '无效日期'
  }
}

/**
 * @description 文件上传前的检查（例如大小、类型）
 * @param {File} rawFile - 原始文件对象
 * @returns {boolean | Promise<File>}
 */
const beforeUploadCheck = (rawFile) => {
  // 检查文件类型
  const allowedTypes = ['application/pdf', 'text/plain']
  const fileExtension = rawFile.name.split('.').pop()?.toLowerCase() // 获取小写扩展名

  // 检查 MIME 类型 或 文件扩展名
  if (
    !allowedTypes.includes(rawFile.type) &&
    !['pdf', 'txt', 'md'].includes(fileExtension || '')
  ) {
    ElNotification({
      title: '上传失败',
      message: '现支持 PDF TXT 文档格式',
      type: 'warning',
      duration: 3000, // 显示时长，单位毫秒
    })
    return false // 阻止上传
  }

  // 检查文件大小 (示例：)
  const maxSize = 5 * 1024 * 1024 // 4MB
  if (rawFile.size > maxSize) {
    ElMessage.error('文件大小不能超过 4MB!')
    return false
  }

  return true // 允许上传
}

/**
 * @description 处理 Element Plus Upload 的自定义上传请求
 * @param {object} options - Element Plus Upload 传递的选项
 * @param {File} options.file - 要上传的文件
 */
const handleFileUpload = async ({ file }) => {
  if (!selectedKb.value) {
    ElMessage.warning('请先选择一个知识库')
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  // formData.append('is_reorder', false); // 如果需要传递其他参数

  fileLoading.value = true // 开始上传，显示 loading
  try {
    await knowledgeStore.uploadFile(selectedKb.value._id, formData)
  } finally {
    fileLoading.value = false // 上传结束，隐藏 loading
  }
}

/**
 * @description 处理删除文件按钮点击事件
 * @param {string} fileMd5 - 要删除的文件的 MD5
 */
const handleDeleteFile = async (fileMd5) => {
  if (!selectedKb.value) return
  fileLoading.value = true // 开始删除，显示 loading
  try {
    await knowledgeStore.deleteFile(selectedKb.value._id, fileMd5)
  } finally {
    fileLoading.value = false // 删除结束，隐藏 loading
  }
}
</script>

<style scoped lang="scss">
.knowledge-base-container {
  height: calc(100vh - 40px); // 减去可能的 header 高度
  background-color: $light-bg;
  border-radius: $border-radius-m;
  overflow: hidden; // 防止内部滚动条影响布局
}

.kb-sidebar {
  width: 15vw;
  min-width: 150px;
  max-width: 198px;
  background-color: $light-bg; // 侧边栏背景
  box-shadow: $box-shadow-outer-m; // 轻微外凸
  display: flex;
  flex-direction: column;
  padding: 0;

  .sidebar-header {
    padding: 16px;
    box-shadow: $box-shadow-outer-m; // 轻微外凸
    flex-shrink: 0; // 防止头部被压缩
    .el-button {
      width: 100%; // 按钮宽度占满
    }
  }

  .kb-list-scrollbar {
    flex-grow: 1; // 占据剩余空间
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden; // 防止水平滚动条
    }
  }

  .loading-placeholder {
    padding: 16px;
  }

  .kb-menu {
    border-right: none; // 移除 el-menu 默认的右边框
    background-color: transparent; // 菜单背景透明

    .el-menu-item {
      height: 50px;
      line-height: 50px;
      display: flex; // 使用 flex 布局来控制内部元素
      align-items: center; // 垂直居中
      justify-content: space-between; // 两端对齐
      padding-right: 12px; // 给右侧按钮留空间

      .el-icon {
        margin-right: 8px;
      }

      .kb-title {
        flex-grow: 1; // 标题占据可用空间
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 8px; // 与按钮保持距离
      }

      &:hover {
        background-color: $primary-hover;
      }

      &.is-active {
        background-color: $primary-active;
        color: $primary-color;
      }

      // 操作按钮样式
      .action-button {
        opacity: 0; // 默认隐藏
        transition: opacity 0.2s ease-in-out;
        background: transparent;
        border: none;
        padding: 4px; // 减小按钮点击区域
        color: $text-secondary;

        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: $text-primary;
        }
      }

      &:hover .action-button {
        opacity: 1; // 悬停时显示按钮
      }
    }
  }

  .el-empty {
    margin-top: 40px;
  }
}

.kb-main-content {
  padding: 20px;
  overflow-y: auto; // 内容区允许垂直滚动
  display: flex;
  flex-direction: column;

  .loading-placeholder {
    padding: 16px;
  }

  .kb-detail-header {
    display: flex;
    gap: 20px; // 信息区和上传区之间的间距
    margin-bottom: 24px; // 与下方文件列表的间距
    flex-shrink: 0; // 防止被压缩

    .kb-info {
      flex: 1; // 信息区占据更多空间
      background-color: #fff; // 添加背景色以便区分
      padding: 16px;
      border-radius: $border-radius-m;
      box-shadow: $box-shadow-outer-m; // 轻微外凸
    }

    .file-upload-area {
      width: 300px; // 固定上传区域宽度
      flex-shrink: 0;
      .kb-uploader {
        :deep(.el-upload) {
          width: 100%;
        }
        :deep(.el-upload-dragger) {
          width: 100%;
          background-color: #fff; // 上传区域背景
          border: 2px dashed $shadow-dark; // 虚线边框
          border-radius: $border-radius-m;
          padding: 30px; // 增加内边距
          transition: border-color 0.3s;

          &:hover {
            border-color: $primary-color;
          }
        }
        .el-upload__tip {
          margin-top: 10px;
          font-size: 12px;
          color: $text-secondary;
        }
      }
    }
  }

  .file-list-section {
    flex-grow: 1; // 占据剩余空间
    background-color: #fff; // 背景色
    padding: 16px;
    border-radius: $border-radius-m;
    box-shadow: $box-shadow-outer-m; // 轻微外凸
    display: flex; // 让 Table 高度自适应
    flex-direction: column;

    h3 {
      margin-bottom: 16px;
      color: $text-primary;
      font-size: 16px;
      font-weight: 500;
    }

    .el-table {
      flex-grow: 1; // 表格占据剩余空间
    }
  }

  .el-empty {
    margin: auto; // 居中显示
  }
}
</style>
