import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  // 主要文件检查配置
  {
    name: 'app/files-to-lint', // 配置名称，用于标识
    files: ['**/*.{js,mjs,jsx,vue}'], // 指定需要检查的文件类型
    rules: {
      // 'no-console': 'warn', // 自定义规则：console 语句给出警告
    },
  },

  // 忽略文件配置
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'], // 忽略构建输出和测试覆盖率报告目录
  },

  // 全局变量配置
  {
    languageOptions: {
      globals: {
        ...globals.browser, // 添加浏览器环境下的全局变量（如 window, document 等）
      },
    },
  },

  // 继承基础配置
  js.configs.recommended, // 使用基础规则集
  ...pluginVue.configs['flat/essential'], // 使用 Vue 插件的基础规则集
  skipFormatting, // 跳过格式化相关规则，避免与 Prettier 冲突
]
