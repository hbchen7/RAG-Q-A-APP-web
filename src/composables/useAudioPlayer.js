import { ref, shallowRef } from 'vue'
import { fetchTTSAudio } from '@/api/ttsAPI'

/**
 * Web Audio API 音频播放器 composable
 * 支持队列播放、停止、加载状态管理
 */
export function useAudioPlayer() {
  const audioContext = shallowRef(null)
  const currentSource = shallowRef(null)

  const isPlaying = ref(false)
  const isLoading = ref(false)
  const audioQueue = ref([])
  const isQueuePlaying = ref(false)

  /**
   * 懒初始化 AudioContext，resume suspended 状态
   */
  function ensureAudioContext() {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
    return audioContext.value
  }

  /**
   * 解码 MP3 ArrayBuffer 为 AudioBuffer
   */
  async function decodeMP3(arrayBuffer) {
    const ctx = ensureAudioContext()
    return ctx.decodeAudioData(arrayBuffer)
  }

  /**
   * 从队列中取出下一个 buffer 并播放
   */
  function playNextInQueue() {
    if (audioQueue.value.length === 0) {
      isQueuePlaying.value = false
      isPlaying.value = false
      return
    }

    isQueuePlaying.value = true
    isPlaying.value = true

    const buffer = audioQueue.value.shift()
    const ctx = ensureAudioContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    currentSource.value = source

    source.onended = () => {
      currentSource.value = null
      playNextInQueue()
    }

    source.start()
  }

  /**
   * 将 AudioBuffer 入队，若未在播放则触发播放
   */
  function enqueueBuffer(audioBuffer) {
    audioQueue.value.push(audioBuffer)
    if (!isQueuePlaying.value) {
      playNextInQueue()
    }
  }

  /**
   * 播放文本：停止当前 → 获取 TTS 音频 → 解码 → 入队播放
   * @param {string} text - 要朗读的文本
   */
  async function play(text) {
    stop()

    isLoading.value = true
    try {
      const response = await fetchTTSAudio(text)
      const reader = response.body.getReader()
      const chunks = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      // 合并所有 chunks 为单个 Uint8Array
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }

      const audioBuffer = await decodeMP3(combined.buffer)
      enqueueBuffer(audioBuffer)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 停止当前播放并清空队列
   */
  function stop() {
    if (currentSource.value) {
      try {
        currentSource.value.stop()
      } catch {
        // ignore if already stopped
      }
      currentSource.value = null
    }
    audioQueue.value = []
    isQueuePlaying.value = false
    isPlaying.value = false
    isLoading.value = false
  }

  return { isPlaying, isLoading, play, stop }
}
