import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FileText, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/LoadingSpinner'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast.error(error.message || 'Login failed')
        return
      }

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center group-hover:bg-brand-700 transition-colors">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">Writegy</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your account to continue writing
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Links */}
            <div className="text-center">
              <div className="text-sm">
                <Link
                  to="/register"
                  className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Demo Notice */}
        <div className="card p-4 border-l-4 border-l-brand-500 bg-brand-50/50 dark:bg-brand-950/20">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-4 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Demo Account
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                For testing: Use any email format with a password of at least 6 characters.
                The backend will create the account automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login