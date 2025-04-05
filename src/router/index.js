import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/hello',
      name: 'home',
      component: () => import('@/views/MainPage.vue'),
      redirect: { name: 'chat' },
      children: [
        {
          path: 'chat',
          name: 'chat',
          component: () => import('@/views/chatPage.vue'),
        },
        {
          path: 'library',
          name: 'library',
          component: () => import('@/views/LibraryPage.vue'),
        },
        {
          path: 'personal',
          name: 'personal',
          component: () => import('@/views/PersonalPage.vue'),
        },
        {
          path: 'setting',
          name: 'setting',
          component: () => import('@/views/SettingPage.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // 检查路由是否需要认证
  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    // 如果需要认证且用户未登录，重定向到登录页
    next({ name: 'login' })
  } else if (to.name === 'login' && auth.isAuthenticated) {
    // 如果用户已登录且试图访问登录页，重定向到首页
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
