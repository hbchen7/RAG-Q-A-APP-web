# 错误日志

## 2025年4月4日 路由加载问题

### 问题描述

从登录页面跳转到主界面时，只加载了左侧导航栏，右侧的 chatPage.vue 不能正常显示。需要刷新页面才能正常显示。

### 问题原因

1. 路由配置中没有正确设置默认子路由和重定向
2. 导航方法使用了绝对路径而不是命名路由
3. 子路由的路径配置不完整

### 解决方案

```
 path: '/hello',
      name: 'home',
      component: () => import('@/views/MainPage.vue'),
      redirect: { name: 'chat' },//
      children: [
        {
          path: 'chat',//
          name: 'chat',
          component: () => import('@/views/chatPage.vue'),
        },
```

1. 在主路由配置中添加 redirect 配置，确保访问主页时自动重定向到 chat 页面
2. 修改导航方法，使用命名路由（name）而不是路径（path）进行导航
3. 统一使用相对路径配置子路由

### 经验教训

1. 在使用嵌套路由时，要注意配置默认子路由和重定向
2. 推荐使用命名路由进行导航，这样更加可靠且易于维护
3. 路由路径的配置要统一，推荐在子路由中使用相对路径

## ElMessage 组件影响登录表单布局问题

### 问题描述

- 时间：[2025年4月5日]
- 问题：登录/注册成功或失败时的 ElMessage 消息提示会导致登录表单位置偏移
- 影响：影响用户体验，破坏页面布局

### 问题原因

Element Plus 的 ElMessage 组件默认样式会影响页面布局，因为：

1. 消息提示默认添加到文档流中
2. 默认样式可能与现有布局产生冲突
3. 动画效果可能影响其他元素的位置

### 解决方案

通过自定义 CSS 样式来固定 ElMessage 的位置和行为：

1. 使用 `:global()` 选择器覆盖默认样式
2. 设置固定定位和 z-index
3. 使用 transform 实现居中定位
4. 优化动画效果

### 代码实现

```css
:global(.el-message) {
  z-index: 9999 !important;
  position: fixed !important;
  top: 20px !important;
  transform: translateX(-50%) !important;
  left: 50% !important;
  min-width: 300px !important;
}

:global(.el-message-fade-enter-from),
:global(.el-message-fade-leave-to) {
  opacity: 0;
  transform: translate(-50%, -100%) !important;
}
```

### 经验教训

1. 使用第三方组件时需要注意其默认样式对现有布局的影响
2. 对于全局提示类组件，应该使用固定定位避免影响文档流
3. 在使用 scoped 样式时，需要注意使用 :global() 来修改第三方组件样式

## ElMessage 组件影响登录表单布局问题 - 更新解决方案

### 问题更新

- 问题：之前的 `:global()` 选择器在 Vue 3 中无效
- 原因：Vue 3 中废弃了 `:global()` 选择器，需要使用 `:deep()` 或全局样式文件

### 新的解决方案

提供两种解决方案：

1. 使用全局样式文件（推荐）：

   - 创建 `src/assets/styles/element-plus-override.css`
   - 在 `main.js` 中导入样式文件
   - 样式会全局生效，不受 scoped 限制

2. 使用 `:deep()` 选择器：
   - 在组件的 `<style scoped>` 中使用 `:deep()` 替代 `:global()`
   - 样式只在组件内生效

### 代码实现

方案一：全局样式文件

```css
/* src/assets/styles/element-plus-override.css */
.el-message {
  z-index: 9999 !important;
  position: fixed !important;
  top: 20px !important;
  transform: translateX(-50%) !important;
  left: 50% !important;
  min-width: 300px !important;
}
```

方案二：组件内 `:deep()` 选择器

```css
:deep(.el-message) {
  z-index: 9999 !important;
  position: fixed !important;
  top: 20px !important;
  transform: translateX(-50%) !important;
  left: 50% !important;
  min-width: 300px !important;
}
```

### 经验教训

1. Vue 3 中使用 `:deep()` 替代了 `:global()` 选择器
2. 对于需要全局覆盖的样式，最好使用独立的样式文件
3. 在使用 scoped 样式时，需要注意选择器的作用范围和使用方式
4. 在升级框架版本时，需要注意 API 和语法的变化

## Pinia 状态持久化失效问题

### 问题描述

- 时间：[当前日期]
- 问题：登录成功后刷新页面，Pinia 中的状态被清空，导致用户被退出到登录页面
- 影响：用户体验差，需要重复登录

### 问题原因

1. Pinia 持久化插件配置不完整
2. Store 的持久化策略配置有误
3. Pinia 实例的创建和注册顺序可能影响持久化的正常工作

### 解决方案

1. 正确配置 pinia-plugin-persistedstate 插件：

```javascript
// src/stores/index.js
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

2. 修改 auth store 的持久化配置：

```javascript
{
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth-store',
        storage: localStorage,
        paths: ['isAuthenticated', 'user', 'token']
      }
    ]
  }
}
```

3. 确保 Pinia 在 router 之前初始化：

```javascript
// src/main.js
app.use(pinia) // 先初始化 Pinia
app.use(router)
```

### 经验教训

1. 使用 Pinia 持久化插件时，需要正确配置插件和持久化策略
2. 注意 Vue 应用中各插件的初始化顺序
3. 在使用持久化存储时，建议指定明确的存储键名和需要持久化的字段
4. 对于敏感信息（如 token），建议同时使用 localStorage 作为备份存储
