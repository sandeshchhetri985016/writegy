import { useState } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

const CanvasSearch = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  currentResultIndex,
  onSearch,
  onNextResult,
  onPrevResult
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(localQuery)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevResult()
      } else {
        onNextResult()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-80 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Search in Canvas
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search text in shapes..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </form>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentResultIndex + 1} of {searchResults.length} results
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onPrevResult}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                title="Previous (Shift+Enter)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={onNextResult}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                title="Next (Enter)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => {
                  // Navigate to this specific result by calling onNextResult until we reach this index
                  // This will trigger the parent to select and zoom to the shape
                  const stepsToTarget = index - currentResultIndex
                  if (stepsToTarget > 0) {
                    for (let i = 0; i < stepsToTarget; i++) {
                      onNextResult()
                    }
                  } else if (stepsToTarget < 0) {
                    for (let i = 0; i < Math.abs(stepsToTarget); i++) {
                      onPrevResult()
                    }
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  index === currentResultIndex
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="truncate">
                  {result.type === 'text' ? result.props.text : (result.props?.text || `${result.type} shape`)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="px-3 pb-3">
          <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
            No results found
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="px-3 pb-3 border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <div>• Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Enter</kbd> to find next</div>
          <div>• Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Shift+Enter</kbd> to find previous</div>
          <div>• Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Esc</kbd> to close</div>
        </div>
      </div>
    </div>
  )
}

export default CanvasSearch