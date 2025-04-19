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
- date-fns --日期格式化工具
- marked --Markdown渲染库

# 前端项目结构

```
├── public
│   ├── index.html
│   └── manifest.json
├── src
│   ├── assets
│   │   ├── fonts        # 字体图标
│   │   ├── images       # 图片资源
│   │   └── styles      # 样式文件 (包含全局 theme.scss)
│   ├── components      # 公共组件
│   │   ├── BaseFormDialog.vue
│   │   ├── CreateAssistantDialog.vue
│   │   ├── EditAssistantDialog.vue
│   │   ├── EditSessionDialog.vue
│   │   └── CreateKnowledgeBaseDialog.vue
│   ├── router         # 路由配置
│   │   └── index.js
│   ├── stores         # 状态管理 (Pinia)
│   │   ├── modules    # 模块化的 store
│   │   │   ├── assistant.js
│   │   │   ├── auth.js
│   │   │   ├── knowledge.js
│   │   │   ├── oneapiModelList.js
│   │   │   └── session.js
│   │   └── index.js
│   ├── api           # API 接口 (axios 封装)
│   │   ├── authAPI.js
│   │   ├── assistantAPI.js
│   │   ├── chatAPI.js
│   │   ├── knowledgeAPI.js
│   │   ├── oneapi.js
│   │   └── sessionAPI.js
│   ├── utils         # 工具函数
│   │   ├── markdown.js # Markdown 渲染
│   │   └── request.js  # axios 封装实例
│   ├── views         # 页面组件
│   │   ├── MainPage.vue      # 主页面布局
│   │   ├── chatPage.vue      # 聊天页面
│   │   ├── SettingPage.vue   # 设置页面
│   │   ├── LoginPage.vue     # 登录注册页面
│   │   └── KnowledgeBase.vue # 知识库页面
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
│       ├── .avatar-container (用户头像与信息卡片)
│       └── .nav-menu-vertical (导航菜单)
└── .main-content (主内容区)
    └── RouterView (路由视图)
```

### ChatPage (聊天页面)

```
.chat-container
├── .sidebar (左侧边栏)
│   └── .tabs (助手/话题/设置 选项卡)
│       ├── .list-header (列表头部，含添加按钮)
│       └── .list-content (助手/话题列表)
│           └── .list-item (列表项，含操作按钮)
└── .chat-main (聊天主区域)
    ├── .chat-messages (消息显示区)
    │   └── .message (单条消息, human/ai)
    └── .chat-input (输入区域)
        ├── el-input (消息输入框)
        └── .input-actions (操作按钮)
            ├── .el-button-group-chat-left (令牌/模型选择)
            └── .el-button-group (发送/设置按钮)
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

### KnowledgeBase (知识库页面)

```
.knowledge-base-container
├── .kb-sidebar (左侧边栏)
│   ├── .sidebar-header (新建按钮)
│   └── .kb-list-scrollbar (知识库列表滚动区)
│       └── .kb-menu (知识库列表)
│           └── .el-menu-item (列表项，含操作按钮)
└── .kb-main-content (右侧主内容区)
    ├── .kb-detail-header (详情和上传区域)
    │   ├── .kb-info (知识库信息展示)
    │   └── .file-upload-area (文件上传区)
    └── .file-list-section (文件列表区域)
        └── .el-table (文件列表)
```

# 运行项目

```bash
pnpm install
pnpm dev
```

# 相关项目-特此鸣谢

- [One API](https://github.com/songquanpeng/one-api)
