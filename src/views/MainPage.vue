<script setup>
import { RouterView, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { ChatDotSquare, Collection, User, Setting } from '@element-plus/icons-vue'
import { ElProgress } from 'element-plus'
import { useAuthStore, oneapiModelListStore } from '@/stores'

const router = useRouter()
const auth = useAuthStore()
const oneapiModelList = oneapiModelListStore()

// 控制用户信息卡片的显示
const showUserCard = ref(false)

// 用户信息
const userInfo = ref({
  avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
  username: auth.user.username,
})

// --- 新增计算属性 ---
const quotaConversionRate = 500000 // 500,000 quota = $1

// 总配额等价美元
const totalQuotaDollars = computed(() => {
  if (oneapiModelList.accountQuota <= 0) return '$0.00'
  return `$${(oneapiModelList.accountQuota / quotaConversionRate).toFixed(2)}`
})

// 已用配额等价美元
const usedQuotaDollars = computed(() => {
  if (oneapiModelList.accountUsedQuota <= 0) return '$0.00'
  return `$${(oneapiModelList.accountUsedQuota / quotaConversionRate).toFixed(2)}`
})

// 剩余配额等价美元 (复用 store 中的计算属性)
const remainQuotaDollars = computed(() => oneapiModelList.remainQuotaAmount)

// 已用配额百分比
const usedPercentage = computed(() => {
  if (oneapiModelList.accountQuota <= 0) return 0
  const percentage =
    (oneapiModelList.accountUsedQuota / oneapiModelList.accountQuota) * 100
  // 确保百分比在 0 到 100 之间
  return Math.max(0, Math.min(percentage, 100))
})
// --- 结束新增计算属性 ---

// 导航到对应路由
const handleNavigation = async (route) => {
  router.push({ name: route })
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
    <el-aside class="aside">
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

              <!-- 新增：配额信息显示区域 -->
              <div class="quota-info">
                <div class="quota-text">
                  <span>已用: {{ usedQuotaDollars }}</span>
                  <span>总额: {{ totalQuotaDollars }}</span>
                </div>
                <el-progress
                  :percentage="usedPercentage"
                  :stroke-width="10"
                  :show-text="false"
                  color="#4b70e2"
                  striped
                  striped-flow
                />
                <div class="quota-remain">剩余额度: {{ remainQuotaDollars }}</div>
              </div>
              <!-- 结束：配额信息显示区域 -->

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
          <el-menu-item index="chat" @click="handleNavigation('chat')">
            <el-icon><ChatDotSquare /></el-icon>
            <template #title>聊天助手</template>
          </el-menu-item>

          <el-menu-item index="library" @click="handleNavigation('library')">
            <el-icon><Collection /></el-icon>
            <template #title>知识库</template>
          </el-menu-item>

          <el-menu-item index="personal" @click="handleNavigation('personal')">
            <el-icon><User /></el-icon>
            <template #title>个人中心</template>
          </el-menu-item>

          <el-menu-item index="setting" @click="handleNavigation('modelConfig')">
            <!-- 默认进入第一项 -->
            <el-icon><Setting /></el-icon>
            <template #title>设置</template>
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
  height: 100vh;
  background-color: $light-bg;
  overflow: hidden;
}

.aside {
  background-color: $light-bg;
  z-index: 1000;
  flex-shrink: 0;
  width: 60px;
  overflow: hidden;
  box-shadow: $box-shadow-outer-m;

  .nav-menu {
    .avatar-container {
      border-bottom: none;
      padding: 20px 12px 12px;

      .user-avatar {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .nav-menu-vertical {
      :deep(.el-menu-item) {
        background-color: $light-bg;
        height: 60px;

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
  overflow: auto;
  padding: 20px 10px 10px 10px;
}

.user-card {
  text-align: center;
  padding: 5px;

  h3 {
    margin: 12px 0;
    font-size: 16px;
    color: $text-primary;
  }

  .quota-info {
    margin: 15px 0;
    padding: 10px;
    border-radius: $border-radius-m;
    background-color: #fff;
    box-shadow: $box-shadow-inner-m;

    .quota-text {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .el-progress {
      margin-bottom: 8px;
    }

    .quota-remain {
      font-size: 13px;
      font-weight: 500;
      color: $primary-color;
      text-align: left;
    }
  }

  .el-button--danger {
    margin-top: 10px;
  }
}
</style>
