import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FileText, 
  Calendar,
  Eye
} from 'lucide-react'

const DocumentViewer = ({ document, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [documentContent, setDocumentContent] = useState(null)

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentContent()
    }
  }, [isOpen, document])

  const fetchDocumentContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/files/${document._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDocumentContent(data)
      } else {
        setDocumentContent({
          ...document,
          fullText: 'Failed to load document content.',
          metadata: { pages: document.metadata?.pages || 1, wordCount: document.metadata?.wordCount || 0 }
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setDocumentContent({
        ...document,
        fullText: 'Error loading document.',
        metadata: { pages: 1, wordCount: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen || !document) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">{document.originalName}</h2>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {formatFileSize(document.size)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(document.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {documentContent?.metadata?.pages || document.metadata?.pages || 1}
                  </div>
                  <div className="text-sm text-blue-100">Pages</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {documentContent?.metadata?.wordCount || document.metadata?.wordCount || 0}
                  </div>
                  <div className="text-sm text-blue-100">Words</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {documentContent?.stats?.views || document.stats?.views || 0}
                  </div>
                  <div className="text-sm text-blue-100">Views</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Loading document content...</span>
                </div>
              ) : documentContent ? (
                <div className="space-y-6">
                  {/* Document Preview */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Document Preview
                    </h3>
                    <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded border p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                        {documentContent.fullText?.substring(0, 2000) || 'No content available'}
                        {documentContent.fullText?.length > 2000 && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300 text-xs">
                            Content truncated. Total characters: {documentContent.fullText.length}
                          </div>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load document content</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Document ID: {document._id?.slice(-8)}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DocumentViewer
