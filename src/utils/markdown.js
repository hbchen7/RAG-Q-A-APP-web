import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import { gfmHeadingId } from 'marked-gfm-heading-id'

// 配置 marked
marked.use(
  gfmHeadingId(), // 为标题添加 id
  markedHighlight({
    highlight: (code, lang) => {
      // 简单的代码高亮处理
      // 注意：这里返回的 HTML 结构需要配合 CSS 来实现代码块样式
      // 确保有一个全局或局部的 CSS 规则能正确显示 <pre><code>
      const language = lang || 'plaintext' // 提供一个默认语言
      return `<pre><code class="language-${language}">${code}</code></pre>`
    },
  }),
  {
    breaks: true, // 转换换行符为 <br>
    gfm: true, // 启用 GitHub 风格的 Markdown
  },
)

/**
 * 渲染 Markdown 文本
 * @param {string} text - 要渲染的 Markdown 文本
 * @returns {Promise<string>} 渲染后的 HTML
 */
export const renderMarkdown = async (text) => {
  try {
    return await marked(text)
  } catch (err) {
    console.error('Failed to render markdown:', err)
    return text // 如果渲染失败，返回原始文本
  }
}
