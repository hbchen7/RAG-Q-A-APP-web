<template>
  <span class="audio-control" @click="$emit('toggle')">
    <el-icon v-if="isLoading" class="audio-icon loading">
      <Loading />
    </el-icon>
    <el-icon v-else-if="isPlaying" class="audio-icon playing">
      <VideoPause />
    </el-icon>
    <el-icon v-else class="audio-icon idle">
      <Microphone />
    </el-icon>
  </span>
</template>

<script setup>
import { Microphone, VideoPause, Loading } from '@element-plus/icons-vue'

defineProps({
  isPlaying: Boolean,
  isLoading: Boolean,
})

defineEmits(['toggle'])
</script>

<style lang="scss" scoped>
.audio-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color $transition-duration;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .audio-icon {
    font-size: 16px;

    &.idle {
      color: $text-secondary;
    }

    &.playing {
      color: $primary-color;
    }

    &.loading {
      color: $primary-color;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
