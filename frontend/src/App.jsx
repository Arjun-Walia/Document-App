import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { api } from './apiClient'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { 
  Sun, 
  Moon, 
  Upload, 
  MessageCircle, 
  FileText, 
  LogOut, 
  Sparkles,
  Bot,
  User,
  Send,
  Loader2
} from 'lucide-react'

// Theme hook
function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  function save(t) {
    setToken(t)
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }
  return { token, setToken: save }
}

function GradientTitle({ children }) {
  const titleRef = useRef()
  
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, 
        { opacity: 0, y: 30, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 1,
          ease: "back.out(1.7)",
          delay: 0.2
        }
      )
    }
  }, [])

  return (
    <motion.h1 
      ref={titleRef}
      className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight gradient-text text-center"
      animate={{ 
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      {children}
    </motion.h1>
  )
}

function GlassCard({ children, className = '', delay = 0 }) {
  const cardRef = useRef()
  
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          delay: delay
        }
      )
    }
  }, [delay])

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={`card glass-card ${className}`}
      onMouseEnter={() => {
        gsap.to(cardRef.current, {
          boxShadow: "0 20px 40px -12px rgba(19, 153, 255, 0.25)",
          duration: 0.3
        })
      }}
      onMouseLeave={() => {
        gsap.to(cardRef.current, {
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          duration: 0.3
        })
      }}
    >
      {children}
    </motion.div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button 
      onClick={onToggle} 
      aria-label="Toggle theme" 
      className="relative h-12 w-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600" />
        )}
      </motion.div>
      
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap"
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </motion.div>
      )}
    </motion.button>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef()

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current.children,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.3
        }
      )
    }
  }, [])

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
      // Shake animation on error
      gsap.to(formRef.current, {
        x: [-10, 10, -10, 10, 0],
        duration: 0.4
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="w-full max-w-md mx-auto" delay={0.4}>
      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center mb-4"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-display font-semibold tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Join us today'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Sign in to continue your journey' : 'Create your account to get started'}
          </p>
        </div>
        
        <div className="space-y-4">
          <motion.input 
            className="input text-center" 
            placeholder="Email address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            whileFocus={{ scale: 1.02 }}
          />
          <motion.input 
            className="input text-center" 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            whileFocus={{ scale: 1.02 }}
          />
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}
        
        <div className="flex gap-3 pt-2">
          <motion.button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary flex-1 h-12 text-base font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </motion.button>
        </div>
        
        <motion.button 
          type="button" 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
          className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors font-medium"
          whileHover={{ scale: 1.05 }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </motion.button>
      </form>
    </GlassCard>
  )
}

function Uploader({ token, onUploaded }) {
  const [file, setFile] = useState()
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef()

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
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally { 
      setBusy(false) 
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) setFile(droppedFile)
  }

  return (
    <div className="space-y-4">
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          dragOver 
            ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0])} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt"
        />
        
        <motion.div
          animate={{ y: dragOver ? -2 : 0 }}
          className="space-y-3"
        >
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-200">
              {file ? file.name : 'Drop your file here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse'}
            </p>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.button 
        onClick={upload} 
        disabled={!file || busy} 
        className="btn btn-primary w-full h-12 text-base font-semibold"
        whileHover={{ scale: file && !busy ? 1.02 : 1 }}
        whileTap={{ scale: file && !busy ? 0.98 : 1 }}
      >
        {busy ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
            Uploading...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Process Document
          </>
        )}
      </motion.button>
    </div>
  )
}

function Chat({ token }) {
  const [docs, setDocs] = useState([])
  const [question, setQuestion] = useState('Summarize the latest upload.')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const chatRef = useRef()

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/api/files`, { headers: import.meta.env.VITE_MOCK_API === 'true' ? {} : { Authorization: `Bearer ${token}` } })
      setDocs(data)
    }
    load()
  }, [token])

  useEffect(() => {
    if (chatRef.current && docs.length > 0) {
      gsap.fromTo(chatRef.current.querySelectorAll('.doc-item'),
        { opacity: 0, x: -20 },
        { 
          opacity: 1, 
          x: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out"
        }
      )
    }
  }, [docs])

  const ask = async () => {
    setBusy(true)
    setAnswer('')
    try {
      const { data } = await api.post(`/api/chat`, { question, documentIds: docs.slice(0, 3).map(d => d._id) }, { headers: import.meta.env.VITE_MOCK_API === 'true' ? {} : { Authorization: `Bearer ${token}` } })
      setAnswer(data.answer)
    } finally { setBusy(false) }
  }

  return (
    <GlassCard className="w-full" delay={0.2}>
      <div ref={chatRef} className="flex flex-col gap-6">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-display font-semibold">Your Documents</h3>
          </div>
          <motion.span 
            className="badge text-lg px-3 py-1"
            animate={{ scale: docs.length > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {docs.length}
          </motion.span>
        </motion.div>
        
        <div className="grid gap-3">
          {docs.length > 0 ? (
            docs.map((d, index) => (
              <motion.div
                key={d._id}
                className="doc-item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600"
                whileHover={{ x: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {d.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {d.chunks} chunks processed
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload your first document to get started</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <motion.textarea 
              rows={4} 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              className="input h-32 resize-y pr-12" 
              placeholder="Ask anything about your documents..."
              whileFocus={{ scale: 1.01 }}
            />
            <motion.div 
              className="absolute bottom-3 right-3"
              whileHover={{ scale: 1.1 }}
            >
              <MessageCircle className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
          
          <div className="flex justify-end">
            <motion.button 
              onClick={ask} 
              disabled={busy || docs.length === 0} 
              className="btn btn-primary min-w-32 h-12"
              whileHover={{ scale: busy || docs.length === 0 ? 1 : 1.05 }}
              whileTap={{ scale: busy || docs.length === 0 ? 1 : 0.95 }}
            >
              {busy ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                  Thinking...
                </>
              ) : (
                <>
                  <Bot className="w-5 h-5 mr-2" />
                  Ask AI
                </>
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {answer && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border border-brand-200 dark:border-brand-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-display font-semibold text-brand-700 dark:text-brand-300">AI Response</h4>
              </div>
              <motion.pre 
                className="whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-auto text-gray-700 dark:text-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {answer}
              </motion.pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}

export default function App() {
  const auth = useAuth()
  const theme = useTheme()
  const [lastUpload, setLastUpload] = useState(null)
  const appRef = useRef()

  useEffect(() => {
    if (appRef.current) {
      gsap.fromTo(appRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      )
    }
  }, [])

  if (!auth.token) {
    return (
      <motion.main 
        ref={appRef}
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <BackgroundDecor />
        
        {/* Top right theme toggle for login page */}
        <motion.div 
          className="fixed top-6 right-6 z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />
        </motion.div>

        <div className="mb-12 text-center space-y-6 max-w-2xl mx-auto">
          <GradientTitle>Chat with Your Documents</GradientTitle>
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Transform your documents into intelligent conversations. Upload any file and let AI help you understand, analyze, and extract insights instantly.
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Powered by Ollama
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              100% Local Processing
            </div>
          </motion.div>
        </div>
        
        <Login onLogin={auth.setToken} />
        
        <motion.div 
          className="mt-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Secure • Private • Lightning Fast</span>
        </motion.div>
      </motion.main>
    )
  }

  return (
    <div ref={appRef} className="min-h-screen flex flex-col">
      <BackgroundDecor />
      
      <motion.header 
        className="sticky top-0 z-10 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                DocumentAI
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Intelligent Document Assistant</p>
            </div>
          </motion.div>
          
          {/* Theme toggle moved to top right */}
          <div className="flex items-center gap-4">
            <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />
            <motion.button 
              onClick={() => auth.setToken('')} 
              className="btn btn-outline h-10 px-4 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </motion.header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid gap-8 lg:grid-cols-3 items-start relative">
        <motion.div 
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard delay={0.3}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display font-semibold text-xl">Upload & Process</h2>
            </div>
            <Uploader token={auth.token} onUploaded={setLastUpload} />
            <AnimatePresence>
              {lastUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Successfully processed!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {lastUpload.filename} • {lastUpload.chunks} chunks
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
        
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Chat token={auth.token} />
        </motion.div>
      </main>
      
      <motion.footer 
        className="py-8 text-center border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Built with ❤️ using React + Vite</span>
          <span>•</span>
          <span>Powered by Ollama AI</span>
          <span>•</span>
          <span>100% Local & Private</span>
        </div>
      </motion.footer>
    </div>
  )
}

function BackgroundDecor() {
  const decorRef = useRef()
  
  useEffect(() => {
    if (decorRef.current) {
      const orbs = decorRef.current.querySelectorAll('.floating-orb')
      
      gsap.set(orbs, { transformOrigin: "center center" })
      
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          x: `random(-50, 50)`,
          y: `random(-30, 30)`,
          rotation: `random(-180, 180)`,
          scale: `random(0.8, 1.2)`,
          duration: `random(8, 12)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5
        })
      })
    }
  }, [])

  return (
    <div ref={decorRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Floating orbs with enhanced animations */}
      <div className="floating-orb absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-r from-brand-400/30 via-brand-500/20 to-brand-600/30 dark:from-brand-600/20 dark:via-brand-700/10 dark:to-brand-800/20 blur-3xl" />
      <div className="floating-orb absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-gradient-to-l from-purple-400/20 via-pink-400/15 to-purple-600/20 dark:from-purple-600/10 dark:via-pink-600/8 dark:to-purple-800/15 blur-3xl" />
      <div className="floating-orb absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-t from-emerald-400/20 via-teal-400/15 to-emerald-600/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-emerald-800/15 blur-3xl" />
      <div className="floating-orb absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-yellow-400/15 via-orange-400/10 to-red-400/15 dark:from-yellow-600/8 dark:via-orange-600/6 dark:to-red-600/8 blur-3xl" />
      
      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent dark:from-transparent dark:via-black/5 dark:to-transparent" />
      
      {/* Animated grid pattern */}
      <motion.div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        animate={{ 
          backgroundPosition: ["0% 0%", "100% 100%"] 
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.5) 1px, transparent 0)`,
          backgroundSize: "50px 50px"
        }}
      />
    </div>
  )
}
