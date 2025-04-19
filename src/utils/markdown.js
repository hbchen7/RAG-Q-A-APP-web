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

// 配置 marked 使用 shiki
marked.use(
  gfmHeadingId(), // 为标题添加 id
  markedHighlight({
    async: true, // 必须为 true 以支持异步高亮
    highlight: async (code, lang) => {
      const highlighterInstance = await initializeHighlighter()

      // 如果初始化失败或语言不受支持，则进行回退处理
      if (
        !highlighterInstance ||
        !highlighterInstance.getLoadedLanguages().includes(lang)
      ) {
        console.warn(
          `Shiki: Language '${lang}' not loaded or highlighter failed. Falling back.`,
        )
        // 安全地转义代码，防止 XSS
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `<pre class="language-${lang || 'plaintext'}"><code>${escapedCode}</code></pre>`
      }

      try {
        // 使用 shiki 生成高亮 HTML，它会包含 <pre> 标签
        return highlighterInstance.codeToHtml(code, {
          lang: lang || 'plaintext', // 提供默认语言
          theme: 'github-light', // 指定主题
        })
      } catch (error) {
        console.error(`Shiki highlighting failed for lang ${lang}:`, error)
        // 高亮过程中出错，同样回退
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return `<pre class="language-${lang || 'plaintext'}"><code>${escapedCode}</code></pre>`
      }
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
  // 确保 Shiki 至少尝试初始化一次
  await initializeHighlighter()
  try {
    // marked.parse 是同步的，但 markedHighlight 使其在内部处理异步
    // 注意：最新版的 marked 可能直接返回 Promise，使用 await 更稳妥
    return await marked.parse(text)
  } catch (err) {
    console.error('Failed to render markdown with Shiki:', err)
    // 渲染失败时，安全地返回原始文本（或进行转义）
    const escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<p>渲染Markdown时出错: ${escapedText}</p>` // 返回包含错误信息的段落
  }
}
