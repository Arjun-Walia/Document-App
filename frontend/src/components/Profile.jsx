import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { 
  User, 
  Camera, 
  Edit3, 
  Palette, 
  BarChart3, 
  FileText, 
  MessageCircle,
  Calendar,
  TrendingUp,
  Settings,
  X,
  Save,
  Eye,
  Sparkles,
  Clock,
  Target,
  LogOut
} from 'lucide-react'

const Profile = ({ isOpen, onClose, user, onLogout }) => {
  const [profileData, setProfileData] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  
  const fileInputRef = useRef()
  const profileRef = useRef()

  useEffect(() => {
    if (isOpen) {
      fetchProfileData()
      fetchAnalytics()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && profileRef.current) {
      gsap.fromTo(profileRef.current.children, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [isOpen, profileData])

  const fetchProfileData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setProfileData(data)
      setEditData({
        displayName: data.profile?.displayName || '',
        bio: data.profile?.bio || '',
        theme: data.profile?.theme || 'auto',
        chatStyle: data.profile?.preferences?.chatStyle || 'professional'
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/profile/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveProfile = async () => {
    setIsLoading(true)
    try {
      // Save avatar if changed
      if (avatarPreview) {
        await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ avatar: avatarPreview })
        })
      }

      // Save profile data
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: {
            displayName: editData.displayName,
            bio: editData.bio,
            theme: editData.theme,
            preferences: {
              chatStyle: editData.chatStyle
            }
          }
        })
      })

      if (response.ok) {
        await fetchProfileData()
        setEditMode(false)
        setAvatarPreview(null)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-blue-600/80"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Profile & Analytics</h2>
                <div className="flex items-center gap-2">
                  {onLogout && (
                    <button
                      onClick={() => {
                        onLogout()
                        onClose()
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Profile Header */}
              {profileData && (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-2xl font-bold overflow-hidden">
                      {avatarPreview || profileData.profile?.avatar ? (
                        <img 
                          src={avatarPreview || profileData.profile.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(profileData.profile?.displayName || profileData.name)
                      )}
                    </div>
                    {editMode && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-2 bg-white text-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {editMode ? (
                        <input
                          value={editData.displayName}
                          onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                          className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white placeholder-white/60"
                          placeholder="Display Name"
                        />
                      ) : (
                        <h3 className="text-xl font-bold">{profileData.profile?.displayName || profileData.name}</h3>
                      )}
                      {!editMode && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-white/80 text-sm">{profileData.email}</p>
                    {editMode ? (
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        className="w-full mt-2 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 text-sm resize-none"
                        placeholder="Tell us about yourself (160 characters max)"
                        maxLength={160}
                        rows={2}
                      />
                    ) : (
                      <p className="text-white/90 text-sm mt-1">
                        {profileData.profile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {editMode && (
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={saveProfile}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setAvatarPreview(null)
                    }}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile Settings', icon: Settings },
                { id: 'stats', label: 'Statistics', icon: BarChart3 },
                { id: 'activity', label: 'Recent Activity', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-purple-600 text-purple-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto" ref={profileRef}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            ) : (
              <>
                {/* Profile Settings Tab */}
                {activeTab === 'profile' && profileData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                          <Palette className="w-4 h-4 mr-2" />
                          Theme Preference
                        </h4>
                        <div className="space-y-2">
                          {['light', 'dark', 'auto'].map(theme => (
                            <label key={theme} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="theme"
                                value={theme}
                                checked={editData.theme === theme}
                                onChange={(e) => setEditData({...editData, theme: e.target.value})}
                                className="text-purple-600"
                              />
                              <span className="text-sm capitalize">{theme} Theme</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat Style
                        </h4>
                        <div className="space-y-2">
                          {['casual', 'professional', 'technical'].map(style => (
                            <label key={style} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="chatStyle"
                                value={style}
                                checked={editData.chatStyle === style}
                                onChange={(e) => setEditData({...editData, chatStyle: e.target.value})}
                                className="text-purple-600"
                              />
                              <span className="text-sm capitalize">{style}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    {analytics ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between mb-3">
                              <FileText className="w-8 h-8 text-blue-600" />
                              <span className="text-2xl font-bold text-blue-600">{analytics.overview?.totalDocuments || 0}</span>
                            </div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Documents</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analytics.overview?.totalViews || 0} total views
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-3">
                              <MessageCircle className="w-8 h-8 text-green-600" />
                              <span className="text-2xl font-bold text-green-600">{analytics.overview?.totalChats || 0}</span>
                            </div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Chats</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analytics.activity?.chatsThisMonth || 0} this month
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-between mb-3">
                              <Sparkles className="w-8 h-8 text-purple-600" />
                              <span className="text-2xl font-bold text-purple-600">{analytics.overview?.totalTokens || 0}</span>
                            </div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">Tokens</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">AI tokens used</p>
                          </div>
                        </div>

                        {/* Storage Usage */}
                        {analytics.overview?.storageUsed && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Storage Usage
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex justify-between mb-2">
                                <span>Total Size:</span>
                                <span className="font-medium">
                                  {(analytics.overview.storageUsed / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Average per Document:</span>
                                <span className="font-medium">
                                  {analytics.overview.totalDocuments > 0 
                                    ? ((analytics.overview.storageUsed / analytics.overview.totalDocuments) / 1024 / 1024).toFixed(2) + ' MB'
                                    : '0 MB'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 rounded-full flex items-center justify-center mb-4">
                          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">No Analytics Data</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload documents and start chatting to see your statistics
                        </p>
                      </div>
                    )}

                    {/* Account Information */}
                    {profileData && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Account Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                            <span className="font-medium">{formatDate(profileData.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Last Active:</span>
                            <span className="font-medium">{formatDate(profileData.updatedAt || new Date())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    {analytics && (analytics.documents?.recent?.length > 0 || analytics.documents?.mostViewed?.length > 0) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Documents */}
                        {analytics.documents.recent && analytics.documents.recent.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Recent Documents
                            </h4>
                            <div className="space-y-3">
                              {analytics.documents.recent.map((doc, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm truncate">{doc.name}</span>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Eye className="w-3 h-3 mr-1" />
                                      {doc.views || 0}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDate(doc.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Most Viewed Documents */}
                        {analytics.documents.mostViewed && analytics.documents.mostViewed.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Most Viewed
                            </h4>
                            <div className="space-y-3">
                              {analytics.documents.mostViewed.map((doc, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm truncate">{doc.name}</span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center font-medium">
                                      <Eye className="w-3 h-3 mr-1" />
                                      {doc.views}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {((doc.size || 0) / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Activity Chart Placeholder */}
                        {analytics.activity?.dailyActivity && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Weekly Activity
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                              <div className="grid grid-cols-7 gap-2">
                                {analytics.activity.dailyActivity.map((day, index) => (
                                  <div key={index} className="text-center">
                                    <div className="text-xs text-gray-500 mb-1">
                                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 rounded p-2">
                                      <div className="text-sm font-medium text-blue-600">
                                        {day.documents + day.chats}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {day.documents}d {day.chats}c
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">No Recent Activity</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload documents and start conversations to see your activity here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Settings className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Settings</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Settings panel coming soon. Use the profile section to edit your information.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
  )
}

export default Profile
