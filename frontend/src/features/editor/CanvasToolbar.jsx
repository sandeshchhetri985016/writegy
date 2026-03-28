import { useState } from 'react'
import {
  MousePointer,
  Pen,
  Eraser,
  Lasso,
  Circle,
  Square,
  ArrowRight,
  Minus,
  StickyNote,
  Lock,
  Unlock,
  Diamond,
  Star,
  Type,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Palette,
  Droplets,
  Eye,
  ImagePlus,
  Search,
  Download,
  Hand
} from 'lucide-react'
import { DefaultColorStyle, DefaultSizeStyle, DefaultDashStyle, DefaultFillStyle, GeoShapeGeoStyle } from 'tldraw'

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

// Shape tools with their tldraw tool IDs
const SHAPES = [
  { name: 'Rectangle', value: 'rectangle', icon: Square, toolId: 'geo' },
  { name: 'Ellipse', value: 'ellipse', icon: Circle, toolId: 'geo' },
  { name: 'Diamond', value: 'diamond', icon: Diamond, toolId: 'geo' },
  { name: 'Arrow', value: 'arrow', icon: ArrowRight, toolId: 'arrow' },
  { name: 'Line', value: 'line', icon: Minus, toolId: 'line' },
  { name: 'Star', value: 'star', icon: Star, toolId: 'geo' },
  { name: 'Text', value: 'text', icon: Type, toolId: 'text' },
]

// Dash styles
const DASH_STYLES = [
  { name: 'Solid', value: 'draw', icon: '━' },
  { name: 'Dashed', value: 'dashed', icon: '┅' },
  { name: 'Dotted', value: 'dotted', icon: '┄' },
]

// Fill styles (tldraw v2 valid values)
// 'none' = no fill, 'pattern' = solid fill
// In tldraw v2, fill='pattern' with dash='solid' creates a solid color fill
// Semi-transparent is achieved by setting fill='pattern', dash='solid' AND opacity < 1
const FILL_STYLES = [
  { name: 'None', value: 'none' },
  { name: 'Solid', value: 'pattern' },
]

// Opacity levels (for slider)
const OPACITY_MIN = 0
const OPACITY_MAX = 100
const OPACITY_STEP = 5

const CanvasToolbar = ({
  editor,
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  isReadOnly,
  setIsReadOnly,
  onImageUpload,
  onSearch,
  onExport
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const [showDashMenu, setShowDashMenu] = useState(false)
  const [showOpacityMenu, setShowOpacityMenu] = useState(false)
  const [showFillMenu, setShowFillMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [selectedDash, setSelectedDash] = useState('draw')
  const [selectedFill, setSelectedFill] = useState('none')
  const [selectedOpacity, setSelectedOpacity] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Handle tool selection
  const handleToolSelect = (tool) => {
    if (!editor || isReadOnly) return

    setActiveTool(tool)

    // Map tool names to tldraw tool IDs
    const toolMap = {
      'select': 'select',
      'draw': 'draw',
      'eraser': 'eraser',
      'lasso': 'select', // Lasso uses select tool
      'hand': 'hand', // Hand/pan tool
    }

    const tldrawTool = toolMap[tool] || 'select'
    editor.setCurrentTool(tldrawTool)

    // Apply current style using proper style objects
    editor.setStyleForNextShapes(DefaultColorStyle, selectedColor)
    editor.setStyleForNextShapes(DefaultSizeStyle, selectedSize)
  }

  // Handle shape selection
  const handleShapeSelect = (shapeType) => {
    if (!editor || isReadOnly) return

    const shape = SHAPES.find(s => s.value === shapeType)
    if (!shape) return

    setActiveTool('shape')
    
    // Use the correct tldraw tool for each shape type
    editor.setCurrentTool(shape.toolId)
    
    // For geo shapes, set the specific geo shape type
    if (shape.toolId === 'geo') {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, shapeType)
    }
    
    // Apply current style
    editor.setStyleForNextShapes(DefaultColorStyle, selectedColor)
    editor.setStyleForNextShapes(DefaultSizeStyle, selectedSize)
    setShowShapeMenu(false)
  }

  // Handle color selection
  const handleColorSelect = (color) => {
    console.log('Color selected:', color)
    setSelectedColor(color)
    if (editor) {
      console.log('Editor exists, selected shapes:', editor.getSelectedShapes())
      try {
        // Apply to currently selected shapes using tldraw v2 API
        const selectedShapes = editor.getSelectedShapes()
        if (selectedShapes.length > 0) {
          selectedShapes.forEach(shape => {
            console.log('Updating shape:', shape.id, shape.type, 'with color:', color)
            try {
              // Use proper tldraw v2 update method
              editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { color: color }
              })
              console.log('Successfully updated shape color')
            } catch (error) {
              console.error('Error updating shape color:', error)
            }
          })
        } else {
          console.log('No shapes selected, setting style for next shapes')
        }
        // Also set for next shapes
        editor.setStyleForNextShapes(DefaultColorStyle, color)
        console.log('Set style for next shapes')
      } catch (error) {
        console.error('Error in handleColorSelect:', error)
      }
    } else {
      console.log('No editor instance')
    }
    setShowColorPicker(false)
  }

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size)
    if (editor) {
      // Apply to currently selected shapes
      const selectedShapes = editor.getSelectedShapes()
      if (selectedShapes.length > 0) {
        selectedShapes.forEach(shape => {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: { ...shape.props, size }
          })
        })
      }
      // Also set for next shapes
      editor.setStyleForNextShapes(DefaultSizeStyle, size)
    }
  }

  // Toggle read-only mode
  const toggleReadOnly = () => {
    const newReadOnly = !isReadOnly
    setIsReadOnly(newReadOnly)
    if (editor) {
      editor.updateInstanceState({ isReadonly: newReadOnly })
    }
  }

  // Handle sticky note
  const handleStickyNote = () => {
    if (!editor || isReadOnly) return

    setActiveTool('note')
    editor.setCurrentTool('note')
    editor.setStyleForNextShapes(DefaultColorStyle, selectedColor)
  }

  // Handle dash style selection
  const handleDashSelect = (dash) => {
    setSelectedDash(dash)
    if (editor) {
      // Apply to currently selected shapes
      const selectedShapes = editor.getSelectedShapes()
      if (selectedShapes.length > 0) {
        selectedShapes.forEach(shape => {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: { ...shape.props, dash }
          })
        })
      }
      // Also set for next shapes
      editor.setStyleForNextShapes(DefaultDashStyle, dash)
    }
    setShowDashMenu(false)
  }

  // Handle fill style selection
  const handleFillSelect = (fill) => {
    setSelectedFill(fill)
    if (editor) {
      // Apply to currently selected shapes
      const selectedShapes = editor.getSelectedShapes()
      if (selectedShapes.length > 0) {
        selectedShapes.forEach(shape => {
          // Update the shape's fill style
          // When selecting 'pattern' (solid fill), also set dash to 'solid' for solid color fill
          const dashValue = fill === 'pattern' ? 'solid' : shape.props.dash
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            props: { ...shape.props, fill: fill, dash: dashValue }
          })
        })
      }
      // Also set for next shapes
      editor.setStyleForNextShapes(DefaultFillStyle, fill)
      // Set dash to solid for solid fills
      if (fill === 'pattern') {
        editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
      }
    }
  }

  // Handle opacity selection
  const handleOpacitySelect = (opacity) => {
    console.log('Opacity selected:', opacity)
    setSelectedOpacity(opacity)
    if (editor) {
      console.log('Editor exists, selected shapes:', editor.getSelectedShapes())
      try {
        // Apply to currently selected shapes (only shapes that support opacity)
        const selectedShapes = editor.getSelectedShapes()
        if (selectedShapes.length > 0) {
          selectedShapes.forEach(shape => {
          // Only apply opacity to shapes that support it (not draw/freehand or text)
          const supportsOpacity = ['geo', 'note', 'image', 'arrow', 'line', 'highlight'].includes(shape.type)
            console.log('Shape:', shape.id, shape.type, 'supports opacity:', supportsOpacity)
            if (supportsOpacity) {
              console.log('Updating shape opacity:', shape.id, 'to:', opacity)
              try {
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  props: { opacity: opacity }
                })
                console.log('Successfully updated shape opacity')
              } catch (error) {
                console.error('Error updating shape opacity:', error)
              }
            }
          })
        } else {
          console.log('No shapes selected')
        }
      } catch (error) {
        console.error('Error in handleOpacitySelect:', error)
      }
    } else {
      console.log('No editor instance')
    }
    setShowOpacityMenu(false)
  }

  // Handle zoom in
  const handleZoomIn = () => {
    if (!editor) return
    const newZoom = Math.min(zoomLevel + 0.25, 4)
    setZoomLevel(newZoom)
    editor.setCamera({ x: editor.getCamera().x, y: editor.getCamera().y, z: newZoom })
  }

  // Handle zoom out
  const handleZoomOut = () => {
    if (!editor) return
    const newZoom = Math.max(zoomLevel - 0.25, 0.25)
    setZoomLevel(newZoom)
    editor.setCamera({ x: editor.getCamera().x, y: editor.getCamera().y, z: newZoom })
  }

  // Handle fit to screen
  const handleFitToScreen = () => {
    if (!editor) return
    editor.zoomToFit()
    setZoomLevel(editor.getCamera().z)
  }

  // Handle undo
  const handleUndo = () => {
    if (!editor || isReadOnly) return
    editor.undo()
  }

  // Handle redo
  const handleRedo = () => {
    if (!editor || isReadOnly) return
    editor.redo()
  }

  // Get current tool display name
  const getToolDisplayName = () => {
    if (activeTool === 'shape') {
      return 'Shapes'
    }
    const toolNames = {
      'select': 'Select',
      'draw': 'Pen',
      'eraser': 'Eraser',
      'lasso': 'Lasso',
      'note': 'Sticky Note',
      'hand': 'Hand'
    }
    return toolNames[activeTool] || 'Select'
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-2">
        
        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg mr-2 transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {getToolDisplayName()}
          </span>
        </div>
        
        <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
        {/* Drawing Tools Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToolSelect('select')}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'select'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Select Tool (V)"
          >
            <MousePointer className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleToolSelect('draw')}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'draw'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Pen Tool (P)"
          >
            <Pen className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleToolSelect('eraser')}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'eraser'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Eraser Tool (E)"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleToolSelect('lasso')}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'lasso'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Lasso Select (L)"
          >
            <Lasso className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleToolSelect('hand')}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'hand'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Hand Tool (H)"
          >
            <Hand className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* Shapes & Notes Group */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowShapeMenu(!showShapeMenu)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                activeTool === 'shape'
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Shapes"
            >
              <Square className="w-5 h-5" />
            </button>

            {showShapeMenu && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[320px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 text-center">Shapes</div>
                <div className="grid grid-cols-4 gap-4">
                  {SHAPES.map((shape) => {
                    const Icon = shape.icon
                    return (
                      <button
                        key={shape.value}
                        onClick={() => handleShapeSelect(shape.value)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group hover:scale-105"
                      >
                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 group-hover:from-brand-100 group-hover:to-brand-200 dark:group-hover:from-brand-900/30 dark:group-hover:to-brand-800/30 transition-all duration-200 shadow-sm group-hover:shadow-md">
                          <Icon className="w-7 h-7 text-slate-600 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{shape.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStickyNote}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              activeTool === 'note'
                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Sticky Note (N)"
          >
            <StickyNote className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* Style Controls Group */}
        <div className="flex items-center gap-1">
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showColorPicker
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Color"
            >
              <Palette className="w-5 h-5" />
            </button>

            {showColorPicker && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[280px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 text-center">Stroke Color</div>
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
          </div>

          {/* Size Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSizeMenu(!showSizeMenu)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showSizeMenu
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Size"
            >
              <Circle className="w-5 h-5" />
            </button>

            {showSizeMenu && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 text-center">Stroke Width</div>
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
            )}
          </div>

          {/* Dash Style */}
          <div className="relative">
            <button
              onClick={() => setShowDashMenu(!showDashMenu)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showDashMenu
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Line Style"
            >
              <Minus className="w-5 h-5" />
            </button>

            {showDashMenu && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[160px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">Line Style</div>
                <div className="space-y-1">
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
          </div>

          {/* Fill Style */}
          <div className="relative">
            <button
              onClick={() => setShowFillMenu(!showFillMenu)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showFillMenu
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Fill"
            >
              <Droplets className="w-5 h-5" />
            </button>

            {showFillMenu && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[160px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">Fill Style</div>
                <div className="space-y-1">
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
          </div>

          {/* Opacity */}
          <div className="relative">
            <button
              onClick={() => setShowOpacityMenu(!showOpacityMenu)}
              disabled={isReadOnly}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showOpacityMenu
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Opacity"
            >
              <Eye className="w-5 h-5" />
            </button>

            {showOpacityMenu && !isReadOnly && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[240px]">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 text-center">Opacity</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={OPACITY_MIN}
                    max={OPACITY_MAX}
                    step={OPACITY_STEP}
                    value={Math.round(selectedOpacity * 100)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) / 100
                      handleOpacitySelect(value)
                    }}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[40px] text-right">
                    {Math.round(selectedOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* Actions Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onImageUpload}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Upload Image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          
          <button
            onClick={onSearch}
            className="p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Search in Canvas"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={onExport}
            className="p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Export as PNG"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* History Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isReadOnly
                ? 'opacity-50 cursor-not-allowed text-slate-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={isReadOnly}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isReadOnly
                ? 'opacity-50 cursor-not-allowed text-slate-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* View Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
            title="Fit to Screen"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

        {/* Read-Only Toggle */}
        <button
          onClick={toggleReadOnly}
          className={`p-3 rounded-xl transition-all duration-200 ${
            isReadOnly
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={isReadOnly ? 'Unlock Canvas' : 'Lock Canvas'}
        >
          {isReadOnly ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

export default CanvasToolbar