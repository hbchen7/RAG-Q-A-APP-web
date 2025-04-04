<template>
  <div class="app-container">
    <el-container class="full-height">
      <el-aside width="200px" class="aside">Aside</el-aside>
      <el-container>
        <el-header class="header">Header</el-header>
        <el-main class="main">Main</el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
/* 确保根元素占满全屏 */
html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
/* 重置所有边距和填充 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  width: 100%;
  height: 100vh;
}

.full-height {
  height: 100%;
}

/* 强制去除Element Plus可能的内置边距 */
.el-container {
  margin: 0 !important;
  padding: 0 !important;
}

.aside {
  background-color: #545c64;
  color: white;
}

.header {
  background-color: #409eff;
  color: white;
  line-height: 60px;
}

.main {
  background-color: #f5f7fa;
}
</style>
