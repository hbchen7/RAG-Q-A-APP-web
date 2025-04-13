# 项目名 AIChats

# 技术栈

## 前端

- Vue3--前端框架
- pnpm --包管理工具
- ElementPlus --UI组件库
- ElementPlus/icons --图标库
- axios--http请求库
- pinia--状态管理库
- vite--打包工具
- sass--css预处理器
- Eslint9 + Prettier --代码规范工具

# 前端项目结构

```
├── public
│   ├── index.html
│   └── manifest.json
├── src
│   ├── assets
│   ├── components
│   ├── router
│   ├── store
│   ├── utils
│   ├── views
|   |   ├── chatPage
|   |   ├── SettingPage
|   |   └── loginPage
|   |   └── LibraryPage
│   ├── App.vue
│   ├── main.js
│   └── shims-vue.d.ts
├── .gitignore
├──  babel.config.js
├──  package.json
├──  package-lock.json
├──  postcss.config.js
├──  README.md
├──  tsconfig.json
└──  vue.config.js
```

## 页面详细结构

- ChatPage
  .chat-container
  ├── .chat-sidebar
  │ └── .sidebar-content
  ├── .chat-main
  │ ├── .chat-messages
  │ │ ├── .message (用户消息)
  │ │ └── .message.assistant (助手消息)
  │ └── .chat-input
  └── .empty-state

# 运行项目

```
pnpm install
pnpm dev
```

# 相关项目-特此鸣谢

- [One API](https://github.com/songquanpeng/one-api)
