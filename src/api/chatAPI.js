import request from '@/utils/request'

// 流式输出-此处为记录。准确实现见src/views/ChatPage.vue中的fetchEventSource函数
export const streamAPI = (data) => {
  return request.post('/chat/stream', data, {
    responseType: 'stream',
  })
}

// MCP 流式输出-此处为记录。准确实现见src/views/ChatPage.vue中的fetchEventSource函数
export const mcp_streamAPI = (data) => {
  return request.post('/agent/mcp', data, {
    responseType: 'stream',
  })
}

// // 废弃-非流式输出
// export const sayHelloAPI = (data) => {
//   return request.post('/chat', data)
// }
