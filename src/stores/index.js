import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
export * from './modules/auth'
export * from './modules/oneapiModelList'
export * from './modules/session'
export * from './modules/assistant'
export * from './modules/chatConfig'
export * from './modules/knowledge'
