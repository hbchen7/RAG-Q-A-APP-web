import request from '@/utils/request'

export const createKnowledge = (data) => {
  return request.post('/knowledge/create_knowledge', data)
}

export const updateKnowledge = (data) => {
  return request.post('/knowledge/update', data)
}
