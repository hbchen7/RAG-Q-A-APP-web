<template>
  <div class="oneapi-container">
    <!-- 本地运行:src="http://localhost:3000/token"-->
    <iframe
      :src="oneapiUrl"
      style="width: 100%; height: 100vh; border: none"
      title="OneAPI 配置面板"
    />
  </div>
</template>

<script setup>
const oneapiUrl = import.meta.env.VITE_ONEAPI_IFRAME_TOKEN_URL
if (!oneapiUrl) {
  console.error('oneapiUrl is not defined')
  throw new Error('oneapiUrl is not defined')
}
</script>
<style scoped>
.oneapi-container {
  padding: 0;
  background: #fff;
  border-radius: 8px;
}
</style>
