import React, { useEffect, useState } from 'react'
import { api } from './apiClient'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  function save(t) {
    setToken(t)
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }
  return { token, setToken: save }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
  const url = `/api/auth/${mode}`
  const { data } = await api.post(url, { email, password })
      onLogin(data.token)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? '...' : (mode === 'login' ? 'Login' : 'Register')}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>Switch to {mode === 'login' ? 'Register' : 'Login'}</button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  )
}

function Uploader({ token, onUploaded }) {
  const [file, setFile] = useState()
  const [busy, setBusy] = useState(false)

  const upload = async () => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post(`/api/files/upload`, form, {
        headers: import.meta.env.VITE_MOCK_API === 'true' ? {} : { Authorization: `Bearer ${token}` }
      })
      onUploaded(data)
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
      <button onClick={upload} disabled={!file || busy}>{busy ? 'Uploading...' : 'Upload'}</button>
    </div>
  )
}

function Chat({ token }) {
  const [docs, setDocs] = useState([])
  const [question, setQuestion] = useState('Summarize the latest upload.')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const load = async () => {
  const { data } = await api.get(`/api/files`, { headers: import.meta.env.VITE_MOCK_API === 'true' ? {} : { Authorization: `Bearer ${token}` } })
      setDocs(data)
    }
    load()
  }, [token])

  const ask = async () => {
    setBusy(true)
    setAnswer('')
    try {
  const { data } = await api.post(`/api/chat`, { question, documentIds: docs.slice(0, 3).map(d => d._id) }, { headers: import.meta.env.VITE_MOCK_API === 'true' ? {} : { Authorization: `Bearer ${token}` } })
      setAnswer(data.answer)
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3>Documents</h3>
      <ul>
        {docs.map(d => <li key={d._id}>{d.originalName}</li>)}
      </ul>
      <textarea rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button onClick={ask} disabled={busy}>{busy ? 'Thinking…' : 'Ask'}</button>
      {answer && (
        <div>
          <h4>Answer</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{answer}</pre>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const auth = useAuth()
  const [lastUpload, setLastUpload] = useState(null)

  if (!auth.token) return <Login onLogin={auth.setToken} />

  return (
    <div style={{ margin: 24, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Chat with Your Documents</h1>
        <button onClick={() => auth.setToken('')}>Logout</button>
      </div>

      <Uploader token={auth.token} onUploaded={setLastUpload} />
      {lastUpload && <div>Uploaded: {lastUpload.filename} ({lastUpload.chunks} chunks)</div>}

      <Chat token={auth.token} />
    </div>
  )
}
