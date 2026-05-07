/**
 * TTS API - 调用后端 /tts/synthesize 端点获取音频流
 */

const baseURL = import.meta.env.VITE_API_BASE_URL

/**
 * 请求 TTS 音频流
 * @param {string} text - 要合成的文本
 * @param {string} [voice] - 语音模型标识
 * @param {number} [speed] - 语速 (0.25 - 4.0)
 * @returns {Promise<Response>} 原始 Response 对象，可用于读取 ReadableStream
 */
export async function fetchTTSAudio(text, voice, speed) {
  const body = { text }
  if (voice) body.voice = voice
  if (speed !== undefined) body.speed = speed

  const response = await fetch(`${baseURL}/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status} ${response.statusText}`)
  }

  return response
}
