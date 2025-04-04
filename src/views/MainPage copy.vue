<script setup>
import { RouterView } from 'vue-router'
// import { ChatDotSquare, Book, User, Setting } from '@element-plus/icons-vue'
const selectComponent = (componentName) => {
  console.log(componentName)
}
</script>

<template>
  <el-container>
    <!-- 左侧导航栏 -->
    <el-aside>
      <el-menu default-active="1" class="el-menu-vertical-demo">
        <!-- 聊天助手 -->
        <el-menu-item index="1" @click="selectComponent('ChatPage')">
          <!-- <el-icon><ChatDotSquare /></el-icon> -->
        </el-menu-item>
        <!-- 知识库 -->
        <el-menu-item index="2" @click="selectComponent('LibraryPage')">
          <!-- <el-icon><Book /></el-icon> -->
        </el-menu-item>
        <!-- 个人中心 -->
        <el-menu-item index="3" @click="selectComponent('PersonalPage')">
          <!-- <el-icon><User /></el-icon> -->
        </el-menu-item>
        <!-- 设置 -->
        <el-menu-item index="4" @click="selectComponent('SettingPage')">
          <!-- <el-icon><Setting /></el-icon> -->
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧功能页面 -->
    <el-main>
      <!-- <h1>功能页面</h1> -->
      <RouterView></RouterView>
    </el-main>
  </el-container>
</template>

<style scoped></style>
