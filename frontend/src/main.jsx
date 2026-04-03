import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Suppress findDOMNode warning from react-quill
const originalConsoleError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode is deprecated')) {
    return
  }
  originalConsoleError.apply(console, args)
}

// Create a client with a default stale time of 5 minutes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Prevents unnecessary fetches when switching tabs
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)