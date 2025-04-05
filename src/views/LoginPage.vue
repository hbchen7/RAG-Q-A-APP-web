<template>
  <div class="shell">
    <!-- 注册表单容器 -->
    <div :class="['container', 'a-container', { 'is-txl': isLogin }]" id="a-container">
      <form class="form" @submit.prevent="handleRegister" id="a-form">
        <h2 class="form_title title">创建账号</h2>
        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>
        <span class="form_span">选择注册方式或电子邮箱注册</span>
        <input
          v-model="registerForm.username"
          type="text"
          class="form_input"
          placeholder="Username"
        />
        <input
          v-model="registerForm.email"
          type="email"
          class="form_input"
          placeholder="Email"
        />
        <input
          v-model="registerForm.password"
          type="password"
          class="form_input"
          placeholder="Password"
        />
        <button class="form_button button submit" type="submit">注册</button>
      </form>
    </div>

    <!-- 登录表单容器 -->
    <div
      :class="['container', 'b-container', { 'is-txl': isLogin, 'is-z': isLogin }]"
      id="b-container"
    >
      <form class="form" @submit.prevent="handleLogin" id="b-form">
        <h2 class="form_title title">登入账号</h2>
        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>
        <span class="form_span">选择登录方式或电子邮箱登录</span>
        <input
          v-model="loginForm.email"
          type="email"
          class="form_input"
          placeholder="Email"
        />
        <input
          v-model="loginForm.password"
          type="password"
          class="form_input"
          placeholder="Password"
        />
        <a class="form_link">忘记密码？</a>
        <button class="form_button button submit" type="submit">登录</button>
      </form>
    </div>

    <!-- 切换按钮容器 -->
    <div :class="['switch', { 'is-txr': isLogin }]" id="switch-cnt">
      <div class="switch_circle"></div>
      <div class="switch_circle switch_circle-t"></div>

      <!-- 切换到登录的容器 -->
      <div :class="['switch_container', { 'is-hidden': isLogin }]" id="switch-c1">
        <h2 class="switch_title title" style="letter-spacing: 0">Welcome Back！</h2>
        <p class="switch_description description">
          已经有账号了嘛，登入账号进入奇妙世界吧！
        </p>
        <button class="switch_button button" @click="switchForm">登录</button>
      </div>

      <!-- 切换到注册的容器 -->
      <div :class="['switch_container', { 'is-hidden': !isLogin }]" id="switch-c2">
        <h2 class="switch_title title" style="letter-spacing: 0">Hello Friend！</h2>
        <p class="switch_description description">
          去注册一个账号，让我们踏入奇妙的旅途！
        </p>
        <button class="switch_button button" @click="switchForm">注册</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores'
import { ElMessage } from 'element-plus'
import { userRegisterAPI } from '@/api/userAPI'
import router from '@/router'

const auth = useAuthStore()

// 控制登录/注册表单的切换
const isLogin = ref(false)

// 注册表单数据
const registerForm = ref({
  username: '',
  email: '',
  password: '',
})

// 登录表单数据
const loginForm = ref({
  email: '',
  password: '',
})

// 切换表单
const switchForm = () => {
  isLogin.value = !isLogin.value
}

// 处理注册
const handleRegister = async () => {
  try {
    const res = await userRegisterAPI(registerForm.value)
    const { _id } = res
    console.log(res)
    if (_id) {
      ElMessage.success('注册成功！')
      isLogin.value = true
    } else {
      ElMessage.error('注册失败，请重试')
    }
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请重试')
  }
}

// 处理登录
const handleLogin = async () => {
  try {
    const success = await auth.login(loginForm.value)
    if (success) {
      ElMessage.success('登录成功！')
      // TODO: 登录成功后的路由跳转
      router.push({ name: 'home' })
    }
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请重试')
  }
}
</script>

<style scoped>
/* 导入字体图标 */
@import url('../assets/fonts/iconfont.css');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}

.shell {
  position: relative;
  width: 1000px;
  min-width: 1000px;
  min-height: 600px;
  height: 600px;
  padding: 25px;
  background-color: #ecf0f3;
  box-shadow:
    10px 10px 10px #d1d9e6,
    -10px -10px 10px #f9f9f9;
  border-radius: 12px;
  overflow: hidden;
}

/* 设置响应式 */
@media (max-width: 1200px) {
  .shell {
    transform: scale(0.7);
  }
}

@media (max-width: 1000px) {
  .shell {
    transform: scale(0.6);
  }
}

@media (max-width: 800px) {
  .shell {
    transform: scale(0.5);
  }
}

@media (max-width: 600px) {
  .shell {
    transform: scale(0.4);
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
  padding: 25px;
  background-color: #ecf0f3;
  transition: 1.25s;
}

.form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.iconfont {
  margin: 0 5px;
  border: rgba(0, 0, 0, 0.5) 2px solid;
  border-radius: 50%;
  font-size: 25px;
  padding: 3px;
  opacity: 0.5;
  transition: 0.1s;
}

.iconfont:hover {
  opacity: 1;
  transition: 0.15s;
  cursor: pointer;
}

.form_input {
  width: 350px;
  height: 40px;
  margin: 4px 0;
  padding-left: 25px;
  font-size: 13px;
  letter-spacing: 0.15px;
  border: none;
  outline: none;
  background-color: #ecf0f3;
  transition: 0.25s ease;
  border-radius: 8px;
  box-shadow:
    inset 2px 2px 4px #d1d9e6,
    inset -2px -2px 4px #f9f9f9;
}

.form_input:focus {
  box-shadow:
    inset 4px 4px 4px #d1d9e6,
    inset -4px -4px 4px #f9f9f9;
}

.form_span {
  margin-top: 30px;
  margin-bottom: 12px;
}

.form_link {
  color: #181818;
  font-size: 15px;
  margin-top: 25px;
  border-bottom: 1px solid #a0a5a8;
  line-height: 2;
  cursor: pointer;
}

.title {
  font-size: 34px;
  font-weight: 700;
  line-height: 3;
  color: #181818;
  letter-spacing: 10px;
}

.description {
  font-size: 14px;
  letter-spacing: 0.25px;
  text-align: center;
  line-height: 1.6;
}

.button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 50px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: #4b70e2;
  color: #f9f9f9;
  box-shadow:
    8px 8px 16px #d1d9e6,
    -8px -8px 16px #f9f9f9;
  border: none;
  outline: none;
  cursor: pointer;
}

.a-container {
  z-index: 100;
  left: calc(100% - 600px);
}

.b-container {
  left: calc(100% - 600px);
  z-index: 0;
}

.switch {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  padding: 50px;
  z-index: 200;
  transition: 1.25s;
  background-color: #ecf0f3;
  overflow: hidden;
  box-shadow:
    4px 4px 10px #d1d9e6,
    -4px -4px 10px #d1d9e6;
}

.switch_circle {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background-color: #ecf0f3;
  box-shadow:
    inset 8px 8px 12px #b8bec7,
    inset -8px -8px 12px #fff;
  bottom: -60%;
  left: -60%;
  transition: 1.25s;
}

.switch_circle-t {
  top: -30%;
  left: 60%;
  width: 300px;
  height: 300px;
}

.switch_container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: absolute;
  width: 400px;
  padding: 50px 55px;
  transition: 1.25s;
}

.switch_button:hover,
.submit:hover {
  box-shadow:
    6px 6px 10px #d1d9e6,
    -6px -6px 10px #f9f9f9;
  transform: scale(0.985);
  transition: 0.25s;
}

.switch_button:active,
.switch_button:focus {
  box-shadow:
    2px 2px 6px #d1d9e6,
    -2px -2px 6px #f9f9f9;
  transform: scale(0.97);
  transition: 0.25s;
}

.is-txr {
  left: calc(100% - 400px);
  transition: 1.25s;
  transform-origin: left;
}

.is-txl {
  left: 0;
  transition: 1.25s;
  transform-origin: right;
}

.is-z {
  z-index: 200;
  transition: 1.25s;
}

.is-hidden {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  transition: 1.25s;
}

.is-gx {
  animation: is-gx 1.25s;
}

@keyframes is-gx {
  0%,
  10%,
  100% {
    width: 400px;
  }

  30%,
  50% {
    width: 500px;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-message) {
  z-index: 9999 !important;
  position: fixed !important;
  top: 20px !important;
  transform: translateX(-50%) !important;
  left: 50% !important;
  min-width: 300px !important;
}

:deep(.el-message-fade-enter-from),
:deep(.el-message-fade-leave-to) {
  opacity: 0;
  transform: translate(-50%, -100%) !important;
}
</style>
