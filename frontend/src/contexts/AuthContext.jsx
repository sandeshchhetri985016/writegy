import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }

        if (session) {
          setUser(session.user)
          // Store the JWT token in localStorage for API requests
          if (session.access_token) {
            localStorage.setItem('supabase_token', session.access_token)
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          // Store the JWT token in localStorage for API requests
          if (session.access_token) {
            localStorage.setItem('supabase_token', session.access_token)
          }
        } else {
          setUser(null)
          // Clear the token from localStorage
          localStorage.removeItem('supabase_token')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data?.user) {
        setUser(data.user)
        toast.success('Welcome back!')
      }

      return { data, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      if (data?.user) {
        setUser(data.user)
        toast.success('Account created! Please check your email to verify your account.')
      }

      return { data, error: null }
    } catch (error) {
      console.error('Registration error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmail = async (email) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      toast.success('Magic link sent to your email!')
      return { data, error: null }
    } catch (error) {
      console.error('Magic link error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      toast.success('Password reset link sent to your email!')
      return { data, error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      toast.success('Password updated successfully!')
      return { data, error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signInWithEmail,
    signUp,
    signOut,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
