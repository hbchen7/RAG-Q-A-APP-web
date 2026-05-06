# 项目名 AIChats

## 后端

后端项目地址：[RAG_QA](https://github.com/hbchen7/RAG-Q-A-APP)

# 功能

## RAG

- 知识库管理
- 单文件检索与知识库检索

## LLM对话

- 流式输出
- 助手会话管理
- 提示词自定义
- 历史消息功能

# 页面展示

# 运行项目

```bash
pnpm install
pnpm dev
```

# 相关项目

- [One API](https://github.com/songquanpeng/one-api)

## 技术栈

## 前端

- Vue3--前端框架
- ElementPlus --UI组件库
- ElementPlus/icons --图标库
- axios--http请求库
- pinia--状态管理库
- vite--打包工具
- sass--css预处理器
- Eslint9 + Prettier --代码规范工具
- date-fns --日期格式化工具
- marked --Markdown渲染库
- **CDN:** Cloudflare (用于加速和安全)

# 前端项目结构

```
src/
├── api/                    # API接口层
│   ├── assistentAPI.js    # 助手相关接口
│   ├── chatAPI.js         # 聊天相关接口
│   ├── knowledgeAPI.js    # 知识库相关接口
│   ├── oneapi.js          # OneAPI集成接口
│   ├── sessionAPI.js      # 会话管理接口
│   ├── userAPI.js         # 用户相关接口
│   └── TTS.js             # 语音合成接口
├── assets/                # 静态资源
│   ├── fonts/            # 字体文件
│   ├── styles/           # 全局样式
│   └── ic_user.jpg       # 默认用户头像
├── components/            # 公共组件
│   ├── BaseFormDialog.vue           # 基础表单对话框
│   ├── CreateAssistantDialog.vue    # 创建助手对话框
│   ├── CreateKnowledgeBaseDialog.vue # 创建知识库对话框
│   ├── EditAssistantDialog.vue      # 编辑助手对话框
│   ├── EditSessionDialog.vue        # 编辑会话对话框
│   ├── LinkedDropdownGroup.vue      # 联动下拉组件
│   ├── SettingSlider.vue            # 设置滑块组件
│   └── ToolCallDisplay.vue          # 工具调用显示组件
├── router/                # 路由配置
│   └── index.js          # 路由定义
├── stores/                # Pinia状态管理
│   ├── index.js          # Store入口
│   └── modules/          # 模块化Store
│       ├── auth.js           # 认证状态
│       ├── assistant.js      # 助手状态
│       ├── chatConfig.js     # 聊天配置状态
│       ├── knowledge.js      # 知识库状态
│       ├── oneapiModelList.js # OneAPI模型列表状态
│       └── session.js        # 会话状态
├── utils/                 # 工具函数
│   ├── markdown.js        # Markdown渲染工具
│   ├── oneapiRequest.js   # OneAPI请求封装
│   └── request.js         # Axios请求封装
├── views/                 # 页面组件
│   ├── chatPage.vue              # 聊天页面
│   ├── KnowledgeBase.vue         # 知识库管理页面
│   ├── LoginPage.vue             # 登录页面
│   ├── MainPage.vue              # 主页面
│   ├── McpPage.vue               # MCP服务页面
│   ├── SettingPage.vue           # 设置页面
│   └── setting/                  # 设置子页面
│       ├── aboutPage.vue         # 关于页面
│       └── modelsConfigPage.vue  # 模型配置页面
├── App.vue                # 根组件
└── main.js                # 应用入口
```
