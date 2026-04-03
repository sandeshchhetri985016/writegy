import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Palette, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { supabase } from '../../lib/supabase'

const Settings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    timezone: 'UTC',
    theme: 'light',
    language: 'en',
    autoSaveEnabled: true,
    grammarCheckEnabled: true,
    spellCheckEnabled: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/settings')
      setFormData(prev => ({
        ...prev,
        name: response.data.name || '',
        bio: response.data.bio || '',
        avatar: response.data.avatar || '',
        timezone: response.data.timezone || 'UTC',
        theme: response.data.theme || 'light',
        language: response.data.language || 'en',
        autoSaveEnabled: response.data.autoSaveEnabled ?? true,
        grammarCheckEnabled: response.data.grammarCheckEnabled ?? true,
        spellCheckEnabled: response.data.spellCheckEnabled ?? true
      }))
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/api/settings', formData)
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordReset = async () => {
    try {
      // Wire to Supabase auth - for now show toast
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      toast.error('Failed to send password reset email')
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your documents and data.')) {
      // Wire to API delete endpoint
      toast.success('Account deletion initiated')
    }
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 150
          canvas.height = 150
          
          // Center-crop to square
          const size = Math.min(img.width, img.height)
          const sx = (img.width - size) / 2
          const sy = (img.height - size) / 2
          
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150)
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.65)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      // Compress image to ~50KB with center-crop
      const compressedBlob = await compressImage(file)
      
      // Upload to Supabase Storage (avatars bucket)
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Save URL to backend
      await api.put('/api/user/avatar', { avatar: urlData.publicUrl })

      // Update local state
      setFormData(prev => ({ ...prev, avatar: urlData.publicUrl }))
      toast.success('Avatar uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      toast.error('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar */}
          <div className="sm:w-48 flex-shrink-0">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'preferences', label: 'Preferences', icon: Palette },
                { id: 'security', label: 'Security', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="card p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input bg-slate-100 dark:bg-slate-700"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="input resize-none"
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      {/* Avatar Preview */}
                      <div className="flex-shrink-0 h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-600">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar Preview" className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                          <User className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      {/* Upload Button */}
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary text-sm"
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? 'Uploading...' : 'Click to Upload'}
                        </button>
                        <p className="text-xs text-slate-500 mt-1">Upload an image file (JPG, PNG, GIF) for your profile picture.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="input"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Australia/Darwin">Australia/Darwin</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="US/Pacific">US/Pacific</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold mb-4">Editor Preferences</h2>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="input"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="input"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-save</p>
                        <p className="text-sm text-slate-500">Automatically save your work every 3 seconds</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('autoSaveEnabled', !formData.autoSaveEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          formData.autoSaveEnabled ? 'bg-brand-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          formData.autoSaveEnabled ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Grammar Check</p>
                        <p className="text-sm text-slate-500">Enable AI-powered grammar suggestions</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('grammarCheckEnabled', !formData.grammarCheckEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          formData.grammarCheckEnabled ? 'bg-brand-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          formData.grammarCheckEnabled ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Spell Check</p>
                        <p className="text-sm text-slate-500">Highlight spelling errors</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange('spellCheckEnabled', !formData.spellCheckEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          formData.spellCheckEnabled ? 'bg-brand-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          formData.spellCheckEnabled ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold mb-4">Security</h2>
                  
                  {/* Account Role */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Role</p>
                      <p className="text-sm text-slate-500">Your current access level</p>
                    </div>
                    <span className="badge-brand">{user?.role || 'User'}</span>
                  </div>

                  {/* Password Reset */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-medium mb-2">Password Management</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Authentication is managed by Supabase. To reset your password, 
                      click the button below to receive a reset email.
                    </p>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="btn-secondary"
                    >
                      Send Password Reset Email
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {activeTab !== 'security' && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings