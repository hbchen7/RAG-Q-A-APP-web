import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import * as shiki from 'shiki' // 导入 shiki

// 缓存 Shiki highlighter 实例
let highlighter

/**
 * 异步初始化 Shiki highlighter
 * @returns {Promise<shiki.Highlighter>} highlighter 实例
 */
async function initializeHighlighter() {
  if (!highlighter) {
    console.log('Initializing Shiki highlighter...')
    try {
      highlighter = await shiki.createHighlighter({
        // 可以根据需要添加更多主题和语言
        themes: ['github-light'], // 使用 GitHub 亮色主题
        langs: [
          'javascript',
          'js',
          'typescript',
          'ts',
          'vue',
          'css',
          'scss',
          'html',
          'json',
          'yaml',
          'markdown',
          'md',
          'python',
          'py',
          'java',
          'csharp',
          'cs',
          'bash',
          'sh',
          'plaintext', // 添加 plaintext 以处理未知或无语言标识的情况
        ],
      })
      console.log('Shiki highlighter initialized successfully.')
    } catch (error) {
      console.error('Failed to initialize Shiki highlighter:', error)
      // 初始化失败，后续高亮会回退
      highlighter = null // 标记为 null，避免重复尝试失败的初始化
    }
  }
  return highlighter
}

// 创建一个自定义渲染器
const renderer = new marked.Renderer()

// 覆盖 link 方法以添加 target="_blank"
renderer.link = (href, title, text) => {
  // 调用原始渲染器的 link 方法生成基础 HTML
  // 这样可以保留 marked 对 href 和 title 的默认处理逻辑
  const linkHtml = marked.Renderer.prototype.link.call(renderer, href, title, text)
  // 使用字符串替换在 <a> 标签开始处安全地插入 target 和 rel 属性
  // rel="noopener noreferrer" 是安全实践，防止新页面通过 window.opener 访问原始页面
  return linkHtml.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
}

// 配置 marked 使用自定义渲染器和其他选项
marked.setOptions({
  renderer: renderer, // 使用自定义渲染器
  breaks: true, // 转换换行符为 <br>
  gfm: true, // 启用 GitHub 风格的 Markdown
})

// 配置 marked 使用 shiki 进行代码高亮 (通过 marked.use 添加扩展)
marked.use(
  gfmHeadingId(), // 为标题添加 id
  markedHighlight({
    async: true, // 必须为 true 以支持异步高亮
    highlight: async (code, lang) => {
      const highlighterInstance = await initializeHighlighter()

      // 如果初始化失败或语言不受支持，则进行回退处理
      if (
        !highlighterInstance ||
        (lang && !highlighterInstance.getLoadedLanguages().includes(lang)) // 检查 lang 是否存在
      ) {
        if (lang) {
          // 只有在提供了 lang 时才警告未知语言
          console.warn(
            `Shiki: Language '${lang}' not loaded or highlighter failed. Falling back.`,
          )
        }
        // 安全地转义代码，防止 XSS
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // 为没有指定语言或语言无效的代码块添加 'plaintext' 类和 Shiki 主题类
        return `<pre class="shiki github-light language-${lang || 'plaintext'}"><code>${escapedCode}</code></pre>`
      }

      try {
        // 使用 shiki 生成高亮 HTML，它会包含 <pre> 标签和正确的类名
        return highlighterInstance.codeToHtml(code, {
          lang: lang, // 传递获取到的语言
          theme: 'github-light', // 指定主题
        })
      } catch (error) {
        console.error(`Shiki highlighting failed for lang ${lang}:`, error)
        // 高亮过程中出错，同样回退
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // 添加 Shiki 主题类和 'plaintext' 类
        return `<pre class="shiki github-light language-${lang || 'plaintext'}"><code>${escapedCode}</code></pre>`
      }
    },
  }),
  // 注意：不需要在这里重复设置 breaks 和 gfm，因为它们已在 setOptions 中设置
)

/**
 * 渲染 Markdown 文本
 * @param {string} text - 要渲染的 Markdown 文本
 * @returns {Promise<string>} 渲染后的 HTML
 */
export const renderMarkdown = async (text) => {
  // 确保 Shiki 至少尝试初始化一次
  await initializeHighlighter()
  try {
    // marked.parse 现在会使用上面 setOptions 和 use 配置好的实例
    return await marked.parse(text)
  } catch (err) {
    console.error('Failed to render markdown with Shiki:', err)
    // 渲染失败时，安全地返回原始文本（或进行转义）
    const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<p>渲染Markdown时出错: ${escapedText}</p>` // 返回包含错误信息的段落
  }
}
