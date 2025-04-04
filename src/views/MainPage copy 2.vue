<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref } from 'vue'
import { ChatDotSquare, Collection, User, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

// 控制用户信息卡片的显示
const showUserCard = ref(false)

// 用户信息（后续从store中获取）
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  username: '测试用户',
})

// 导航到对应路由
const handleNavigation = (route) => {
  router.push(route)
}

// 退出登录
const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="main-container">
    <!-- 左侧导航栏 -->
    <el-aside width="64px" class="aside">
      <div class="nav-menu">
        <!-- 用户头像 -->
        <div class="avatar-container">
          <el-popover
            placement="right"
            :width="200"
            trigger="click"
            v-model:visible="showUserCard"
          >
            <template #reference>
              <el-avatar :size="40" :src="userInfo.avatar" class="user-avatar" />
            </template>
            <!-- 用户信息卡片 -->
            <div class="user-card">
              <el-avatar :size="60" :src="userInfo.avatar" />
              <h3>{{ userInfo.username }}</h3>
              <el-button type="danger" size="small" @click="handleLogout">
                退出登录
              </el-button>
            </div>
          </el-popover>
        </div>

        <!-- 导航菜单 -->
        <el-menu
          default-active="chat"
          class="nav-menu-vertical"
          :collapse="true"
          :collapse-transition="false"
        >
          <el-menu-item index="chat" @click="handleNavigation('/')">
            <el-icon><ChatDotSquare /></el-icon>
            <template #title>聊天助手</template>
          </el-menu-item>

          <el-menu-item index="library" @click="handleNavigation('/library')">
            <el-icon><Collection /></el-icon>
            <template #title>知识库</template>
          </el-menu-item>

          <el-menu-item index="personal" @click="handleNavigation('/personal')">
            <el-icon><User /></el-icon>
            <template #title>个人中心</template>
          </el-menu-item>

          <el-menu-item index="setting" @click="handleNavigation('/setting')">
            <el-icon><Setting /></el-icon>
            <template #title>设置</template>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-main class="main-content">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.main-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
}

.nav-menu {
  height: 100%;
  display: flex;
  flex-direction: column;

  .avatar-container {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #e6e6e6;

    .user-avatar {
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  .nav-menu-vertical {
    border-right: none;

    :deep(.el-menu-item) {
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover {
        background-color: #f5f7fa;
      }

      &.is-active {
        background-color: #ecf5ff;
        color: #409eff;
      }

      .el-icon {
        font-size: 20px;
      }
    }
  }
}

.main-content {
  margin-left: 64px;
  // padding: 20px;
}

.user-card {
  text-align: center;
  padding: 16px;

  h3 {
    margin: 12px 0;
    font-size: 16px;
    color: #333;
  }
}
</style>
