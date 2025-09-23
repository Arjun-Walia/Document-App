import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Calendar,
  Eye,
  Download
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

  const isPDF = document?.mimeType === 'application/pdf' || document?.filename?.toLowerCase().endsWith('.pdf')
  const totalPages = documentContent?.metadata?.pages || document?.metadata?.pages || 1

  const handleDownload = () => {
    if (document?.filename) {
      const downloadUrl = `/uploads/${document.filename}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = document.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    // Only add event listener if document is available (client-side)
    if (typeof document !== 'undefined' && document) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !document) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 truncate">{document.originalName}</h2>
                  <div className="flex items-center space-x-3 text-blue-100 text-sm">
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {formatFileSize(document.size)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(document.createdAt)}
                    </span>
                    {isPDF && (
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        PDF Document
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading document...</span>
                  </div>
                </div>
              ) : documentContent ? (
                <div className="h-full flex flex-col">
                  {isPDF ? (
                    /* PDF Viewer */
                    <div className="flex-1 relative bg-gray-100 dark:bg-gray-800">
                      <object
                        data={`/uploads/${document.filename}`}
                        type="application/pdf"
                        className="w-full h-full border-0"
                        title={document.originalName}
                      >
                        <embed
                          src={`/uploads/${document.filename}`}
                          type="application/pdf"
                          className="w-full h-full border-0"
                          title={document.originalName}
                        />
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <FileText className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Unable to display PDF in browser.
                          </p>
                          <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Download PDF
                          </button>
                        </div>
                      </object>
                      {/* Simple Page Info */}
                      {totalPages > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                          {totalPages} pages total
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Text Document Viewer */
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-6">
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6">
                          <h3 className="font-semibold text-lg mb-4 flex items-center text-gray-900 dark:text-gray-100">
                            <FileText className="w-5 h-5 mr-2" />
                            Document Content
                          </h3>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-4 rounded border overflow-x-auto">
                              {documentContent.fullText || 'No content available'}
                            </pre>
                          </div>
                          {documentContent.fullText?.length > 5000 && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300 text-xs">
                              Content truncated for display. Total characters: {documentContent.fullText.length}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <p className="text-gray-600 dark:text-gray-400">Failed to load document content</p>
                    <button
                      onClick={fetchDocumentContent}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-500">
                Document ID: {document._id?.slice(-8)}
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-xs text-gray-500">
                  {documentContent?.metadata?.wordCount || document.metadata?.wordCount || 0} words
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DocumentViewer
