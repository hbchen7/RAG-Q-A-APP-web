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
│   │   ├── fonts        # 字体图标
│   │   ├── images       # 图片资源
│   │   └── styles      # 样式文件
│   ├── components      # 公共组件
│   │   └── CreateAssistantDialog.vue
│   ├── router         # 路由配置
│   ├── stores         # 状态管理
│   │   ├── modules    # 模块化的store
│   │   └── index.js
│   ├── api           # API 接口
│   ├── utils         # 工具函数
│   ├── views         # 页面组件
│   │   ├── MainPage.vue      # 主页面布局
│   │   ├── ChatPage.vue      # 聊天页面
│   │   ├── SettingPage.vue   # 设置页面
│   │   ├── LoginPage.vue     # 登录注册页面
│   │   └── LibraryPage.vue   # 知识库页面
│   ├── App.vue
│   ├── main.js
│   └── shims-vue.d.ts
├── .gitignore
├── babel.config.js
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── README.md
├── tsconfig.json
└── vite.config.js
```

## 页面详细结构

### MainPage (主页面布局)

```
.main-container
├── .aside (侧边栏)
│   └── .nav-menu
│       ├── .avatar-container (用户头像)
│       └── .nav-menu-vertical (导航菜单)
└── .main-content (主内容区)
    └── RouterView (路由视图)
```

### ChatPage (聊天页面)

```
.chat-container
├── .sidebar (左侧边栏)
│   └── .nav-menu
│       ├── .tabs (选项卡)
│       │   ├── assistants (助手列表)
│       │   ├── topics (话题列表)
│       │   └── settings (设置选项)
│       └── .list-content (列表内容)
└── .chat-main (聊天主区域)
    ├── .chat-messages
    │   ├── .message.user (用户消息)
    │   └── .message.assistant (助手消息)
    └── .chat-input (输入区域)
        ├── textarea (消息输入框)
        └── .input-actions (操作按钮)
            ├── .token-selector (令牌选择)
            ├── .model-selector (模型选择)
            └── .action-buttons (操作按钮组)
```

### LoginPage (登录注册页面)

```
.shell
├── .a-container (注册表单容器)
├── .b-container (登录表单容器)
└── .switch (切换按钮容器)
```

### SettingPage (设置页面)

```
.main-container
├── .aside (侧边导航)
└── .main-content (设置内容)
```

# 运行项目

```
pnpm install
pnpm dev
```

# 相关项目-特此鸣谢

- [One API](https://github.com/songquanpeng/one-api)
