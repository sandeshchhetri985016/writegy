import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Custom components for markdown rendering
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneLight}
        language={match[1]}
        PreTag="div"
        className="rounded-md text-sm"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    )
  },
  h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-bold mb-2 mt-3 text-gray-900">{children}</h4>,
  h5: ({ children }) => <h5 className="text-base font-bold mb-1 mt-3 text-gray-900">{children}</h5>,
  h6: ({ children }) => <h6 className="text-sm font-bold mb-1 mt-3 text-gray-900">{children}</h6>,
  p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc text-gray-700">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal text-gray-700">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
  hr: () => <hr className="border-gray-300 my-6" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

const MarkdownEditor = ({
  value,
  onChange,
  placeholder = "Start writing in Markdown...",
  className = "",
  disabled = false
}) => {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            insertMarkdown('**', '**', 'bold text')
            break
          case 'i':
            e.preventDefault()
            insertMarkdown('*', '*', 'italic text')
            break
          case 'k':
            e.preventDefault()
            insertMarkdown('[', '](url)', 'link text')
            break
          case '`':
            e.preventDefault()
            insertMarkdown('`', '`', 'code')
            break
          default:
            break
        }
      }
    }

    if (!disabled && textareaRef.current) {
      textareaRef.current.addEventListener('keydown', handleKeyDown)
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('keydown', handleKeyDown)
        }
      }
    }
  }, [disabled])

  const insertMarkdown = (before, after, placeholder) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = selectedText || placeholder

    const newValue = value.substring(0, start) + before + replacement + after + value.substring(end)
    onChange(newValue)

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText ? selectedText.length : placeholder.length)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const insertHeading = (level) => {
    const hashes = '#'.repeat(level) + ' '
    insertMarkdown(hashes, '', `Heading ${level}`)
  }

  const insertList = (ordered = false) => {
    const prefix = ordered ? '1. ' : '- '
    insertMarkdown(prefix, '', 'List item')
  }

  const insertLink = () => {
    insertMarkdown('[', '](url)', 'link text')
  }

  const insertImage = () => {
    insertMarkdown('![', '](image-url)', 'alt text')
  }

  const insertCodeBlock = () => {
    insertMarkdown('```\n', '\n```', 'code here')
  }

  const insertTable = () => {
    const table = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`
    insertMarkdown('', '', table)
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-1">
          {/* Formatting buttons */}
          <button
            onClick={() => insertHeading(1)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 1 (Ctrl+1)"
            disabled={disabled}
          >
            H1
          </button>
          <button
            onClick={() => insertHeading(2)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 2 (Ctrl+2)"
            disabled={disabled}
          >
            H2
          </button>
          <button
            onClick={() => insertHeading(3)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm font-bold"
            title="Heading 3 (Ctrl+3)"
            disabled={disabled}
          >
            H3
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => insertMarkdown('**', '**', 'bold text')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded font-bold"
            title="Bold (Ctrl+B)"
            disabled={disabled}
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*', '*', 'italic text')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded italic"
            title="Italic (Ctrl+I)"
            disabled={disabled}
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('`', '`', 'code')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded font-mono text-sm"
            title="Inline Code (Ctrl+`)"
            disabled={disabled}
          >
            {'</>'}
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => insertList(false)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Bullet List"
            disabled={disabled}
          >
            •
          </button>
          <button
            onClick={() => insertList(true)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Numbered List"
            disabled={disabled}
          >
            1.
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={insertLink}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Link (Ctrl+K)"
            disabled={disabled}
          >
            🔗
          </button>
          <button
            onClick={insertImage}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Image"
            disabled={disabled}
          >
            🖼️
          </button>
          <button
            onClick={insertCodeBlock}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Code Block"
            disabled={disabled}
          >
            📄
          </button>
          <button
            onClick={insertTable}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
            title="Table"
            disabled={disabled}
          >
            📊
          </button>
        </div>

        {/* Preview toggle */}
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isPreview
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={disabled}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor/Preview area */}
      <div className="min-h-[400px]">
        {isPreview ? (
          <div className="p-6 prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {value || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-full min-h-[400px] p-6 font-mono text-sm leading-relaxed resize-none border-none outline-none bg-transparent"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
