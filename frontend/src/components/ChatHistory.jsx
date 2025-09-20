import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { 
  MessageCircle, 
  X, 
  Clock, 
  FileText, 
  Trash2, 
  Eye,
  Bot,
  User,
  Search,
  Filter
} from 'lucide-react'

const ChatHistory = ({ isOpen, onClose, onSelectChat }) => {
  const [chatHistories, setChatHistories] = useState([])
  const [filteredChats, setFilteredChats] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [pagination, setPagination] = useState({})
  
  const historyRef = useRef()

  useEffect(() => {
    if (isOpen) {
      fetchChatHistories()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && historyRef.current && chatHistories.length > 0) {
      gsap.fromTo(historyRef.current.children, 
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [isOpen, chatHistories])

  useEffect(() => {
    filterChats()
  }, [chatHistories, searchTerm, filterBy])

  const fetchChatHistories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat-history?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setChatHistories(data.chatHistories || [])
      setPagination(data.pagination || {})
    } catch (error) {
      console.error('Error fetching chat histories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterChats = () => {
    let filtered = chatHistories

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(chat => {
        const title = typeof chat.title === 'string' ? chat.title.toLowerCase() : '';
        const docName = typeof chat.documentId?.originalName === 'string' ? chat.documentId.originalName.toLowerCase() : '';
        return title.includes(q) || docName.includes(q);
      });
    }

    // Time filter
    const now = new Date()
    if (filterBy === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filtered = filtered.filter(chat => new Date(chat.updatedAt) >= today)
    } else if (filterBy === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(chat => new Date(chat.updatedAt) >= weekAgo)
    } else if (filterBy === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(chat => new Date(chat.updatedAt) >= monthAgo)
    }

    setFilteredChats(filtered)
  }

  const deleteChatHistory = async (chatId) => {
    try {
      const response = await fetch(`/api/chat-history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setChatHistories(prev => prev.filter(chat => chat._id !== chatId))
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const loadChat = async (chatId) => {
    try {
      const response = await fetch(`/api/chat-history/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const chatData = await response.json()
      onSelectChat(chatData)
      onClose()
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const formatTokens = (tokens) => {
    if (tokens < 1000) return `${tokens} tokens`
    return `${(tokens / 1000).toFixed(1)}k tokens`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <h2 className="text-xl font-bold">Chat History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div className="relative">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="appearance-none bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 pr-8"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading chat history...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterBy !== 'all' ? 'No chats match your search' : 'No chat history yet'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {searchTerm || filterBy !== 'all' ? 'Try adjusting your search or filter' : 'Start a conversation with your documents to see history here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3" ref={historyRef}>
                {filteredChats.map((chat, index) => (
                  <div
                    key={chat._id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-700"
                    onClick={() => loadChat(chat._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">
                          {typeof chat.title === 'object' && chat.title !== null 
                            ? (chat.title.text || chat.title.content || JSON.stringify(chat.title))
                            : chat.title
                          }
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{chat.documentId?.originalName || 'Unknown Document'}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChatHistory(chat._id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{chat.messageCount || 0} messages</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatTokens(chat.totalTokens)}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(chat.lastMessageAt || chat.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Preview of last message */}
                    {chat.summary && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {typeof chat.summary === 'object' && chat.summary !== null 
                            ? (chat.summary.text || chat.summary.content || JSON.stringify(chat.summary))
                            : chat.summary
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredChats.length} of {pagination.count || 0} conversations
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ChatHistory
