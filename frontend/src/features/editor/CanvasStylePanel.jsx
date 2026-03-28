import { useState } from 'react'
import {
  Palette,
  Droplets,
  MoreHorizontal,
  X,
  ChevronDown,
  Grip
} from 'lucide-react'
import { DefaultColorStyle, DefaultSizeStyle, DefaultDashStyle, DefaultFillStyle } from 'tldraw'

// Color palette for drawing (using tldraw color names)
const COLORS = [
  { name: 'Black', value: 'black', hex: '#000000' },
  { name: 'Grey', value: 'grey', hex: '#6B7280' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Light Red', value: 'light-red', hex: '#FCA5A5' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Light Green', value: 'light-green', hex: '#86EFAC' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Light Blue', value: 'light-blue', hex: '#93C5FD' },
  { name: 'Violet', value: 'violet', hex: '#A855F7' },
  { name: 'Light Violet', value: 'light-violet', hex: '#C4B5FD' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
]

// Helper function to get hex color from tldraw color name
const getHexFromColor = (colorName) => {
  const color = COLORS.find(c => c.value === colorName)
  return color ? color.hex : '#000000'
}

// Size options
const SIZES = [
  { name: 'Small', value: 's', icon: 'S' },
  { name: 'Medium', value: 'm', icon: 'M' },
  { name: 'Large', value: 'l', icon: 'L' },
  { name: 'Extra Large', value: 'xl', icon: 'XL' },
]

// Dash styles
const DASH_STYLES = [
  { name: 'Solid', value: 'draw', icon: '━' },
  { name: 'Dashed', value: 'dashed', icon: '┅' },
  { name: 'Dotted', value: 'dotted', icon: '┄' },
]

// Fill styles
const FILL_STYLES = [
  { name: 'None', value: 'none' },
  { name: 'Solid', value: 'pattern' },
]

// Opacity levels
const OPACITY_LEVELS = [
  { name: '10%', value: 0.1 },
  { name: '25%', value: 0.25 },
  { name: '50%', value: 0.5 },
  { name: '75%', value: 0.75 },
  { name: '100%', value: 1 },
]

const CanvasStylePanel = ({
  editor,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  selectedDash,
  setSelectedDash,
  selectedFill,
  setSelectedFill,
  selectedOpacity,
  setSelectedOpacity,
  isReadOnly,
  onClose,
  position = { x: 100, y: 100 }
}) => {
  const [activeSection, setActiveSection] = useState('color')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [panelPosition, setPanelPosition] = useState(position)

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y
      })
    }
  }

  // Handle drag move
  const handleDragMove = (e) => {
    if (isDragging) {
      setPanelPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color)
    if (editor) {
      editor.setStyleForNextShapes(DefaultColorStyle, color)
    }
  }

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size)
    if (editor) {
      editor.setStyleForNextShapes(DefaultSizeStyle, size)
    }
  }

  // Handle dash style selection
  const handleDashSelect = (dash) => {
    setSelectedDash(dash)
    if (editor) {
      editor.setStyleForNextShapes(DefaultDashStyle, dash)
    }
  }

  // Handle fill style selection
  const handleFillSelect = (fill) => {
    setSelectedFill(fill)
    if (editor) {
      editor.setStyleForNextShapes(DefaultFillStyle, fill)
      if (fill === 'pattern') {
        editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
      }
    }
  }

  // Handle opacity selection
  const handleOpacitySelect = (opacity) => {
    setSelectedOpacity(opacity)
    if (editor) {
      const selectedShapes = editor.getSelectedShapes()
      if (selectedShapes.length > 0) {
        selectedShapes.forEach(shape => {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: { ...shape.props, opacity: opacity }
          })
        })
      }
    }
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-64"
      style={{ left: panelPosition.x, top: panelPosition.y }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="drag-handle flex items-center gap-2 cursor-move">
          <Grip className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Style</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {['color', 'size', 'fill', 'dash', 'opacity'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeSection === section
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Color Section */}
        {activeSection === 'color' && (
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Stroke Color</div>
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor === color.value
                      ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Section */}
        {activeSection === 'size' && (
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Stroke Width</div>
            <div className="space-y-4">
              {/* Size Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={selectedSize === 's' ? 2 : selectedSize === 'm' ? 4 : selectedSize === 'l' ? 8 : 12}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value <= 3) setSelectedSize('s')
                    else if (value <= 6) setSelectedSize('m')
                    else if (value <= 10) setSelectedSize('l')
                    else setSelectedSize('xl')
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              {/* Size Presets */}
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleSizeSelect(size.value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedSize === size.value
                        ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{
                        width: size.value === 's' ? 4 : size.value === 'm' ? 6 : size.value === 'l' ? 8 : 10,
                        height: size.value === 's' ? 4 : size.value === 'm' ? 6 : size.value === 'l' ? 8 : 10
                      }}
                    />
                    <span className="text-xs">{size.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fill Section */}
        {activeSection === 'fill' && (
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Fill Style</div>
            <div className="space-y-2">
              {FILL_STYLES.map((fill) => (
                <button
                  key={fill.value}
                  onClick={() => handleFillSelect(fill.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedFill === fill.value
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded border-2 border-current flex items-center justify-center">
                    {fill.value === 'pattern' && (
                      <div className="w-4 h-4 rounded bg-current" />
                    )}
                  </div>
                  <span className="text-sm">{fill.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dash Section */}
        {activeSection === 'dash' && (
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Line Style</div>
            <div className="space-y-2">
              {DASH_STYLES.map((dash) => (
                <button
                  key={dash.value}
                  onClick={() => handleDashSelect(dash.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedDash === dash.value
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg w-6 text-center">{dash.icon}</span>
                  <span className="text-sm">{dash.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opacity Section */}
        {activeSection === 'opacity' && (
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Opacity</div>
            <div className="space-y-4">
              {/* Opacity Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(selectedOpacity * 100)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) / 100
                    handleOpacitySelect(value)
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              {/* Opacity Presets */}
              <div className="flex gap-2">
                {OPACITY_LEVELS.map((opacity) => (
                  <button
                    key={opacity.value}
                    onClick={() => handleOpacitySelect(opacity.value)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      selectedOpacity === opacity.value
                        ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded border-2 border-current flex items-center justify-center">
                      <div
                        className="w-4 h-4 rounded bg-current"
                        style={{ opacity: opacity.value }}
                      />
                    </div>
                    <span className="text-xs">{Math.round(opacity.value * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CanvasStylePanel