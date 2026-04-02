import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Palette, Bell, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const Settings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
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
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Authentication is managed by Supabase. To manage your password, 
                      visit your Supabase account settings.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Role</p>
                      <p className="text-sm text-slate-500">Your current access level</p>
                    </div>
                    <span className="badge-brand">{user?.role || 'User'}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings