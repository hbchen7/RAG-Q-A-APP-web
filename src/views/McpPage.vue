<template>
  <div class="mcp-page">
    <h1 class="page-title">MCP 服务</h1>
    <el-collapse
      v-if="processedServices.length > 0"
      v-model="activeCollapseItem"
      accordion
      class="service-collapse"
    >
      <el-collapse-item
        v-for="service in processedServices"
        :key="service.id"
        :title="service.title"
        :name="service.id"
      >
        <div v-if="service.tools && service.tools.length > 0" class="tools-grid">
          <el-card
            v-for="tool in service.tools"
            :key="tool.id"
            class="tool-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span>{{ tool.name }}</span>
              </div>
            </template>
            <p class="tool-description">{{ tool.description }}</p>
          </el-card>
        </div>
        <el-empty v-else description="该服务下暂无工具"></el-empty>
      </el-collapse-item>
    </el-collapse>
    <el-empty
      v-else
      description="暂无服务配置信息，请检查 mcp_config.json 文件"
    ></el-empty>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
// 假设 mcp_config.json 位于项目根目录下的 doc/ 文件夹中
// Vite/Webpack 等构建工具通常配置为可以这样直接导入 JSON 文件
import mcpConfigData from '../../doc/mcp_config.json'

/**
 * @type {import('vue').Ref<string | undefined>}
 * 用于控制手风琴模式下当前激活的折叠面板项。
 */
const activeCollapseItem = ref(undefined)

/**
 * @typedef {object} Tool
 * @property {string} id - 工具的唯一标识符 (原始JSON中的键名)。
 * @property {string} name - 工具的显示名称 (来自JSON中的Name属性)。
 * @property {string} description - 工具的描述 (来自JSON中的Description属性)。
 */

/**
 * @typedef {object} ServiceModule
 * @property {string} id - 服务模块的唯一标识符 (原始JSON中的顶层键名)。
 * @property {string} title - 服务模块的显示标题 (根据键名格式化生成)。
 * @property {Tool[]} tools - 该服务模块下的工具列表。
 */

/**
 * 将原始的 MCP 配置数据处理成更适合模板渲染的结构。
 * @returns {ServiceModule[]} 返回处理后的服务模块数组。
 */
const processedServices = computed(() => {
  if (!mcpConfigData || Object.keys(mcpConfigData).length === 0) {
    return []
  }
  return Object.entries(mcpConfigData).map(([serviceKey, serviceData]) => {
    const tools =
      serviceData && typeof serviceData === 'object'
        ? Object.entries(serviceData).map(([toolKey, toolDetails]) => ({
            id: toolKey,
            name: toolDetails.Name || toolKey, // 优先使用Name属性，若无则回退到键名
            description: toolDetails.Description || '暂无描述',
          }))
        : []

    // 将服务模块键名转换为更易读的标题
    // 例如: "howtocook-mcp" -> "Howtocook Mcp"
    const title = serviceKey
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return {
      id: serviceKey,
      title: title,
      tools: tools,
    }
  })
})

// 初始化时，如果存在服务，则默认展开第一个服务模块
if (processedServices.value.length > 0) {
  activeCollapseItem.value = processedServices.value[0].id
}
</script>

<style lang="scss" scoped>
// 页面整体样式，参考 theme.scss 中的 $light-bg
.mcp-page {
  padding: 24px;
  background-color: #ecf0f3;
  min-height: calc(100vh - 48px); // 考虑上下padding
  box-sizing: border-box;
}

// 页面主标题
.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333; // 参考 theme.scss 中的 $text-primary
  margin-bottom: 24px;
  text-align: center;
}

// 折叠面板容器
.service-collapse {
  :deep(.el-collapse-item__header) {
    font-size: 18px; // 稍大一点的标题
    padding-left: 20px;
    box-shadow: $box-shadow-outer-m;

    // Element Plus 会自动应用 --el-color-primary 作为激活/悬浮状态的颜色
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 10px; // 给内容区底部一点空间
  }
}

// 工具卡片网格布局
.tools-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(320px, 1fr)
  ); // 响应式列数，最小宽度320px
  gap: 20px; // 卡片间距
  padding: 10px;
  padding-top: 16px; // 折叠项展开后，卡片与标题间的间距
}

// 单个工具卡片样式
.tool-card {
  border-radius: 8px; // 参考 theme.scss 中的 $border-radius-m
  background-color: #ffffff; // 卡片背景可以与页面背景区分，或者使用 $light-bg
  :deep(.el-card__header) {
    background-color: #f8f9fa; // 卡片头部背景色，可以参考 $primary-hover
    border-bottom: 1px solid #e9ecef; // 卡片头部分割线，可以参考 $primary-active
    padding: 12px 16px; // 调整头部内边距

    .card-header {
      // 自定义头部内容容器
      span {
        font-weight: 600;
        font-size: 16px;
        color: var(--el-color-primary); // 使用 Element Plus 主题色
      }
    }
  }

  :deep(.el-card__body) {
    padding: 16px; // 调整内容区内边距
  }

  .tool-description {
    font-size: 14px;
    color: #555; // 比 $text-secondary 稍深，确保易读性
    line-height: 1.7;
    min-height: 48px; // 给予描述一定的最小高度，使卡片在内容较少时也能保持一定大小
    margin: 0; // 清除段落默认的margin
  }
}

// Element Plus 空状态组件的自定义样式 (如果需要)
.el-empty {
  margin-top: 20px;
  :deep(.el-empty__description p) {
    color: #999; // 参考 theme.scss 中的 $text-secondary
  }
}
</style>
