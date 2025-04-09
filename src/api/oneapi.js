import oneapiRequest from '@/utils/oneapiRequest'

/**
 * 使用用户名和密码登录 OneAPI
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} 返回登录结果，具体结构取决于 OneAPI 的响应
 */
export const login_Oneapi = async (username, password) => {
  return await oneapiRequest.post('/api/user/login', {
    username,
    password,
  })
}

export const register_Oneapi = async (username, password) => {
  return await oneapiRequest.post('/api/user/register', {
    username,
    password,
  })
}

/**
 * 根据当前用户的 cookie 获取其在 OneAPI 中的令牌列表
 * @returns {Promise<Array<object>>} 返回用户的令牌列表，
 * 响应实例
 * {
    "data": [
        {
            "id": 5,
            "user_id": 2,
            "key": "fOy19fU4WQ29Dhg6B018DfB821E6406a93549bD85513919a",
            "status": 1,
            "name": "openRouter",
            "created_time": 1744087884,
            "accessed_time": 1744087884,
            "expired_time": -1,
            "remain_quota": 500000,
            "unlimited_quota": false,
            "used_quota": 0,
            "models": "google/gemini-2.5-pro-exp-03-25:free",
            "subnet": ""
        },
        {
            "id": 3,
            "user_id": 2,
            "key": "HduAb5sRchv3FUJN7a459bE7FaEe4bEc9d119d0168971c85",
            "status": 1,
            "name": "123",
            "created_time": 1743942751,
            "accessed_time": 1743942751,
            "expired_time": -1,
            "remain_quota": 500000,
            "unlimited_quota": true,
            "used_quota": 0,
            "models": "Qwen/Qwen2.5-7B-Instruct,BAAI/bge-m3",
            "subnet": ""
        }
    ],
    "message": "",
    "success": true
}
 */
export const getModelTokens_Oneapi = async () => {
  return await oneapiRequest.get('/api/token/')
}

/**
 * 从 OneAPI 获取可用的模型列表
 * @returns {Promise<Array<object>>} 返回包含模型信息的对象数组，具体结构取决于 OneAPI 的响应
 */
export const getModels_oneapi = async () => {
  return await oneapiRequest.get('/v1/models')
}
