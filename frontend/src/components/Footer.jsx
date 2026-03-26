import { FileText, Heart } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Writegy</span>
          </div>

          {/* Copyright */}
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <span>&copy; {currentYear} Writegy. Made with</span>
            <Heart className="w-4 h-4 mx-1.5 text-error-500 fill-current" />
            <span>for better writing.</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a
              href="/privacy"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Terms
            </a>
            <a
              href="https://github.com/sandeshchhetri985016/writegy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer