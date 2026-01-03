import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import UserDashboard from './features/dashboard/UserDashboard'
import TextEditor from './features/editor/TextEditor'

// Layout Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Styles
import './index.css'

// Protected Route Wrapper
const ProtectedRouteWrapper = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
)

// App Routes Component
const AppRoutes = () => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      <header role="banner">
        <Navbar />
      </header>

      <main
        id="main-content"
        className="container mx-auto px-4 py-8"
        role="main"
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRouteWrapper>
                <UserDashboard />
              </ProtectedRouteWrapper>
            }
          />

          <Route
            path="/editor/:id?"
            element={
              <ProtectedRouteWrapper>
                <TextEditor />
              </ProtectedRouteWrapper>
            }
          />

          {/* Redirect root to dashboard for authenticated users */}
          <Route
            path="/"
            element={
              <ProtectedRouteWrapper>
                <Navigate to="/dashboard" replace />
              </ProtectedRouteWrapper>
            }
          />

          {/* Catch all - redirect to dashboard */}
          <Route
            path="*"
            element={
              <ProtectedRouteWrapper>
                <Navigate to="/dashboard" replace />
              </ProtectedRouteWrapper>
            }
          />
        </Routes>
      </main>

      <footer role="contentinfo">
        <Footer />
      </footer>
    </div>
  )
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: 'colored',
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 5000,
              theme: 'colored',
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  )
}

export default App
