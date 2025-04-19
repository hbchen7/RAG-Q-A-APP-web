<template>
  <div class="about-page-container markdown-body">
    <!-- 使用 v-html 渲染转换后的 HTML -->
    <div v-html="renderedMarkdown"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 导入 Markdown 渲染函数
import { renderMarkdown } from '@/utils/markdown.js'
// 使用 ?raw 后缀导入 Markdown 文件内容为字符串
import markdownContent from '@/assets/markdown/Setting-About.md?raw'

// 创建一个 ref 来存储渲染后的 HTML
const renderedMarkdown = ref('')

// 在组件挂载后执行 Markdown 渲染
onMounted(async () => {
  try {
    // 调用异步渲染函数并等待结果
    renderedMarkdown.value = await renderMarkdown(markdownContent)
  } catch (error) {
    console.error('渲染 About 页面的 Markdown 出错:', error)
    // 可选：在页面上显示错误信息
    renderedMarkdown.value = '<p>加载内容时出错。</p>'
  }
})
</script>

<style lang="scss" scoped>
.about-page-container {
  padding: 20px;
  background-color: #fff; // 添加背景色以便区分
  border-radius: $border-radius-m; // 使用 theme.scss 中的圆角变量
  box-shadow: $box-shadow-outer-m; // 使用 theme.scss 中的外凸阴影
  margin: 20px; // 添加一些外边距
}

.markdown-body {
  // 基础文本样式
  line-height: 1.6;
  color: $text-primary;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    font-weight: 600;
  }

  h1 {
    font-size: 1.8em;
    border-bottom: 1px solid #eee; // 给 h1 添加下划线
    padding-bottom: 0.3em;
  }

  p {
    margin-bottom: 1em;
  }

  ul,
  ol {
    padding-left: 2em;
    margin-bottom: 1em;
  }

  li {
    margin-bottom: 0.4em;
  }

  // 针对 Shiki 生成的代码块添加一些基础样式（如果需要覆盖默认）
  // Shiki 默认会应用自己的样式，这里可以微调或添加容器样式
  :deep(pre.shiki) {
    margin-bottom: 1em;
    border-radius: $border-radius-m; // 代码块圆角
    padding: 1em; // 增加内边距
    overflow-x: auto; // 横向滚动
  }

  // 可能需要针对 inline code `code` 进行样式调整
  :deep(code:not(pre > code)) {
    background-color: #f0f0f0; // 浅灰色背景
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  // 引用块样式
  :deep(blockquote) {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid #ccc;
    background-color: #f8f8f8;
    color: #666;
    p {
      margin-bottom: 0; // 移除引用块内段落的下边距
    }
  }

  // 使用 :deep() 强制作用于 v-html 渲染出的 a 标签
  :deep(a) {
    color: $primary-color; // 使用主题色作为链接颜色
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
