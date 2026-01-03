import { X, Check, RefreshCw, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

// Helper to parse bold text **text**
const parseInlineFormatting = (text) => {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

const SuggestionPanel = ({ suggestions, onClose, onApplySuggestion, onApplyFullCorrection, fullCorrectionApplied, appliedSuggestions = new Set(), onHighlightText, onUnhighlightText }) => {
  const [parsedData, setParsedData] = useState(null)

  useEffect(() => {
    if (!suggestions) return

    try {
      let data = suggestions

      if (typeof suggestions === 'string') {
        // Find the first '{' and the last '}' to extract JSON object
        const start = suggestions.indexOf('{')
        const end = suggestions.lastIndexOf('}')

        if (start !== -1 && end !== -1 && end > start) {
          const jsonString = suggestions.substring(start, end + 1)
          data = JSON.parse(jsonString)
        } else {
          throw new Error('No JSON object found in response')
        }
      }

      setParsedData(data)
    } catch (e) {
      // Fallback for plain text response
      setParsedData({ raw: typeof suggestions === 'string' ? suggestions : JSON.stringify(suggestions, null, 2) })
    }
  }, [suggestions])

  if (!parsedData) return null

  const isStructured = !parsedData.raw && (parsedData.suggestions || parsedData.corrected)

  const renderFormattedText = (text) => {
    if (!text) return null
    const stringText = typeof text === 'string' ? text : JSON.stringify(text, null, 2)

    return stringText.split('\n').map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={index} className="h-2" />

      // Headers/Bold lines
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h4 key={index} className="font-bold text-gray-900 mt-4 mb-2 text-sm">
            {trimmed.replace(/\*\*/g, '')}
          </h4>
        )
      }

      // List items
      if (trimmed.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start mb-2 ml-2">
            <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
            <div className="text-sm text-gray-700 leading-relaxed">
              {parseInlineFormatting(trimmed.substring(2))}
            </div>
          </div>
        )
      }

      // Regular text
      return (
        <p key={index} className="mb-2 text-sm text-gray-700 leading-relaxed">
          {parseInlineFormatting(trimmed)}
        </p>
      )
    })
  }

  return (
    <aside
      className="w-80 bg-white border-l border-gray-200 flex flex-col max-h-screen shadow-xl z-20"
      role="complementary"
      aria-label="Grammar check suggestions panel"
    >
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2" aria-hidden="true">✨</span> Grammar Check
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          aria-label="Close grammar check panel"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isStructured ? (
          <>
            {/* Full Document Correction */}
            {parsedData.corrected && (
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Corrected Version</h4>
                <button
                  onClick={() => onApplyFullCorrection(parsedData.corrected)}
                  className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label="Replace entire document text with the corrected version"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Replace Entire Text
                </button>
              </div>
            )}

            {/* Individual Suggestions */}
            {parsedData.suggestions && parsedData.suggestions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Improvements</h4>
                  {fullCorrectionApplied && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Full correction applied
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {parsedData.suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm transition-shadow ${fullCorrectionApplied ? 'opacity-60' : 'hover:shadow-md'}`}
                      onMouseEnter={() => onHighlightText && onHighlightText(item.original)}
                      onMouseLeave={() => onUnhighlightText && onUnhighlightText()}
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded line-through decoration-red-400">
                          {item.original}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                          {item.replacement}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.explanation}</p>
                      <button
                        onClick={() => onApplySuggestion(item.original, item.replacement)}
                        disabled={fullCorrectionApplied || appliedSuggestions.has(item.original)}
                        className={`w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded transition-colors border ${
                          fullCorrectionApplied || appliedSuggestions.has(item.original)
                            ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        }`}
                      >
                        <Check className="w-3 h-3 mr-1.5" />
                        {fullCorrectionApplied || appliedSuggestions.has(item.original) ? 'Already Applied' : 'Apply Fix'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Fallback for unstructured text */
          <div className="prose prose-sm max-w-none text-gray-700">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md mb-4 text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Unstructured analysis received</span>
            </div>
            <div className="pl-1">
              {renderFormattedText(parsedData.raw)}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default SuggestionPanel
