import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
export const api = axios.create({ baseURL: API_BASE })

// Optional mock layer toggled by VITE_MOCK_API=true
if (import.meta.env.VITE_MOCK_API === 'true') {
  // Lazy import to avoid bundling overhead when not used
  import('axios-mock-adapter').then(({ default: MockAdapter }) => {
    const mock = new MockAdapter(api, { delayResponse: 400 })

    // In-memory store
    let users = [{ id: 'u1', email: 'test@example.com', password: 'password', name: 'Test User' }]
    let token = 'mock-token'
    let docs = [
      { _id: 'd1', originalName: 'example.txt', filename: 'example.txt', createdAt: new Date().toISOString() }
    ]

    mock.onPost('/api/auth/login').reply((config) => {
      const { email, password } = JSON.parse(config.data)
      const u = users.find((x) => x.email === email && x.password === password)
      if (!u) return [401, { error: 'Invalid credentials' }]
      return [200, { token, user: { id: u.id, email: u.email, name: u.name } }]
    })

    mock.onPost('/api/auth/register').reply((config) => {
      const { email, password } = JSON.parse(config.data)
      if (users.some((x) => x.email === email)) return [409, { error: 'Email already registered' }]
      const u = { id: `u${users.length + 1}`, email, password, name: email.split('@')[0] }
      users.push(u)
      return [200, { token, user: { id: u.id, email: u.email, name: u.name } }]
    })

    mock.onGet('/api/files').reply(200, docs)

    mock.onPost('/api/files/upload').reply(200, { id: `d${docs.length + 1}`, filename: 'upload.txt', chunks: 3 })

    mock.onPost('/api/chat').reply((config) => {
      const { question } = JSON.parse(config.data)
      return [200, { answer: `Mock answer to: ${question}\n\nSources: Document 1` }]
    })
  })
}
