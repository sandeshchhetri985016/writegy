import { X, Check, AlertCircle, Sparkles, SpellCheck, BookOpen, Palette } from 'lucide-react'
import { useState, useEffect } from 'react'

// Helper to parse bold text **text**
const parseInlineFormatting = (text) => {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Detect suggestion type from explanation text
const detectSuggestionType = (explanation) => {
  if (!explanation) return 'grammar'
  const lower = explanation.toLowerCase()
  
  // Spelling indicators
  if (lower.includes('spelling') || lower.includes('typo') || lower.includes('misspelled') || lower.includes('spell')) {
    return 'spelling'
  }
  
  // Style indicators
  if (lower.includes('style') || lower.includes('clarity') || lower.includes('concise') || lower.includes('tone') || lower.includes('formal')) {
    return 'style'
  }
  
  // Default to grammar
  return 'grammar'
}

// Get styling based on suggestion type
const getSuggestionTypeStyles = (type) => {
  switch (type) {
    case 'spelling':
      return {
        borderColor: 'border-l-error-400 dark:border-l-error-500',
        bgColor: 'bg-error-50/50 dark:bg-error-900/20',
        icon: <SpellCheck className="w-4 h-4 text-error-500 dark:text-error-400" />,
        label: 'Spelling',
        labelColor: 'text-error-600 dark:text-error-400'
      }
    case 'style':
      return {
        borderColor: 'border-l-warning-400 dark:border-l-warning-500',
        bgColor: 'bg-warning-50/50 dark:bg-warning-900/20',
        icon: <Palette className="w-4 h-4 text-warning-500 dark:text-warning-400" />,
        label: 'Style',
        labelColor: 'text-warning-600 dark:text-warning-400'
      }
    case 'grammar':
    default:
      return {
        borderColor: 'border-l-success-500 dark:border-l-success-400',
        bgColor: 'bg-success-50/50 dark:bg-success-900/20',
        icon: <BookOpen className="w-4 h-4 text-success-500 dark:text-success-400" />,
        label: 'Grammar',
        labelColor: 'text-success-600 dark:text-success-400'
      }
  }
}

const SuggestionPanel = ({ suggestions, onClose, onApplySuggestion, onApplyFullCorrection, fullCorrectionApplied, appliedSuggestions = new Set(), onHighlightText, onUnhighlightText }) => {
  const [parsedData, setParsedData] = useState(null)

  useEffect(() => {
    if (!suggestions) return

    try {
      let data = suggestions

      if (typeof suggestions === 'string') {
        const jsonMatch = suggestions.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0])
          } catch (parseError) {
            const start = suggestions.indexOf('{')
            let braceCount = 0
            let end = -1
            
            for (let i = start; i < suggestions.length; i++) {
              if (suggestions[i] === '{') braceCount++
              if (suggestions[i] === '}') braceCount--
              if (braceCount === 0) {
                end = i
                break
              }
            }
            
            if (end !== -1) {
              data = JSON.parse(suggestions.substring(start, end + 1))
            } else {
              throw new Error('No valid JSON object found')
            }
          }
        } else {
          throw new Error('No JSON object found in response')
        }
      }

      setParsedData(data)
    } catch (e) {
      setParsedData({ raw: typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2) })
    }
  }, [suggestions])

  if (!parsedData) return null

  const isStructured = !parsedData.raw && parsedData.suggestions

  const renderFormattedText = (text) => {
    if (!text) return null
    const stringText = typeof text === 'string' ? text : JSON.stringify(text, null, 2)

    return stringText.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={index} className="h-2" />

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h4 key={index} className="font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2 text-sm">
            {trimmed.replace(/\*\*/g, '')}
          </h4>
        )
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start mb-2 ml-1">
            <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400 dark:bg-brand-500" aria-hidden="true" />
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {parseInlineFormatting(trimmed.substring(2))}
            </div>
          </div>
        )
      }

      return (
        <p key={index} className="mb-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {parseInlineFormatting(trimmed)}
        </p>
      )
    })
  }

  return (
    <aside
      className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col max-h-screen shadow-xl dark:shadow-slate-900/50 z-20 animate-slide-in-right"
      role="complementary"
      aria-label="Grammar check suggestions panel"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-brand-50 to-white dark:from-brand-950/50 dark:to-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center font-sans">
          <Sparkles className="w-5 h-5 mr-2 text-brand-500" aria-hidden="true" />
          Suggestions
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          aria-label="Close grammar check panel"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isStructured ? (
          <>
            {/* Individual Suggestions */}
            {parsedData.suggestions && parsedData.suggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">
                    {parsedData.suggestions.length} Improvement{parsedData.suggestions.length !== 1 ? 's' : ''}
                  </h4>
                  {fullCorrectionApplied && (
                    <span className="badge-warning text-xs font-sans">
                      Applied
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {parsedData.suggestions.map((item, idx) => {
                    const suggestionType = detectSuggestionType(item.explanation)
                    const typeStyles = getSuggestionTypeStyles(suggestionType)
                    const isApplied = fullCorrectionApplied || appliedSuggestions.has(item.original)
                    
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border-l-4 ${typeStyles.borderColor} ${typeStyles.bgColor} p-4 shadow-sm transition-all duration-200 font-sans ${
                          isApplied 
                            ? 'opacity-50' 
                            : 'hover:shadow-md'
                        }`}
                        onMouseEnter={() => !isApplied && onHighlightText && onHighlightText(item.original)}
                        onMouseLeave={() => onUnhighlightText && onUnhighlightText()}
                      >
                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          {typeStyles.icon}
                          <span className={`text-xs font-medium ${typeStyles.labelColor}`}>
                            {typeStyles.label}
                          </span>
                        </div>
                        
                        {/* Original → Replacement */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-md line-through decoration-error-400">
                            {item.original}
                          </span>
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-md">
                            {item.replacement}
                          </span>
                        </div>
                        
                        {/* Explanation */}
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                          {item.explanation}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApplySuggestion(item.original, item.replacement)}
                            disabled={isApplied}
                            className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isApplied
                                ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 cursor-not-allowed'
                                : 'btn-primary'
                            }`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {isApplied ? 'Accepted' : 'Accept'}
                          </button>
                          <button
                            onClick={() => {
                              // Mark as ignored (for future enhancement)
                              onUnhighlightText && onUnhighlightText()
                            }}
                            disabled={isApplied}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isApplied
                                ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Fallback for unstructured text */
          <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 font-sans">
            <div className="flex items-center gap-2 text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 p-3 rounded-lg mb-4 text-sm font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Unstructured analysis received</span>
            </div>
            <div className="pl-1">
              {renderFormattedText(parsedData.raw)}
            </div>
          </div>
        )}
      </div>

      {/* Footer with stats if available */}
      {isStructured && parsedData.suggestions && (
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>
              {appliedSuggestions.size} of {parsedData.suggestions.length} accepted
            </span>
            {parsedData.suggestions.length > 0 && !fullCorrectionApplied && (
              <button
                onClick={() => onApplyFullCorrection && onApplyFullCorrection(parsedData.fullCorrection || '')}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
              >
                Accept All
              </button>
            )}
          </div>
        </footer>
      )}
    </aside>
  )
}

export default SuggestionPanel