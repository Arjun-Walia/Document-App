import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
console.log('🔗 API Base URL:', API_BASE)
console.log('🔧 Mock API enabled:', import.meta.env.VITE_MOCK_API === 'true')

export const api = axios.create({ 
  baseURL: API_BASE,
  timeout: 60000, // Increased to 60 seconds for AI responses
  // Don't set default Content-Type to allow FormData uploads
})

// Add request interceptor for debugging and content-type handling
api.interceptors.request.use(
  config => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url, config.data ? '(with data)' : '')
    
    // Set Content-Type for JSON requests, but not for FormData
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  error => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('📥 API Response:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('❌ Response Error:', error.response?.status || error.code, error.config?.url, error.message)
    return Promise.reject(error)
  }
)

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

// Chat service functions
export const chatService = {
  // Regular chat with optimized settings
  async chat(question, documentIds = null) {
    try {
      const token = localStorage.getItem('token')
      const response = await api.post('/api/chat', {
        question,
        documentIds,
        type: 'question'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 60000 // 60 second timeout
      })
      
      return response.data
    } catch (error) {
      console.error('❌ Chat request failed:', error)
      throw error
    }
  },

  // Streaming chat for real-time responses
  async chatStream(question, documentIds = null, onChunk, onComplete, onError) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          documentIds
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              if (data.error) {
                onError(new Error(data.error))
              } else if (data.done) {
                onComplete(data)
              } else if (data.chunk) {
                onChunk(data.chunk)
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Streaming chat failed:', error)
      onError(error)
    }
  },

  // Document summarization
  async summarize(documentIds = null) {
    try {
      const token = localStorage.getItem('token')
      const response = await api.post('/api/chat/summarize', {
        documentIds
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      })
      
      return response.data
    } catch (error) {
      console.error('❌ Summarization request failed:', error)
      throw error
    }
  }
}
