<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref } from 'vue'
import { ChatDotSquare, Collection, User, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores'

const router = useRouter()
const auth = useAuthStore()

// 导航到对应路由
const handleNavigation = (route) => {
  router.push({ name: route })
}
</script>

<template>
  <el-container class="main-container">
    <!-- 左侧导航栏 -->
    <el-aside class="aside">
      <div class="nav-menu">
        <!-- 导航菜单 -->
        <el-menu
          default-active="chat"
          class="nav-menu-vertical"
          :collapse="false"
          :collapse-transition="false"
        >
          <el-menu-item index="chat" @click="handleNavigation('modelConfig')">
            <el-icon><ChatDotSquare /></el-icon>
            <span class="menu-text">模型服务</span>
          </el-menu-item>

          <el-menu-item index="library" @click="handleNavigation('defaultModel')">
            <el-icon><Collection /></el-icon>
            <span class="menu-text">默认模型</span>
          </el-menu-item>

          <el-menu-item index="setting" @click="handleNavigation('about')">
            <el-icon><Setting /></el-icon>
            <span class="menu-text">关于我们</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-main class="main-content">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.main-container {
  background-color: $light-bg;
  overflow: hidden;
}
.aside {
  background-color: $light-bg;
  flex-shrink: 0;
  width: 160px;
  overflow: hidden;
  box-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.05),
    -2px -2px 4px rgba(255, 255, 255, 0.8);
  .nav-menu {
    .nav-menu-vertical {
      .menu-text {
        margin-left: 10px;
      }
      :deep(.el-menu-item) {
        height: 60px;
        background-color: $light-bg;
        &:hover {
          background-color: $primary-hover;
        }
        &.is-active {
          color: $primary-color;
          background-color: $primary-active;
        }
      }
    }
  }
}
.main-content {
  padding-left: 10px;
  padding-top: 0x;
  overflow: hidden;
}
</style>
